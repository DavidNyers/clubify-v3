import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Ticket, Calendar, Heart, Star, Bell, User, ArrowRight, Zap } from 'lucide-react'

export default async function UserDashboard() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = await createClient()
  const [
    { data: tickets, count: ticketCount },
    { data: bookings, count: bookingCount },
    { data: favorites, count: favoriteCount },
    { data: notifications },
  ] = await Promise.all([
    supabase.from('tickets').select('id, status, created_at, events(name, date)').eq('user_id', user.id).eq('status', 'valid').order('created_at', { ascending: false }).limit(3),
    supabase.from('bookings').select('id, status, guests, created_at, events(name, date)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('favorites').select('id, club_id, bar_id, event_id, clubs(name, slug, city), bars(name, slug, city), events(name, slug, date)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('id, type, title, message, read, created_at').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
  ])

  const unreadCount = notifications?.length ?? 0

  const quickLinks = [
    { href: '/dashboard/user/tickets', label: 'Meine Tickets', icon: Ticket, value: ticketCount ?? 0, color: '#8b5cf6' },
    { href: '/dashboard/user/bookings', label: 'Buchungen', icon: Calendar, value: bookingCount ?? 0, color: '#ec4899' },
    { href: '/dashboard/user/favorites', label: 'Favoriten', icon: Heart, value: favoriteCount ?? 0, color: '#f87171' },
    { href: '/dashboard/user/notifications', label: 'Benachrichtigungen', icon: Bell, value: unreadCount, color: '#fbbf24', badge: unreadCount > 0 },
  ]

  const { data: profile } = await supabase.from('users').select('alliance_status, alliance_tier, alliance_expiration').eq('id', user.id).single()
  const isSubscriber = profile?.alliance_status === 'active'

  return (
    <div style={{ padding: 32, flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          Hallo, {user.full_name?.split(' ')[0] ?? 'Benutzer'} 👋
        </h1>
        <p style={{ color: '#64748b' }}>Hier ist deine Übersicht</p>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, transition: 'all 0.2s', cursor: 'pointer', position: 'relative' }}
              className="hover-border-violet"
            >
              {link.badge && link.value > 0 && (
                <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>
                  {link.value > 9 ? '9+' : link.value}
                </div>
              )}
              <div style={{ width: 36, height: 36, borderRadius: 9, background: link.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <link.icon size={18} style={{ color: link.color }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{link.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{link.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alliance Status Bar (Immediate Visibility) */}
      <div className="glass" style={{ 
        padding: '20px 24px', borderRadius: 20, marginBottom: 32, 
        background: isSubscriber ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0,0,0,0))' : 'rgba(255,255,255,0.02)',
        border: isSubscriber ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: isSubscriber ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSubscriber ? '#a78bfa' : '#64748b' }}>
            <Zap size={22} fill={isSubscriber ? '#a78bfa' : 'none'} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
              {isSubscriber ? `Alliance ${profile?.alliance_tier?.charAt(0).toUpperCase()}${profile?.alliance_tier?.slice(1)} Member` : 'Kein aktives Bündnis'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {isSubscriber ? 'Deine exklusiven Vorteile sind aktiv' : 'Werde Teil der Alliance für exklusive Vorteile'}
            </div>
          </div>
        </div>
        <Link href="/profile" style={{ textDecoration: 'none', padding: '8px 20px', borderRadius: 12, background: isSubscriber ? 'white' : 'transparent', border: isSubscriber ? 'none' : '1px solid rgba(255,255,255,0.1)', color: isSubscriber ? '#1e1b4b' : 'white', fontWeight: 800, fontSize: '0.8rem' }}>
          {isSubscriber ? 'Mitgliedschaft Details' : 'Jetzt beitreten'}
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* Recent Tickets */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Aktive Tickets</h2>
            <Link href="/dashboard/user/tickets" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>Alle →</Link>
          </div>
          {!tickets?.length ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Ticket size={36} style={{ color: '#334155', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Keine aktiven Tickets</p>
              <Link href="/events" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none', display: 'block', marginTop: 8 }}>Events entdecken →</Link>
            </div>
          ) : (
            tickets.map((ticket: any) => (
              <Link key={ticket.id} href="/dashboard/user/tickets" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'background 0.15s' }}
                className="hover-bg-elevated"
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ticket size={16} style={{ color: '#a78bfa' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>{(ticket as any).events?.name ?? 'Event'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {ticket.events?.date ? new Date(ticket.events.date).toLocaleDateString('de-AT') : ''}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 600 }}>Gültig</span>
              </Link>
            ))
          )}
        </div>

        {/* Notifications */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
              Benachrichtigungen
              {unreadCount > 0 && <span style={{ marginLeft: 8, background: '#f87171', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{unreadCount}</span>}
            </h2>
            <Link href="/dashboard/user/notifications" style={{ color: '#fbbf24', fontSize: '0.8rem', textDecoration: 'none' }}>Alle →</Link>
          </div>
          {!notifications?.length ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Bell size={36} style={{ color: '#334155', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Keine neuen Benachrichtigungen</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>{n.title}</div>
                  {n.message && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{n.message}</div>}
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('de-AT')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile Quick Link */}
      <Link href="/dashboard/user/profile" style={{ textDecoration: 'none', display: 'block', marginTop: 24 }}>
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.2s', cursor: 'pointer' }}
          className="hover-border-violet"
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>
            {user.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>{user.full_name ?? 'Benutzer'}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
          </div>
          <ArrowRight size={16} style={{ color: '#64748b' }} />
        </div>
      </Link>
        {/* Favorites Section */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginTop: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Favoriten</h2>
            <Link href="/dashboard/user/favorites" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>Alle verwalten →</Link>
          </div>
          {!favorites?.length ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Heart size={36} style={{ color: '#334155', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Keine Favoriten gespeichert</p>
            </div>
          ) : (
            favorites.map((fav: any) => {
              const item = fav.clubs || fav.bars || fav.events;
              const type = fav.club_id ? 'clubs' : fav.bar_id ? 'bars' : 'events';
              
              return (
                <Link key={fav.id} href={`/${type}/${item.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'background 0.15s' }} className="hover-bg-elevated">
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Heart size={16} fill="#f87171" style={{ color: '#f87171' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {fav.events ? new Date(item.date).toLocaleDateString('de-DE') : item.city}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: '#334155' }} />
                </Link>
              );
            })
          )}
        </div>
    </div>
  )
}
