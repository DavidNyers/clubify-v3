import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  Users, Building2, Calendar, CreditCard, AlertTriangle, 
  TrendingUp, Shield, Activity, ClipboardList, LayoutDashboard, 
  Clock, MapPin, ChevronRight, Zap
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/dashboard/user')

  const supabase = await createClient()

  // Periods for live/growth calculation
  const now = new Date()
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: userCount },
    { count: pendingAppsCount },
    { count: onlineUsersCount },
    { count: usersThisWeek },
    { count: usersLastWeek },
    { data: recentUsers },
    { data: recentApps },
    { data: sessionStats },
    { data: latestSettlement },
    { count: explorerCount },
    { count: premiumCount },
    { count: eliteCount }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('venue_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('*', { count: 'exact', head: true }).gt('last_active_at', fifteenMinsAgo),
    supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', sevenDaysAgo),
    supabase.from('users').select('*', { count: 'exact', head: true }).lt('created_at', sevenDaysAgo).gt('created_at', fourteenDaysAgo),
    supabase.from('users').select('id, email, role, full_name, created_at, avatar_url').order('created_at', { ascending: false }).limit(5),
    supabase.from('venue_applications').select('id, venue_name, contact_name, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('user_sessions').select('duration_seconds').limit(500),
    supabase.from('alliance_monthly_settlements').select('alliance_pool').order('month_start', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('users').select('alliance_tier', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'explorer').eq('is_alliance_gifted', false),
    supabase.from('users').select('alliance_tier', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'premium').eq('is_alliance_gifted', false),
    supabase.from('users').select('alliance_tier', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'elite').eq('is_alliance_gifted', false)
  ])

  // Calculate Live Pool Estimate
  const liveRevenue = 
    ((explorerCount || 0) * 9.99) + 
    ((premiumCount || 0) * 29.99) + 
    ((eliteCount || 0) * 59.99)
  const livePoolEstimate = liveRevenue * 0.80

  // Calculate Growth Rate
  const userGrowth = usersLastWeek && usersLastWeek > 0 
    ? Math.round(((usersThisWeek || 0) - usersLastWeek) / usersLastWeek * 100) 
    : (usersThisWeek || 0) > 0 ? 100 : 0
  
  // Calculate Avg Session Duration
  const totalDuration = sessionStats?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0
  const avgDuration = sessionStats && sessionStats.length > 0 ? Math.round(totalDuration / sessionStats.length / 60) : 0

  const stats = [
    { 
      label: 'Benutzer', 
      value: userCount ?? 0, 
      icon: Users, 
      color: '#8b5cf6', 
      href: '/dashboard/admin/users', 
      growth: userGrowth 
    },
    { 
      label: 'Offene Bewerbungen', 
      value: pendingAppsCount ?? 0, 
      icon: ClipboardList, 
      color: (pendingAppsCount || 0) > 0 ? '#f59e0b' : '#10b981', 
      href: '/dashboard/admin/applications',
      badge: (pendingAppsCount || 0) > 0 ? 'Aktion nötig' : 'Alles aktuell'
    },
    { 
      label: 'Gerade Online', 
      value: onlineUsersCount ?? 0, 
      icon: Activity, 
      color: '#22c55e', 
      href: '/dashboard/admin/users/map',
      pulse: true
    },
    { 
      label: 'Ø Sitzung', 
      value: `${avgDuration} Min`, 
      icon: Clock, 
      color: '#22d3ee', 
      href: '/dashboard/admin/analytics/usage'
    },
    { 
      label: 'Alliance Pool', 
      value: `€${livePoolEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: Shield, 
      color: '#a78bfa', 
      href: '/dashboard/admin/alliance',
      badge: 'Live-Schätzung'
    },
  ]

  return (
    <div style={{ padding: '32px 32px', flex: 1, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>Command Center</h1>
          <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>Echtzeit-Übersicht deiner Clubify Community.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard/admin/users/map" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, fontWeight: 700, textDecoration: 'none' }}>
            <MapPin size={18} />
            Livedaten ansehen
          </Link>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 48 }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="glass hover-translate" style={{ 
              background: 'linear-gradient(135deg, rgba(var(--bg-surface), 0.7), rgba(var(--bg-surface), 0.3))', 
              border: '1px solid rgb(var(--border))', 
              borderRadius: 24, padding: '28px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Background accent */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: stat.color, opacity: 0.05, filter: 'blur(30px)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${stat.color}30` }}>
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
                {stat.growth !== undefined && (
                  <div style={{ padding: '6px 10px', borderRadius: 20, background: stat.growth >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: stat.growth >= 0 ? '#10b981' : '#f87171', fontSize: '0.75rem', fontWeight: 800 }}>
                    {stat.growth >= 0 ? '↑' : '↓'} {Math.abs(stat.growth)}%
                  </div>
                )}
                {stat.badge && (
                  <div style={{ padding: '6px 10px', borderRadius: 20, background: stat.color + '15', color: stat.color, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {stat.badge}
                  </div>
                )}
                {stat.pulse && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="pulse-slow" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>Live</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'white', marginBottom: 4 }}>{stat.value.toLocaleString()}</div>
              <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', fontWeight: 600 }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 32 }}>
        
        {/* Left Column: Recent Applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ClipboardList size={20} style={{ color: '#ec4899' }} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Neueste Bewerbungen</h2>
               </div>
               <Link href="/dashboard/admin/applications" style={{ color: '#8b5cf6', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>Alle prüfen →</Link>
            </div>
            <div style={{ padding: '12px 0' }}>
               {(recentApps ?? []).map(app => (
                 <Link key={app.id} href={`/dashboard/admin/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                    <div className="hover-bg-elevated" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0 }}>
                        <Building2 size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{app.venue_name}</div>
                         <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{app.contact_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ 
                           fontSize: '0.65rem', fontWeight: 800, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase',
                           background: app.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                           color: app.status === 'pending' ? '#f59e0b' : '#22c55e',
                           marginBottom: 4
                         }}>
                           {app.status}
                         </div>
                         <div style={{ fontSize: '0.7rem', color: 'rgb(var(--text-muted))' }}>{new Date(app.created_at).toLocaleDateString('de-AT')}</div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'rgb(var(--text-muted))' }} />
                    </div>
                 </Link>
               ))}
               {(!recentApps || recentApps.length === 0) && (
                 <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.9rem' }}>
                   Keine neuen Bewerbungen vorhanden.
                 </div>
               )}
            </div>
          </div>

          {/* Quick Stats: Mini Map Entry */}
          <Link href="/dashboard/admin/users/map" style={{ textDecoration: 'none' }}>
            <div className="glass hover-translate" style={{ 
              background: 'linear-gradient(90deg, #1e1b4b, #312e81)', 
              borderRadius: 24, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20,
              border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={28} style={{ color: '#a78bfa' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>Visualisierter Live-Monitor</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Verfolge User-Aktivitäten weltweit in Echtzeit auf der interaktiven Karte.</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{onlineUsersCount ?? 0} LIVE</div>
            </div>
          </Link>
        </div>

        {/* Right Column: New Users & Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Recent Users List */}
          <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Users size={20} style={{ color: '#8b5cf6' }} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Neue Benutzer</h2>
               </div>
               <Link href="/dashboard/admin/users" style={{ color: '#8b5cf6', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>Alle verwalten →</Link>
            </div>
            <div style={{ padding: '8px 0' }}>
              {(recentUsers ?? []).map(u => (
                <Link key={u.id} href={`/dashboard/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg-elevated" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 32px', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>
                      {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} /> : (u.full_name?.[0]?.toUpperCase() ?? u.email[0].toUpperCase())}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name ?? u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>{u.role.replace('_', ' ')}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 600 }}>
                      {new Date(u.created_at).toLocaleDateString('de-AT')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions (Modern Tiles) */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} style={{ color: '#f59e0b' }} />
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { href: '/dashboard/admin/applications', label: 'Bewerbungen', icon: Shield, color: '#ec4899', desc: 'Prüfen & Freischalten' },
                { href: '/dashboard/admin/analytics/usage', label: 'Analytics', icon: Activity, color: '#22d3ee', desc: 'Traffic Auswertung' },
                { href: '/dashboard/admin/alliance', label: 'Alliance', icon: Zap, color: '#a78bfa', desc: 'Umsatz & Partner' },
                { href: '/dashboard/admin/settings', label: 'Settings', icon: LayoutDashboard, color: '#94a3b8', desc: 'Plattform-Setup' },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div className="glass hover-translate" style={{ 
                    padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)', height: '100%'
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: action.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <action.icon size={18} style={{ color: action.color }} />
                    </div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', marginBottom: 4 }}>{action.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
