import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getUsageAnalytics } from '@/lib/actions/admin/AnalyticsActions'
import { Clock, Users, Activity, TrendingUp, Filter, User, Globe, Monitor, Smartphone, Calendar, Gauge } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Nutzungs-Analytics — Clubify Admin'
}

export default async function UsageAnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/auth/login')

  const currentRange = searchParams.range || '7d'
  const sessions = await getUsageAnalytics(currentRange)

  // Calulate Stats
  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const avgDuration = sessions.length > 0 ? totalDuration / sessions.length : 0
  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size
  
  // Hardware Distribution
  const dist = sessions.reduce((acc: any, s) => {
    const os = s.os || 'Unbekannt'; const br = s.browser || 'Unbekannt'; const dv = s.device || 'Desktop'
    acc.os[os] = (acc.os[os] || 0) + 1
    acc.browser[br] = (acc.browser[br] || 0) + 1
    acc.device[dv] = (acc.device[dv] || 0) + 1
    return acc
  }, { os: {}, browser: {}, device: {} })

  const getPercent = (count: number, total: number) => Math.round((count / total) * 100)

  // Group by User
  const userStats = sessions.reduce((acc: any, s) => {
    const uid = s.user_id
    if (!acc[uid]) {
      const user = Array.isArray(s.users) ? s.users[0] : s.users
      acc[uid] = { id: uid, name: user?.full_name || 'Unbekannt', totalTime: 0, sessionCount: 0 }
    }
    acc[uid].totalTime += (s.duration_seconds || 0)
    acc[uid].sessionCount += 1
    return acc
  }, {})

  const sortedUsers = Object.values(userStats).sort((a: any, b: any) => b.totalTime - a.totalTime).slice(0, 5)

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Analytics & Insights
          </h1>
          <p style={{ color: '#a1a1aa' }}>Echtzeit-Tracking von Verweildauer und Hardware-Daten.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          {['24h', '7d', '30d', '1y'].map(id => (
            <Link key={id} href={`/dashboard/admin/analytics/usage?range=${id}`} style={{ padding: '8px 16px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', background: currentRange === id ? '#8b5cf6' : 'transparent', color: currentRange === id ? 'white' : '#71717a' }}>{id}</Link>
          ))}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 40 }}>
        {[
          { label: 'Gesamt-Nutzung', value: formatDuration(totalDuration), icon: Clock, color: '#22d3ee' },
          { label: 'Ø Sitzung', value: formatDuration(avgDuration), icon: Activity, color: '#8b5cf6' },
          { label: 'Aktive User', value: uniqueUsers, icon: Users, color: '#ec4899' },
          { label: 'Sitzungen', value: sessions.length, icon: Gauge, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: '0.9rem', color: '#a1a1aa', fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
        
        {/* HARDWARE DISTRIBUTION */}
        <div className="glass" style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><Monitor size={18} /> OS Verteilung</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(dist.os).map(([name, count]: any) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span style={{ color: '#a1a1aa' }}>{getPercent(count, sessions.length)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#8b5cf6', width: `${getPercent(count, sessions.length)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '32px 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}><Globe size={18} /> Browser</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(dist.browser).map(([name, count]: any) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span style={{ color: '#a1a1aa' }}>{getPercent(count, sessions.length)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#22d3ee', width: `${getPercent(count, sessions.length)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP USERS LEADERBOARD */}
        <div className="glass" style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}><TrendingUp size={18} /> Meiste Nutzung</h2>
          </div>
          <div style={{ padding: 16 }}>
            {sortedUsers.map((u: any, index) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: index < sortedUsers.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#8b5cf6', fontSize: '0.85rem' }}>{index + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</div>
                  <div style={{ color: '#71717a', fontSize: '0.75rem' }}>{u.sessionCount} Sitzungen</div>
                </div>
                <div style={{ fontWeight: 800, color: '#22d3ee' }}>{formatDuration(u.totalTime)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
