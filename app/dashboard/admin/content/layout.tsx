'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, AlertCircle, MessageSquare, Star, LayoutDashboard } from 'lucide-react'

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard/admin/content', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/dashboard/admin/content/reports', label: 'Meldungen', icon: AlertCircle },
    { href: '/dashboard/admin/content/reviews', label: 'Reviews', icon: Star },
    { href: '/dashboard/admin/content/comments', label: 'Kommentare', icon: MessageSquare },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Moderation Header Only */}
      <div style={{ padding: '24px 32px 24px 32px', background: 'rgba(var(--bg-surface), 0.3)', borderBottom: '1px solid rgb(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(251, 146, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} style={{ color: '#fb923c' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgb(var(--text-primary))' }}>Content Moderation</h1>
            <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>Verwalte Meldungen und die Qualität der Community-Inhalte</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
