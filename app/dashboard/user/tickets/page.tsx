import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import TicketCard from '@/components/tickets/TicketCard'
import { Ticket, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default async function UserTicketsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id, ticket_uuid, qr_payload, status, created_at,
      events(name, date, clubs(name, address))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const active = tickets?.filter(t => t.status === 'valid') ?? []
  const past = tickets?.filter(t => t.status !== 'valid') ?? []

  return (
    <div style={{ padding: 32, flex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Meine Tickets</h1>
        <p style={{ color: '#64748b' }}>{tickets?.length ?? 0} Ticket(s) insgesamt</p>
      </div>

      {!tickets?.length ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Ticket size={48} style={{ color: '#334155', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>Noch keine Tickets</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Entdecke Events und kaufe dein erstes Ticket!</p>
          <Link href="/events" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
            Events entdecken
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Aktive Tickets ({active.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {active.map(ticket => <TicketCard key={ticket.id} ticket={ticket as any} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#475569', display: 'inline-block' }} />
                Vergangene Tickets ({past.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {past.map(ticket => <TicketCard key={ticket.id} ticket={ticket as any} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
