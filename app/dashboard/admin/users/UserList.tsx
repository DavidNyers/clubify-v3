'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Ban, UserPlus, ChevronRight, Calendar, MapPin, Gift, Shield, Wallet } from 'lucide-react'
import { updateUserRole, toggleUserBan } from '@/lib/actions/admin/UserActions'
import { UserRole } from '@/lib/auth/rbac'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import GiftAllianceModal from '@/components/admin/users/GiftAllianceModal'

interface UserListProps {
  initialUsers: any[]
  totalPages: number
  currentPage: number
  currentRole: string
  currentSearch: string
}

export default function UserList({ 
  initialUsers, 
  totalPages, 
  currentPage, 
  currentRole,
  currentSearch
}: UserListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState(currentSearch)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [giftUser, setGiftUser] = useState<any | null>(null)

  // Sync if props change
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleFilterChange = (role: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('role', role)
    params.set('page', '1')
    router.push(`/dashboard/admin/users?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    params.set('search', search)
    params.set('page', '1')
    router.push(`/dashboard/admin/users?${params.toString()}`)
  }

  const isLive = (timestamp: string | null) => {
    if (!timestamp) return false
    const lastActive = new Date(timestamp).getTime()
    const now = new Date().getTime()
    return (now - lastActive) < 15 * 60 * 1000 // 15 minutes
  }

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Nie'
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'Gerade eben'
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)}h`
    return new Date(timestamp).toLocaleDateString('de-AT')
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Rolle wirklich auf ${newRole} ändern?`)) return
    setLoadingId(userId)
    const res = await updateUserRole(userId, newRole as UserRole)
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoadingId(null)
  }

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'entsperren' : 'sperren'
    if (!window.confirm(`Benutzer wirklich ${action}?`)) return
    setLoadingId(userId)
    const res = await toggleUserBan(userId, !currentlyBanned)
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentlyBanned } : u))
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoadingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toolbar */}
      <div className="glass" style={{ padding: '20px 24px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 16, flex: 1, minWidth: 300 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: 11, color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Nach Name oder E-Mail suchen..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'white', fontSize: '0.9rem', transition: 'border 0.2s' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: 16, top: 11, color: '#64748b', pointerEvents: 'none' }} />
            <select 
              value={currentRole}
              onChange={e => handleFilterChange(e.target.value)}
              style={{ padding: '10px 40px 10px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'white', fontSize: '0.9rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Alle Rollen</option>
              <option value="admin">Admin</option>
              <option value="club_owner">Venue Owner</option>
              <option value="user">User</option>
            </select>
            <ChevronRight size={14} style={{ position: 'absolute', right: 14, top: 14, color: '#52525b', transform: 'rotate(90deg)', pointerEvents: 'none' }} />
          </div>
        </form>

        <Link href="/dashboard/admin/users/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 14, fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
          <UserPlus size={18} />
          <span>Nutzer hinzufügen</span>
        </Link>
      </div>

      {/* High-End Table */}
      <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benutzer</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rolle</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Finanzen & Treue</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status / Aktivität</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {users.map((u, index) => (
                  <motion.tr 
                    layout
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)', 
                      transition: 'background 0.2s',
                      background: loadingId === u.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                      opacity: u.is_banned ? 0.7 : 1
                    }}
                    className="hover-highlight"
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ 
                            width: 48, height: 48, borderRadius: 14, 
                            background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'white', fontWeight: 900, fontSize: '1.1rem',
                            boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.3)'
                          }}>
                            {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} alt="" /> : (u.full_name?.[0] || u.email[0]).toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #09090b' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLive(u.last_active_at) ? '#22c55e' : '#3f3f46' }} />
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Link href={`/dashboard/admin/users/${u.id}`} style={{ color: 'white', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }} className="hover-link">
                              {u.full_name || 'Unbenannt'}
                            </Link>
                            {u.alliance_status === 'active' && <Shield size={12} fill="#22c55e" style={{ color: '#22c55e' }} />}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <Search size={10} /> {u.username ? `@${u.username}` : u.email.split('@')[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ 
                        display: 'inline-flex', padding: '6px 14px', borderRadius: 12, 
                        background: 'rgba(139, 92, 246, 0.08)', 
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa', fontSize: '0.75rem', fontWeight: 900, 
                        letterSpacing: '0.04em', textTransform: 'uppercase' 
                      }}>
                        {u.role.replace('_', ' ')}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Wallet size={14} style={{ color: '#22c55e' }} />
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{(u.balance || 0).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <Gift size={14} style={{ color: '#8b5cf6' }} />
                           <span style={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.8rem' }}>{(u.loyalty_points || 0).toLocaleString()} Pkt.</span>
                        </div>
                        {u.alliance_status === 'active' && (
                          <div style={{ 
                            marginTop: 4, display: 'inline-flex', padding: '2px 8px', borderRadius: 6, 
                            background: u.alliance_tier === 'elite' ? 'rgba(168, 85, 247, 0.1)' : u.alliance_tier === 'premium' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            color: u.alliance_tier === 'elite' ? '#a855f7' : u.alliance_tier === 'premium' ? '#3b82f6' : '#22c55e',
                            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                          }}>
                            Alliance: {u.alliance_tier}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600, marginBottom: 4 }}>
                        {isLive(u.last_active_at) ? <span style={{ color: '#22c55e', fontWeight: 900, letterSpacing: '0.05em' }}>LIVE</span> : formatTimeAgo(u.last_active_at)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#52525b' }}>
                        <MapPin size={10} /> {u.last_location || 'Unbekannt'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <Link href={`/dashboard/admin/users/${u.id}`} className="hover-translate" style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                          <ChevronRight size={18} />
                        </Link>
                        <button 
                          onClick={() => handleToggleBan(u.id, u.is_banned)}
                          disabled={loadingId === u.id}
                          className="hover-translate"
                          style={{ width: 34, height: 34, borderRadius: 12, border: 'none', background: u.is_banned ? 'rgba(34,197,94,0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.is_banned ? '#22c55e' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title={u.is_banned ? 'Entsperren' : 'Sperren'}
                        >
                          <Ban size={18} />
                        </button>
                        <button 
                          onClick={() => setGiftUser(u)}
                          className="hover-translate"
                          style={{ width: 34, height: 34, borderRadius: 12, border: 'none', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Alliance verschenken"
                        >
                          <Gift size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div style={{ padding: '80px', textAlign: 'center', color: '#52525b' }}>
            <Search size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
            <p style={{ fontWeight: 600 }}>Keine Benutzer gefunden</p>
          </div>
        )}
      </div>

      {/* Pagination Container */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>

      {/* Gift Modal */}
      {giftUser && (
        <GiftAllianceModal 
          user={giftUser}
          onClose={() => setGiftUser(null)}
          onSuccess={(uid, tier) => {
            setUsers(prev => prev.map(u => u.id === uid ? { ...u, alliance_status: 'active', alliance_tier: tier } : u))
          }}
        />
      )}
    </div>
  )
}
