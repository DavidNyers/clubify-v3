import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Bell } from 'lucide-react'
import NotificationsClient from './NotificationsClient'

export default async function UserNotificationsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 32, flex: 1, maxWidth: 800, margin: '0 auto' }}>
      <Link 
        href="/dashboard/user" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem' }}
      >
        <ChevronLeft size={16} /> Zurück zur Übersicht
      </Link>

      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell style={{ color: '#fbbf24' }} size={28} /> Benachrichtigungen
          </h1>
          <p style={{ color: '#64748b' }}>Verwalte deine System- und Buchungshinweise</p>
        </div>
      </div>

      <NotificationsClient initialNotifications={notifications || []} userId={user.id} />
    </div>
  )
}
