'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Building2, Beer, Calendar, Shield,
  QrCode, Heart, Star, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, BarChart3, CreditCard, AlertTriangle, FileText,
  Ticket, Clock, MessageSquare, UserCheck, Menu, X, ClipboardList, CheckCircle, Map, Zap, Receipt,
  CalendarDays, Megaphone
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/rbac'

interface SidebarProps {
  user: { id: string; full_name: string | null; role: UserRole; avatar_url: string | null; email: string }
}

const NAV_ITEMS: Record<UserRole, Array<{ href: string; label: string; icon: any; badge?: string }>> = {
  admin: [
    { href: '/dashboard/admin', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Benutzer', icon: Users },
    { href: '/dashboard/admin/applications', label: 'Bewerbungen', icon: ClipboardList },
    { href: '/dashboard/admin/venues', label: 'Locations & Events', icon: Building2 },
    { href: '/dashboard/admin/users/map', label: 'Live-Monitor', icon: Map },
    { href: '/dashboard/admin/content', label: 'Moderation', icon: Shield },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/admin/accounting', label: 'Buchhaltung', icon: Receipt },
    { href: '/dashboard/admin/payments', label: 'Zahlungen', icon: CreditCard },
    { href: '/dashboard/admin/alliance', label: 'Alliance', icon: Zap },
    { href: '/dashboard/admin/alliance/partners', label: 'Partner', icon: UserCheck },
    { href: '/dashboard/admin/fraud', label: 'Betrug', icon: AlertTriangle },
  ],
  club_owner: [
    { href: '/dashboard/club-owner', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/club-owner/clubs', label: 'Meine Clubs', icon: Building2 },
    { href: '/dashboard/club-owner/events', label: 'Events', icon: Calendar },
    { href: '/dashboard/club-owner/event-requests', label: 'Event-Anfragen', icon: CheckCircle },
    { href: '/dashboard/club-owner/tables', label: 'Tisch-Management', icon: ClipboardList },
    { href: '/dashboard/club-owner/bookings', label: 'Buchungen', icon: Ticket },
    { href: '/dashboard/club-owner/revenue', label: 'Einnahmen', icon: CreditCard },
    { href: '/dashboard/club-owner/capacity', label: 'Kapazität', icon: UserCheck },
    { href: '/dashboard/club-owner/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/club-owner/moderation', label: 'Moderation', icon: MessageSquare },
  ],
  bar_owner: [
    { href: '/dashboard/bar-owner', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/bar-owner/bars', label: 'Meine Bars', icon: Beer },
    { href: '/dashboard/bar-owner/event-requests', label: 'Event-Anfragen', icon: CheckCircle },
    { href: '/dashboard/bar-owner/happy-hours', label: 'Happy Hours', icon: Clock },
    { href: '/dashboard/bar-owner?tab=reservations', label: 'Reservierungen', icon: CalendarDays },
    { href: '/dashboard/bar-owner?tab=marketing', label: 'Marketing', icon: Megaphone },
    { href: '/dashboard/bar-owner/bookings', label: 'Buchungen', icon: Ticket },
    { href: '/dashboard/bar-owner/revenue', label: 'Einnahmen', icon: CreditCard },
    { href: '/dashboard/bar-owner/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  event_manager: [
    { href: '/dashboard/event-manager', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/event-manager/events', label: 'Meine Events', icon: Calendar },
    { href: '/dashboard/event-manager/tickets', label: 'Tickets', icon: Ticket },
    { href: '/dashboard/event-manager/bouncers', label: 'Türsteher', icon: UserCheck },
    { href: '/dashboard/event-manager/checkins', label: 'Check-ins Live', icon: QrCode },
    { href: '/dashboard/event-manager/waitlist', label: 'Warteliste', icon: Users },
    { href: '/dashboard/event-manager/revenue', label: 'Einnahmen', icon: CreditCard },
  ],
  moderator: [
    { href: '/dashboard/moderator', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/moderator/reviews', label: 'Bewertungen', icon: Star },
    { href: '/dashboard/moderator/comments', label: 'Kommentare', icon: MessageSquare },
    { href: '/dashboard/moderator/reports', label: 'Meldungen', icon: FileText },
  ],
  bouncer: [
    { href: '/dashboard/bouncer', label: 'Events', icon: Calendar },
    { href: '/dashboard/bouncer/scan', label: 'QR Scanner', icon: QrCode },
    { href: '/dashboard/bouncer/log', label: 'Check-in Log', icon: FileText },
  ],
  user: [
    { href: '/dashboard/user', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/profile', label: 'Mein Profil', icon: Settings },
    { href: '/dashboard/user/tickets', label: 'Tickets', icon: Ticket },
    { href: '/dashboard/user/bookings', label: 'Buchungen', icon: Calendar },
    { href: '/dashboard/user/favorites', label: 'Favoriten', icon: Heart },
    { href: '/dashboard/user/reviews', label: 'Bewertungen', icon: Star },
    { href: '/dashboard/user/notifications', label: 'Benachrichtigungen', icon: Bell },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  moderator: 'Moderator',
  club_owner: 'Club Besitzer',
  bar_owner: 'Bar Besitzer',
  event_manager: 'Event Manager',
  bouncer: 'Türsteher',
  user: 'Benutzer',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#f87171',
  moderator: '#fb923c',
  club_owner: '#a78bfa',
  bar_owner: '#f472b6',
  event_manager: '#60a5fa',
  bouncer: '#fbbf24',
  user: '#94a3b8',
}

export default function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const navItems = NAV_ITEMS[user.role] ?? NAV_ITEMS.user

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="glass" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(var(--bg-surface), 0.7)', borderRight: '1px solid rgb(var(--border))',
    }}>
      {/* Logo + Collapse */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: collapsed ? '20px 12px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '0.9rem' }}>♪</span>
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clubify</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hide-mobile"
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User Avatar */}
      <div style={{ padding: collapsed ? '16px 12px' : '16px 20px', borderBottom: '1px solid rgb(var(--border))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: collapsed ? 32 : 36, height: collapsed ? 32 : 36,
            borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', color: 'white', fontWeight: 700,
          }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.full_name?.[0]?.toUpperCase() ?? 'U'
            }
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-primary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name ?? 'Benutzer'}
              </div>
              <div style={{ fontSize: '0.7rem', borderRadius: 4, padding: '1px 6px', marginTop: 2, display: 'inline-flex', background: `${ROLE_COLORS[user.role]}20`, color: ROLE_COLORS[user.role], fontWeight: 800 }}>
                {ROLE_LABELS[user.role]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navItems.map(item => {
          const currentQuery = searchParams.toString()
          const [itemPathname, itemQuery = ''] = item.href.split('?')
          
          const isBaseDashboard = item.href === '/dashboard/' + user.role.replace('_', '-')
          const isTabItem = item.href.includes('?tab=') || isBaseDashboard

          // Strict match for tabs, startsWith for actual sub-pages
          const isActive = isTabItem 
            ? (pathname === itemPathname && (itemQuery === '' ? (currentQuery === '' || currentQuery === 'tab=overview') : currentQuery === itemQuery))
            : (pathname === item.href || (
                !isBaseDashboard && 
                pathname.startsWith(item.href) && 
                !navItems.some(other => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length)
              ))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 8px' : '10px 14px',
                borderRadius: 12, marginBottom: 4, textDecoration: 'none',
                color: isActive ? 'white' : 'rgb(var(--text-secondary))',
                background: isActive ? 'linear-gradient(135deg, rgba(var(--color-violet), 0.8), rgba(var(--color-pink), 0.8))' : 'transparent',
                fontSize: '0.85rem', fontWeight: isActive ? 700 : 500,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <item.icon size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ marginLeft: 'auto', background: '#8b5cf6', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Link
          href={`/dashboard/${user.role.replace('_', '-')}/settings`}
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 8px' : '9px 12px', borderRadius: 8, marginBottom: 2, textDecoration: 'none', color: '#94a3b8', fontSize: '0.85rem', transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <Settings size={16} style={{ flexShrink: 0 }} />
          {!collapsed && 'Einstellungen'}
        </Link>
        <button
          id="dashboard-signout"
          onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 8px' : '9px 12px', borderRadius: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem', transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && 'Abmelden'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hide-mobile"
        style={{
          width: collapsed ? 56 : 240,
          flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div
        className="hide-desktop"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
          background: 'rgba(var(--bg-surface), 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgb(var(--border))',
        }}
      >
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Menu size={20} />
        </button>
        <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clubify</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: ROLE_COLORS[user.role] }}>{ROLE_LABELS[user.role]}</span>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }} />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 400, overflowY: 'auto', background: '#09090b' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50 }}>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
