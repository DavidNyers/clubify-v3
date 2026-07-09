import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, MapPin, Star, Eye, ExternalLink, Settings, MoreHorizontal } from 'lucide-react'

export default async function MyVenuesPage() {
  const user = await getUser()
  if (!user || !['club_owner', 'bar_owner', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, slug, city, status, avg_rating, review_count, view_count, capacity, images')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: bars } = await supabase
    .from('bars')
    .select('id, name, slug, city, status, avg_rating, review_count, view_count, capacity, images')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const allVenues = [
    ...(clubs || []).map(v => ({ ...v, type: 'club' })),
    ...(bars || []).map(v => ({ ...v, type: 'bar' }))
  ]

  return (
    <div style={{ padding: '32px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Meine Locations</h1>
          <p style={{ color: '#64748b' }}>Verwalte deine Clubs und Bars auf Clubify</p>
        </div>
        <Link href="/dashboard/admin/applications" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          Weitere Location beantragen
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {allVenues.map(venue => (
          <div 
            key={venue.id} 
            className="glass"
            style={{ 
              background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Image placeholder / Preview */}
            <div style={{ height: 160, background: 'rgba(0,0,0,0.3)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <div style={{ 
                position: 'absolute', top: 16, right: 16, padding: '4px 12px', borderRadius: 20, 
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                background: venue.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
                color: venue.status === 'published' ? '#4ade80' : '#94a3b8',
                border: venue.status === 'published' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(148,163,184,0.3)'
              }}>
                {venue.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 24, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{venue.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                    <MapPin size={14} /> {venue.city || 'Keine Stadt angegeben'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1rem' }}>★ {venue.avg_rating?.toFixed(1) || '0.0'}</div>
                   <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{venue.review_count || 0} Reviews</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 4 }}>Besucher</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{venue.view_count?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 4 }}>Kapazität</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{venue.capacity || '—'}</div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
              <Link 
                href={`/dashboard/club-owner/clubs/${venue.id}/edit`} 
                style={{ 
                  flex: 1, textAlign: 'center', padding: '10px', borderRadius: 12, 
                  background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem'
                }}
              >
                Bearbeiten
              </Link>
              <Link 
                href={venue.type === 'club' ? `/clubs/${venue.slug}` : `/bars/${venue.slug}`}
                style={{ 
                  padding: '10px 16px', borderRadius: 12, 
                  background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ExternalLink size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {allVenues.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(30, 41, 59, 0.2)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Building2 size={48} style={{ color: '#334155', margin: '0 auto 20px' }} />
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>Noch keine Locations</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Beantrage deine erste Location, um Events zu erstellen.</p>
          <Link href="/apply" className="btn btn-primary">Jetzt Partner werden</Link>
        </div>
      )}
    </div>
  )
}
