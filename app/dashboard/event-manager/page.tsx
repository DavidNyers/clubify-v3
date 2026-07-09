import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Ticket, Users, CreditCard, Plus, Clock } from 'lucide-react'

export default async function EventManagerDashboard() {
  const user = await getUser()
  if (!user || !['event_manager', 'club_owner', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events').select('id, name, slug, date, status, max_guests, tickets_sold, ticket_price')
    .eq('manager_id', user.id).order('date', { ascending: true })

  const upcoming = events?.filter(e => new Date(e.date) > new Date()) ?? []
  const today = new Date().toDateString()
  const todayEvents = events?.filter(e => new Date(e.date).toDateString() === today) ?? []

  const { count: checkinCount } = await supabase
    .from('checkins').select('*', { count: 'exact', head: true })
    .gte('checked_in_at', new Date().toISOString().split('T')[0])

  return (
    <div style={{ padding: 32, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Event Manager Dashboard</h1>
          <p style={{ color: '#64748b' }}>Verwalte Events, Tickets und Türsteher</p>
        </div>
        <Link href="/dashboard/event-manager/events/new" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
          <Plus size={16} /> Neues Event
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Meine Events', value: events?.length ?? 0, icon: Calendar, color: '#60a5fa' },
          { label: 'Kommende Events', value: upcoming.length, icon: Clock, color: '#8b5cf6' },
          { label: 'Tickets verkauft', value: events?.reduce((a, e) => a + (e.tickets_sold ?? 0), 0) ?? 0, icon: Ticket, color: '#ec4899' },
          { label: 'Check-ins heute', value: checkinCount ?? 0, icon: Users, color: '#22d3ee' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{stat.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Kommende Events</h2>
          <Link href="/dashboard/event-manager/events" style={{ color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none' }}>Alle Events →</Link>
        </div>
        {!events?.length ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Calendar size={40} style={{ color: '#334155', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#64748b', marginBottom: 16 }}>Noch keine Events erstellt</p>
            <Link href="/dashboard/event-manager/events/new" style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Erstes Event erstellen</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Event', 'Datum', 'Status', 'Tickets', 'Preis', 'Aktionen'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 8).map(event => {
                  const d = new Date(event.date)
                  const soldPct = event.max_guests ? Math.round((event.tickets_sold / event.max_guests) * 100) : 0
                  return (
                    <tr key={event.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem' }}>{event.name}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {d.toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: '2-digit' })} {d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: event.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)', color: event.status === 'published' ? '#22c55e' : '#94a3b8' }}>
                          {event.status === 'published' ? 'Live' : 'Entwurf'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.875rem', color: '#f1f5f9', marginBottom: 4 }}>{event.tickets_sold ?? 0} / {event.max_guests ?? '∞'}</div>
                        {event.max_guests && (
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${soldPct}%`, background: soldPct > 80 ? '#f87171' : soldPct > 50 ? '#fbbf24' : '#22c55e', borderRadius: 2 }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#22d3ee', fontSize: '0.875rem', fontWeight: 600 }}>€{event.ticket_price}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/dashboard/event-manager/events/${event.id}/edit`} style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>Bearbeiten</Link>
                          <Link href={`/dashboard/event-manager/checkins?event=${event.id}`} style={{ fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>Check-ins</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
