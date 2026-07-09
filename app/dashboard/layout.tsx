import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import UserLocationTracker from '@/components/dashboard/UserLocationTracker'
import ActivityTracker from '@/components/auth/ActivityTracker'
import type { UserRole } from '@/lib/auth/rbac'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  
  if (user.role === 'user') {
    redirect('/profile')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(var(--bg-base))' }}>
      <UserLocationTracker />
      <ActivityTracker userId={user.id} />
      <DashboardSidebar user={user as any} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0,
        background: 'transparent',
        position: 'relative',
      }}>
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {/* Mobile space */}
        <div className="hide-desktop" style={{ height: 56 }} />
        
        <div style={{ padding: '0px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
