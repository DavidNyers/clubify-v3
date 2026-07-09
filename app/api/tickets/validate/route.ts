import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTicketPayload } from '@/lib/tickets/generate'
import { ticketValidationSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qr_payload } = ticketValidationSchema.parse(body)

    // 1. Verify JWT signature
    const decoded = await verifyTicketPayload(qr_payload)
    if (!decoded) {
      return NextResponse.json({
        valid: false,
        reason: 'invalid_signature',
        message: '🚫 Ungültiges Ticket — Signatur fehlerhaft',
      }, { status: 400 })
    }

    const supabase = createAdminClient()
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const device = request.headers.get('user-agent') ?? 'unknown'

    // 2. Load ticket from DB
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('id, status, event_id, user_id, ticket_uuid, events(name, date)')
      .eq('id', decoded.ticketId)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ valid: false, reason: 'not_found', message: '🚫 Ticket nicht gefunden' }, { status: 404 })
    }

    // 3. Check status
    if (ticket.status === 'used') {
      // Log fraud attempt
      await supabase.from('fraud_logs').insert({
        ticket_id: ticket.id,
        attempted_at: new Date().toISOString(),
        device_info: device,
        ip_address: ip,
        reason: 'already_used',
      })
      return NextResponse.json({
        valid: false,
        reason: 'already_used',
        message: '❌ Ticket wurde bereits verwendet',
        ticket: { id: ticket.id, event: (ticket as any).events?.name },
      }, { status: 409 })
    }

    if (ticket.status === 'expired') {
      return NextResponse.json({ valid: false, reason: 'expired', message: '⏰ Ticket ist abgelaufen' }, { status: 410 })
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ valid: false, reason: 'cancelled', message: '⛔ Ticket wurde storniert' }, { status: 410 })
    }

    // 4. Check bouncer is authorized for this event (optional — skip for now if no bouncer_id provided)
    const bouncerIdHeader = request.headers.get('x-bouncer-id')
    if (bouncerIdHeader) {
      const { data: assignment } = await supabase
        .from('bouncer_assignments')
        .select('id')
        .eq('bouncer_id', bouncerIdHeader)
        .eq('event_id', ticket.event_id)
        .single()

      if (!assignment) {
        return NextResponse.json({ valid: false, reason: 'unauthorized', message: '🚫 Nicht für dieses Event autorisiert' }, { status: 403 })
      }
    }

    // 5. Mark ticket as used
    await supabase.from('tickets').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', ticket.id)

    // 6. Create check-in record
    const { data: checkin } = await supabase.from('checkins').insert({
      ticket_id: ticket.id,
      bouncer_id: bouncerIdHeader ?? null,
      checked_in_at: new Date().toISOString(),
      device_info: device,
      ip_address: ip,
    }).select().single()

    // 7. Update tickets_sold counter on event (graceful fail)
    try { await supabase.rpc('increment_tickets_sold' as any, { event_id_input: ticket.event_id, qty_input: 1 }) } catch {}

    return NextResponse.json({
      valid: true,
      message: '✅ Ticket gültig — Einlass gewährt!',
      ticket: {
        id: ticket.id,
        uuid: ticket.ticket_uuid,
        event: (ticket as any).events?.name,
        event_date: (ticket as any).events?.date,
      },
      checkin: { id: checkin?.id, checked_in_at: checkin?.checked_in_at },
    })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ valid: false, message: 'Ungültige Eingabe' }, { status: 400 })
    }
    console.error('Ticket validation error:', err)
    return NextResponse.json({ valid: false, message: 'Server-Fehler' }, { status: 500 })
  }
}
