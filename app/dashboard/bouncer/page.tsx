import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { QrCode, Calendar, CheckCircle, Users, ArrowRight } from 'lucide-react'

export default async function BouncerDashboard() {
  const user = await getUser()
  if (!user || !['bouncer', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()

  // Get assigned events
  const { data: assignments } = await supabase
    .from('bouncer_assignments')
    .select('event_id, events(id, name, slug, date, max_guests, tickets_sold, status)')
    .eq('bouncer_id', user.id)
    .order('assigned_at', { ascending: false })

  const events = assignments?.map((a: any) => a.events).filter(Boolean) ?? []
  const upcoming = events.filter((e: any) => new Date(e.date) > new Date())

  // Today's checkins by this bouncer
  const { count: todayCheckins } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('bouncer_id', user.id)
    .gte('checked_in_at', new Date().toISOString().split('T')[0])

  return (
    <div style={{ padding: 32, flex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Türsteher Dashboard</h1>
        <p style={{ color: '#64748b' }}>Wähle ein Event und starte den QR-Scanner</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Zugewiesene Events', value: events.length, icon: Calendar, color: '#8b5cf6' },
          { label: 'Heute Check-ins', value: todayCheckins ?? 0, icon: CheckCircle, color: '#22c55e' },
          { label: 'Kommende Events', value: upcoming.length, icon: Users, color: '#fbbf24' },
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

      {/* QR Scanner Quick Launch */}
      <Link href="/dashboard/bouncer/scan" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))',
          border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: 24,
          display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.2s',
          cursor: 'pointer',
        }}
          className="hover-border-violet"
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'pulse-glow 2s ease-in-out infinite' }}>
            <QrCode size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>QR-Scanner starten</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Kamera öffnen und Tickets scannen</p>
          </div>
          <ArrowRight size={20} style={{ color: '#a78bfa' }} />
        </div>
      </Link>

      {/* Assigned Events */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Meine Events</h2>
        </div>
        {!events.length ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Calendar size={40} style={{ color: '#334155', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#64748b' }}>Noch keinem Event zugewiesen.</p>
            <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>Bitte wende dich an den Event Manager.</p>
          </div>
        ) : (
          events.map((event: any) => {
            const d = new Date(event.date)
            const isPast = d < new Date()
            const soldPct = event.max_guests ? Math.round((event.tickets_sold / event.max_guests) * 100) : 0

            return (
              <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isPast ? 0.5 : 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: isPast ? 'rgba(100,116,139,0.15)' : 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={20} style={{ color: isPast ? '#64748b' : '#a78bfa' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 600, marginBottom: 2 }}>{event.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: 'short' })} • {d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.max_guests && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${soldPct}%`, background: soldPct > 80 ? '#f87171' : '#22c55e', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>{event.tickets_sold}/{event.max_guests}</span>
                    </div>
                  )}
                </div>
                {!isPast && (
                  <Link href={`/dashboard/bouncer/scan?event=${event.id}`} style={{ fontSize: '0.8rem', color: '#a78bfa', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <QrCode size={14} /> Scannen
                  </Link>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
