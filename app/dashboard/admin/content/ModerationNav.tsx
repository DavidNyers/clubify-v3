'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertCircle, MessageSquare, Star, LayoutDashboard } from 'lucide-react'

export default function ModerationNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard/admin/content', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/admin/content/reports', label: 'Meldungen', icon: AlertCircle },
    { href: '/dashboard/admin/content/reviews', label: 'Reviews', icon: Star },
    { href: '/dashboard/admin/content/comments', label: 'Kommentare', icon: MessageSquare },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap', paddingBottom: 4, margin: '8px 0 24px 0', borderBottom: '1px solid rgb(var(--border))' }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        return (
          <Link 
            key={tab.href} 
            href={tab.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#fb923c' : 'rgb(var(--text-secondary))',
              borderBottom: `2px solid ${isActive ? '#fb923c' : 'transparent'}`,
              transition: 'all 0.2s',
              marginBottom: -1
            }}
            className={isActive ? '' : 'hover-text-primary'}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
