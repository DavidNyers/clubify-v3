import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTicketPayload } from '@/lib/tickets/generate'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { booking_id, user_id, event_id, quantity } = session.metadata ?? {}

      if (!booking_id || !user_id || !event_id) break

      // 1. Update booking status
      await admin.from('bookings').update({ status: 'confirmed' }).eq('id', booking_id)

      // 2. Update payment
      await admin.from('payments').update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
      }).eq('stripe_session_id', session.id)

      // 3. Generate tickets
      const qty = parseInt(quantity ?? '1', 10)
      const ticketInserts = []
      for (let i = 0; i < qty; i++) {
        const qrPayload = await generateTicketPayload(
          `pending-${booking_id}-${i}`, // will be updated after insert
          event_id
        )
        ticketInserts.push({
          booking_id,
          user_id,
          event_id,
          qr_payload: qrPayload,
          status: 'valid',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
        })
      }

      const { data: tickets } = await admin.from('tickets').insert(ticketInserts).select()

      // 4. Re-sign tickets with real IDs
      if (tickets) {
        for (const ticket of tickets) {
          const realPayload = await generateTicketPayload(ticket.id, event_id)
          await admin.from('tickets').update({ qr_payload: realPayload }).eq('id', ticket.id)
        }
      }

      // 5. Update tickets_sold on event (graceful fail if RPC not set up)
      try { await admin.rpc('increment_tickets_sold' as any, { event_id_input: event_id, qty_input: qty }) } catch {}

      // 6. Create notification
      await admin.from('notifications').insert({
        user_id,
        type: 'ticket_purchased',
        title: '🎟 Ticket erfolgreich gekauft!',
        message: `Deine ${qty} Ticket(s) sind bereit. Zeige deinen QR-Code am Eingang.`,
        data: { booking_id, event_id, ticket_count: qty },
        read: false,
      })

      console.log(`✅ ${qty} Ticket(s) für Booking ${booking_id} erstellt`)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const supabaseUserId = sub.metadata.user_id
      const tier = sub.metadata.tier || 'premium'
      
      if (supabaseUserId) {
        await admin.from('users').update({
          alliance_tier: tier,
          alliance_status: sub.status === 'active' ? 'active' : 'past_due',
          alliance_expiration: new Date((sub as any).current_period_end * 1000).toISOString()
        }).eq('id', supabaseUserId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const supabaseUserId = sub.metadata.user_id
      
      if (supabaseUserId) {
        await admin.from('users').update({
          alliance_tier: 'none',
          alliance_status: 'canceled',
          alliance_expiration: null
        }).eq('id', supabaseUserId)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      // Find booking by payment intent
      const { data: payment } = await admin
        .from('payments').select('booking_id').eq('stripe_payment_intent_id', intent.id).single()

      if (payment?.booking_id) {
        await admin.from('bookings').update({ status: 'cancelled' }).eq('id', payment.booking_id)
        await admin.from('payments').update({ status: 'failed' }).eq('stripe_payment_intent_id', intent.id)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const { data: payment } = await admin
        .from('payments').select('id, booking_id, user_id').eq('stripe_charge_id', charge.id).single()

      if (payment) {
        await admin.from('payments').update({
          status: 'refunded',
          refunded: true,
          refund_amount: charge.amount_refunded / 100,
          refunded_at: new Date().toISOString(),
        }).eq('id', payment.id)

        await admin.from('bookings').update({ status: 'refunded' }).eq('id', payment.booking_id)

        // Cancel tickets
        await admin.from('tickets').update({ status: 'cancelled' }).eq('booking_id', payment.booking_id)

        // Notify user
        if (payment.user_id) {
          await admin.from('notifications').insert({
            user_id: payment.user_id,
            type: 'refund_processed',
            title: '💰 Rückerstattung verarbeitet',
            message: `Deine Rückerstattung von €${charge.amount_refunded / 100} wurde bearbeitet.`,
            data: { payment_id: payment.id },
            read: false,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
