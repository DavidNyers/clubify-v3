import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, MapPin, Star, Eye, Users, Calendar, ArrowRight, Ticket, Shield } from 'lucide-react'
import { getAllianceBenefitTypes, getVenueAllianceSettings } from '@/lib/actions/alliance/AllianceActions'
import AllianceVenueSettings from '@/components/admin/alliance/AllianceVenueSettings'

export default async function ClubOwnerDashboard() {
  const user = await getUser()
  if (!user || !['club_owner', 'bar_owner', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()

  // Fetch data
  const [
    { data: clubs }, 
    { data: events },
    { data: statsData }
  ] = await Promise.all([
    supabase.from('clubs').select('id, name, slug, city, status, avg_rating, review_count, view_count, capacity').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('events').select('*, clubs(name)').eq('manager_id', user.id).gt('date', new Date().toISOString()).order('date', { ascending: true }).limit(3),
    supabase.from('events').select('id').eq('manager_id', user.id), // Just to count all events
    getAllianceBenefitTypes()
  ])

  // Get alliance data for each club (handling first club for simplicity in dashboard view)
  const firstClub = clubs?.[0]
  const allianceData = firstClub ? await getVenueAllianceSettings(firstClub.id, 'club') : null

  const stats = [
    { label: 'Meine Locations', value: clubs?.length ?? 0, icon: Building2, color: '#8b5cf6' },
    { label: 'Geplante Events', value: events?.length ?? 0, icon: Calendar, color: '#ec4899' },
    { label: 'Besucher gesamt', value: clubs?.reduce((a, c) => a + (c.view_count ?? 0), 0) ?? 0, icon: Eye, color: '#22d3ee' },
    { label: 'Ø Bewertung', value: clubs?.length ? ((clubs.reduce((a, c) => a + (c.avg_rating ?? 0), 0)) / clubs.length).toFixed(1) : '—', icon: Star, color: '#fbbf24' },
  ]

  return (
    <div style={{ padding: '32px', flex: 1, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Willkommen zurück, {user.full_name?.split(' ')[0]}</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Verwalte dein Business auf Clubify.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard/club-owner/events/new" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Calendar size={16} /> Event planen
          </Link>
          <Link href="/dashboard/club-owner/clubs/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Plus size={16} /> Location hinzufügen
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{stat.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* My Clubs Table */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Meine Locations</h2>
            <Link href="/dashboard/club-owner/clubs" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>Alle verwalten →</Link>
          </div>
          {clubs?.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Building2 size={40} style={{ color: '#334155', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: '#64748b', marginBottom: 16 }}>Noch keine Locations erstellt</p>
              <Link href="/dashboard/club-owner/clubs/new" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                Jetzt hinzufügen
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    {['Name', 'Status', 'Besucher', 'Aktionen'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clubs?.slice(0, 5).map(club => (
                    <tr key={club.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>{club.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: club.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                          color: club.status === 'published' ? '#22c55e' : '#94a3b8',
                        }}>{club.status === 'published' ? 'Live' : 'Draft'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{club.view_count?.toLocaleString() ?? 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/dashboard/club-owner/clubs/${club.id}/edit`} style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>Bearbeiten</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Anstehende Events</h2>
              <Link href="/dashboard/club-owner/events" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>Alle →</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events?.map(event => (
                <div key={event.id} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{event.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                       {new Date(event.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} • @{event.clubs?.name}
                     </div>
                     <Link href={`/dashboard/club-owner/events/${event.id}/edit`} style={{ color: '#a78bfa' }}><ArrowRight size={14} /></Link>
                  </div>
                </div>
              ))}
              {events?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>Keine anstehenden Events</p>
                  <Link href="/dashboard/club-owner/events/new" style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>Event erstellen</Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 16, padding: '20px' }}>
             <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
               <Star size={14} className="text-violet" /> Partner-Tipp
             </h3>
             <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.5 }}>
               Vervollständige deine Club-Details und lade hochwertige Bilder hoch, um mehr Besucher anzuziehen.
             </p>
          </div>
        </div>
      </div>

      {/* Alliance Program Section */}
      {firstClub && (
        <div style={{ marginTop: 40 }}>
          <AllianceVenueSettings 
            targetId={firstClub.id}
            targetType="club"
            initialSettings={allianceData!}
            allBenefitTypes={statsData as any}
          />
        </div>
      )}
    </div>
  )
}
