import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { z } from 'zod'
import { generateTicketPayload } from '@/lib/tickets/generate'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'mock_key'
const stripe = new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' })

const checkoutSchema = z.object({
  event_id: z.string().uuid().optional(),
  type: z.enum(['ticket', 'alliance_subscription']).default('ticket'),
  quantity: z.number().int().min(1).max(10).default(1),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await request.json()
    const { event_id, type, quantity } = checkoutSchema.parse(body)

    const isMockMode = !process.env.STRIPE_SECRET_KEY || 
                       process.env.STRIPE_SECRET_KEY.includes('...') || 
                       process.env.STRIPE_SECRET_KEY.includes('your-') ||
                       process.env.STRIPE_SECRET_KEY === 'mock_key';

    const admin = createAdminClient()
    
    // Load user profile for Stripe customer
    const { data: profile } = await admin.from('users').select('stripe_customer_id, email, full_name').eq('id', user.id).single()

    // Create or get Stripe customer
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? '',
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // --- CASE 1: TICKET PURCHASE ---
    if (type === 'ticket' && event_id) {
      const { data: event } = await admin
        .from('events')
        .select('id, name, ticket_price, currency, max_guests, tickets_sold, status, images, date')
        .eq('id', event_id)
        .eq('status', 'published')
        .single()

      if (!event) return NextResponse.json({ error: 'Event nicht gefunden' }, { status: 404 })
      
      const available = (event.max_guests ?? Infinity) - (event.tickets_sold ?? 0)
      if (available < quantity) return NextResponse.json({ error: `Nur noch ${available} Tickets verfügbar` }, { status: 400 })

      if (isMockMode) {
        const { data: booking } = await admin.from('bookings').insert({
          user_id: user.id, event_id, guests: quantity, status: 'confirmed',
        }).select().single()

        await admin.from('payments').insert({
          user_id: user.id, booking_id: booking!.id, stripe_session_id: 'mock-session-' + booking!.id,
          stripe_payment_intent_id: 'mock-intent-' + booking!.id,
          amount: (event.ticket_price ?? 0) * quantity, currency: event.currency ?? 'EUR', status: 'paid',
        })

        const qty = quantity
        const ticketInserts = []
        for (let i = 0; i < qty; i++) {
          const qrPayload = await generateTicketPayload(
            `pending-${booking!.id}-${i}`,
            event_id
          )
          ticketInserts.push({
            booking_id: booking!.id,
            user_id: user.id,
            event_id,
            qr_payload: qrPayload,
            status: 'valid',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          })
        }

        const { data: tickets } = await admin.from('tickets').insert(ticketInserts).select()

        if (tickets) {
          for (const ticket of tickets) {
            const realPayload = await generateTicketPayload(ticket.id, event_id)
            await admin.from('tickets').update({ qr_payload: realPayload }).eq('id', ticket.id)
          }
        }

        try { await admin.rpc('increment_tickets_sold' as any, { event_id_input: event_id, qty_input: qty }) } catch {}

        await admin.from('notifications').insert({
          user_id: user.id,
          type: 'ticket_purchased',
          title: '🎟 Ticket erfolgreich gekauft (Demo)!',
          message: `Deine ${qty} Ticket(s) sind bereit. Zeige deinen QR-Code am Eingang.`,
          data: { booking_id: booking!.id, event_id, ticket_count: qty },
          read: false,
        })

        return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/tickets?success=1` })
      }

      const { data: booking } = await admin.from('bookings').insert({
        user_id: user.id, event_id, guests: quantity, status: 'pending',
      }).select().single()

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: event.currency?.toLowerCase() ?? 'eur',
            product_data: {
              name: event.name,
              description: `Event am ${new Date(event.date).toLocaleDateString('de-AT')} • ${quantity} Ticket(s)`,
              images: event.images?.[0] ? [event.images[0]] : [],
            },
            unit_amount: Math.round((event.ticket_price ?? 0) * 100),
          },
          quantity,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/tickets?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event_id}?cancelled=1`,
        metadata: {
          booking_id: booking!.id, user_id: user.id, event_id, quantity: String(quantity),
          type: 'ticket'
        },
      })

      await admin.from('payments').insert({
        user_id: user.id, booking_id: booking!.id, stripe_session_id: session.id,
        amount: (event.ticket_price ?? 0) * quantity, currency: event.currency ?? 'EUR', status: 'pending',
      })

      return NextResponse.json({ url: session.url })
    }

    // --- CASE 2: ALLIANCE SUBSCRIPTION ---
    if (type === 'alliance_subscription') {
      const tier = body.tier || 'premium'
      
      const tierPricing: Record<string, { name: string, amount: number }> = {
        explorer: { name: 'Clubify Alliance Explorer', amount: 999 }, // 9.99€
        premium: { name: 'Clubify Alliance Premium', amount: 2999 }, // 29.99€
        elite: { name: 'Clubify Alliance Elite', amount: 5999 }, // 59.99€
      }

      const selectedTier = tierPricing[tier] || tierPricing.premium

      if (isMockMode) {
        await admin.from('users').update({
          alliance_tier: tier,
          alliance_status: 'active',
          alliance_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', user.id)

        return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/alliance?success=1` })
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: selectedTier.name,
              description: 'Exklusiver Zugang zu Clubs & Bars. Freier Eintritt, Drinks & mehr.',
            },
            unit_amount: selectedTier.amount,
            recurring: { interval: 'month' }
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/alliance?success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/alliance?cancelled=1`,
        metadata: {
          user_id: user.id,
          type: 'alliance_subscription',
          tier: tier
        },
      })

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 })
  }
}
