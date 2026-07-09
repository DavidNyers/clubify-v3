import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getUsers } from '@/lib/actions/admin/UserActions'
import UserList from './UserList'
import { Users, ShieldCheck, ShieldAlert, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; role?: string; search?: string }> }) {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/dashboard/user')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const role = params.role || 'all'
  const search = params.search || ''
  const pageSize = 10

  const supabase = await createClient()

  // Initial fetch for stats and paginated list
  const [
    { count: totalCount },
    { count: adminCount },
    { count: bannedCount },
    res
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    getUsers(page, pageSize, role, search)
  ])

  const initialUsers = res.success ? res.data : []
  const totalPages = (res.success ? res.totalPages : 0) ?? 0
  const currentPage = (res.success ? res.currentPage : 1) ?? 1

  const stats = [
    { label: 'Gesamt', value: totalCount ?? 0, icon: Users, color: '#8b5cf6' },
    { label: 'Administratoren', value: adminCount ?? 0, icon: ShieldCheck, color: '#10b981' },
    { label: 'Gesperrt', value: bannedCount ?? 0, icon: ShieldAlert, color: '#f87171' },
    { label: 'Neu (24h)', value: 0, icon: UserPlus, color: '#22d3ee' }, 
  ]

  return (
    <div style={{ padding: '40px 32px', flex: 1, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Benutzerverwaltung
          </h1>
          <p style={{ color: '#71717a', fontSize: '1rem', fontWeight: 500 }}>
            Verwalte Profile, Rollen und Berechtigungen der Clubify Community.
          </p>
        </div>
        <div style={{ padding: '10px 20px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 14, border: '1px solid rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} /> Admin Panel v4.0
        </div>
      </div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 48 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ 
            background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.4) 0%, rgba(9, 9, 11, 0.6) 100%)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: 24, padding: '28px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle background glow */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: stat.color, filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.01em' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Interactive List */}
      <UserList 
        initialUsers={initialUsers || []} 
        totalPages={totalPages}
        currentPage={currentPage}
        currentRole={role}
        currentSearch={search}
      />
    </div>
  )
}
