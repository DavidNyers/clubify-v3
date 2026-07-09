'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Save, Shield, Mail, Phone, Calendar, Info, Loader2, Ban, 
  History, Star, Heart, Ticket, ExternalLink, Monitor, Smartphone, 
  Globe, Activity, User as UserIcon, Settings, Layers, ArrowRight 
} from 'lucide-react'
import { adminUpdateUserDetail, toggleUserBan, cancelAllianceSubscription } from '@/lib/actions/admin/UserActions'
import { UserRole, ROLE_LABELS } from '@/lib/auth/rbac'
import Link from 'next/link'

// CUSTOM UI COMPONENTS
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDatePicker from '@/components/ui/CustomDatePicker'

type TabType = 'profil' | 'inhalte' | 'system'

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('profil')
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const [formData, setFormData] = useState({
    fullName: '',
    role: 'user' as UserRole,
    phone: '',
    bio: '',
    username: '',
    gender: '',
    dateOfBirth: ''
  })

  useEffect(() => {
    async function loadUserAndActivities() {
      const supabase = createClient()
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      
      if (data) {
        setUser(data)
        setFormData({
          fullName: data.full_name || '',
          role: data.role as UserRole,
          phone: data.phone || '',
          bio: data.bio || '',
          username: data.username || '',
          gender: data.gender || '',
          dateOfBirth: data.date_of_birth || ''
        })

        const [
          { data: reviews },
          { data: bookings },
          { data: favorites },
          { data: payments },
          { data: fraudLogs },
          { data: reports },
          { data: tickets }
        ] = await Promise.all([
          supabase.from('reviews').select('*, clubs(name, slug), bars(name, slug), events(name, slug)').eq('user_id', id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*, events(name, slug)').eq('user_id', id).order('created_at', { ascending: false }),
          supabase.from('favorites').select('*, clubs(name, slug), bars(name, slug), events(name, slug)').eq('user_id', id).order('created_at', { ascending: false }),
          supabase.from('payments').select('amount, status').eq('user_id', id).eq('status', 'paid'),
          supabase.from('fraud_logs').select('id').eq('attempted_by', id),
          supabase.from('reports').select('id').eq('target_id', id),
          supabase.from('tickets').select('status').eq('user_id', id)
        ])

        const merged = [
          ...(reviews || []).map(r => ({ ...r, activityType: 'review' })),
          ...(bookings || []).map(b => ({ ...b, activityType: 'booking' })),
          ...(favorites || []).map(f => ({ ...f, activityType: 'favorite' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setActivities(merged)
        
        // Calculate new metrics
        const totalPaid = payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0
        const fraudCount = fraudLogs?.length || 0
        const reportCount = reports?.length || 0
        const totalTickets = tickets?.length || 0
        const usedTickets = tickets?.filter(t => t.status === 'used').length || 0
        const scanRate = totalTickets > 0 ? (usedTickets / totalTickets) * 100 : 0

        setUser({ 
          ...data, 
          ltv: totalPaid, 
          fraudCount, 
          reportCount, 
          scanRate,
          totalTickets
        })
      }
      setLoading(false)
      setLoadingActivities(false)
    }
    loadUserAndActivities()
  }, [id])

  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)
    const res = await adminUpdateUserDetail(id as string, formData)
    if (res.success) {
      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' })
      setUser({ ...user, ...formData, date_of_birth: formData.dateOfBirth })
    } else {
      setMessage({ type: 'error', text: res.error || 'Fehler beim Speichern.' })
    }
    setUpdating(false)
  }

  const handleToggleBan = async () => {
    if (!window.confirm(`Benutzer wirklich ${user.is_banned ? 'entsperren' : 'sperren'}?`)) return
    setUpdating(true)
    const res = await toggleUserBan(id as string, !user.is_banned)
    if (res.success) {
      setUser({ ...user, is_banned: !user.is_banned })
      setMessage({ type: 'success', text: `Benutzer ${user.is_banned ? 'entsperrt' : 'gesperrt'}.` })
    }
    setUpdating(false)
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Alliance-Mitgliedschaft wirklich beenden? Der Benutzer verliert sofort alle Premium-Vorteile.')) return
    setUpdating(true)
    const res = await cancelAllianceSubscription(id as string)
    if (res.success) {
      setUser({ 
        ...user, 
        alliance_status: 'canceled', 
        alliance_tier: 'none', 
        alliance_expiration: null,
        is_alliance_gifted: false
      })
      setMessage({ type: 'success', text: 'Mitgliedschaft wurde erfolgreich beendet.' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Fehler beim Abbrechen der Mitgliedschaft.' })
    }
    setUpdating(false)
  }

  if (loading) return (
    <div style={{ padding: 100, textAlign: 'center' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: '#8b5cf6', margin: '0 auto' }} />
    </div>
  )

  if (!user) return <div style={{ padding: 32 }}>Benutzer nicht gefunden.</div>

  const genderOptions = [
    { value: '', label: 'Keine Angabe' },
    { value: 'male', label: 'Männlich' },
    { value: 'female', label: 'Weiblich' },
    { value: 'diverse', label: 'Divers' },
  ]

  const roleOptions = Object.entries(ROLE_LABELS).map(([key, label]) => ({ value: key, label }))

  return (
    <div style={{ padding: '32px 5%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Link href="/dashboard/admin/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#a1a1aa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Zurück zur Übersicht
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          {user.is_banned && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(239,68,68,0.2)' }}>GESPERRT</div>}
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(139,92,246,0.2)' }}>{ROLE_LABELS[user.role as UserRole]}</div>
        </div>
      </div>

      {/* USER PROFILE CARD (TOP) */}
      <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 32, padding: '32px', marginBottom: 32, border: '1px solid #27272a', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 100, height: 100, borderRadius: 28, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 900 }}>
            {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 28, objectFit: 'cover' }} /> : (user.full_name?.[0] || user.email[0]).toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: '50%', background: user.last_active_at && (new Date().getTime() - new Date(user.last_active_at).getTime() < 300000) ? '#22c55e' : '#52525b', border: '3px solid #09090b' }} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{user.full_name || 'Unbekannt'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
             <p style={{ color: '#a1a1aa', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={16} /> {user.email}</p>
             <p style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1rem' }}>@{user.username || 'kein_handle'}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: '1 1 150px' }}>
          <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registriert</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{new Date(user.created_at).toLocaleDateString('de-AT')}</div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        borderBottom: '1px solid #27272a', 
        marginBottom: 32, 
        padding: '0 12px', 
        overflowX: 'auto', 
        whiteSpace: 'nowrap',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }} className="no-scrollbar">
        {[
          { id: 'profil', label: 'Profil & Kontakt', icon: UserIcon },
          { id: 'inhalte', label: 'Aktivität & Inhalte', icon: Layers },
          { id: 'system', label: 'System & Sicherheit', icon: Settings },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
              color: activeTab === tab.id ? '#8b5cf6' : '#71717a',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s',
              marginBottom: -1,
              flexShrink: 0
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {message && (
        <div style={{ 
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: message.type === 'success' ? '#22c55e' : '#f87171', 
          padding: '14px 20px', borderRadius: 16, marginBottom: 24, fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {message.text}
        </div>
      )}

      {activeTab === 'profil' && (
        <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: 32, border: '1px solid #27272a', padding: '40px' }}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Vollständiger Name</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} style={{ width: '100%', height: 54, padding: '0 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Username</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', height: 54, padding: '0 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: 16, color: '#8b5cf6', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Telefonnummer</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', height: 54, padding: '0 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <CustomDatePicker label="Geburtsdatum" value={formData.dateOfBirth} onChange={(val) => setFormData({ ...formData, dateOfBirth: val })} />
                <CustomSelect label="Geschlecht" options={genderOptions} value={formData.gender} onChange={(val) => setFormData({ ...formData, gender: val })} />
                <CustomSelect label="Rolle" options={roleOptions} value={formData.role} onChange={(val) => setFormData({ ...formData, role: val as UserRole })} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Biografie</label>
              <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={5} style={{ width: '100%', padding: '18px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: 20, color: 'white', resize: 'none', outline: 'none' }} />
            </div>
            <button type="submit" disabled={updating} style={{ padding: '18px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'flex-end' }}>
              {updating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Speichern
            </button>
          </form>
        </div>
      )}

      {activeTab === 'inhalte' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
          {/* ACTIVITY TIMELINE */}
          <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: 32, border: '1px solid #27272a', padding: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><History size={20} style={{ color: '#ec4899' }} /> Aktivitäten</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingActivities ? (
                 <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={32} className="animate-spin" style={{ color: '#52525b', margin: '0 auto' }} /></div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#52525b' }}>Keine Daten.</div>
              ) : activities.map((act, i) => {
                const venueName = act.clubs?.name || act.bars?.name || act.events?.name || 'Unbekannt'
                return (
                  <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {act.activityType === 'review' && <Star size={16} style={{ color: '#fbbf24' }} />}
                             {act.activityType === 'favorite' && <Heart size={16} style={{ color: '#f87171' }} />}
                             {act.activityType === 'booking' && <Ticket size={16} style={{ color: '#22d3ee' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{venueName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>{act.activityType}</div>
                          </div>
                       </div>
                       <div style={{ fontSize: '0.75rem', color: '#52525b' }}>{new Date(act.created_at).toLocaleDateString('de-AT')}</div>
                    </div>
                    {act.activityType === 'review' && <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>"{act.text}"</p>}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass" style={{ padding: 32, borderRadius: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Treue-Status</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>TOP 5%</div>
              <p style={{ color: '#71717a', fontSize: '0.9rem', marginTop: 12 }}>Dieser Benutzer gehört zu den aktivsten Clubbern des letzten Monats.</p>
            </div>
            <div className="glass" style={{ padding: 32, borderRadius: 32, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #27272a' }}>
               <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Umsatz</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>€ 145,00</div>
               <p style={{ color: '#71717a', fontSize: '0.9rem', marginTop: 12 }}>Gesamtwert aller bisherigen Ticketkäufe.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* System Basic Analytics */}
            <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: 32, border: '1px solid #27272a', padding: 32 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><Activity size={20} style={{ color: '#22d3ee' }} /> System Analytics</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                       <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>NUTZUNG</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22d3ee' }}>{formatDuration(user.total_usage_seconds || 0)}</div>
                    </div>
                    <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                       <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>SLOTS</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>{user.login_count || 0}</div>
                    </div>
                 </div>

                 <div style={{ padding: 24, background: 'rgba(0,0,0,0.2)', borderRadius: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {user.last_device === 'Mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}
                          <span style={{ fontWeight: 800 }}>{user.last_os || 'Unbekannt'}</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Globe size={18} />
                          <span style={{ fontWeight: 800 }}>{user.last_browser || 'Unbekannt'}</span>
                       </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '0.85rem', color: '#71717a' }}>IP / Ort</span>
                       <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}>{user.last_location || 'Unbekannt'}<br/><small style={{ opacity: 0.5 }}>{user.last_ip}</small></span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Admin Specific: Financial & Engagement */}
            <div className="glass" style={{ background: 'rgba(34, 197, 94, 0.02)', borderRadius: 32, border: '1px solid rgba(34,197,94,0.1)', padding: 32 }}>
               <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><ArrowRight size={20} style={{ color: '#22c55e' }} /> Business Metrics</h2>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                     <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>TOTAL REVENUE (LTV)</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>€ {user.ltv?.toFixed(2)}</div>
                  </div>
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                     <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>SCAN-RATE</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{user.scanRate?.toFixed(1)}%</div>
                  </div>
               </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Admin Specific: Risk & Security */}
            <div className="glass" style={{ background: 'rgba(239, 68, 68, 0.02)', borderRadius: 32, border: '1px solid rgba(239,68,68,0.1)', padding: 32 }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20} /> Risiko-Analyse</h3>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20, border: user.fraudCount > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                     <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>FRAUD LOGS</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 900, color: user.fraudCount > 0 ? '#ef4444' : 'white' }}>{user.fraudCount}</div>
                  </div>
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                     <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800 }}>USER REPORTS</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 900, color: user.reportCount > 0 ? '#fbbf24' : 'white' }}>{user.reportCount}</div>
                  </div>
               </div>
               <button 
                  onClick={handleToggleBan}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 16, fontWeight: 800, 
                    background: user.is_banned ? '#10b981' : '#ef4444', color: 'white', cursor: 'pointer'
                  }}
                >
                  {user.is_banned ? 'Benutzer Entsperren' : 'Account Sperren (Ban)'}
                </button>
            </div>

            <div className="glass" style={{ background: 'rgba(139, 92, 246, 0.03)', borderRadius: 32, border: '1px solid rgba(139, 92, 246, 0.1)', padding: 32 }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20} /> Alliance Bündnis</h3>
               <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                     <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Status</span>
                     <span style={{ 
                        fontWeight: 800, 
                        fontSize: '0.85rem',
                        color: user.alliance_status === 'active' ? '#22c55e' : '#52525b'
                     }}>
                        {user.alliance_status?.toUpperCase() || 'KEIN STATUS'}
                     </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                     <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Tier</span>
                     <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{user.alliance_tier?.toUpperCase() || 'NONE'}</span>
                  </div>
                  {user.alliance_expiration && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Läuft ab</span>
                       <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{new Date(user.alliance_expiration).toLocaleDateString('de-AT')}</span>
                    </div>
                  )}
               </div>
               
               {user.alliance_status === 'active' ? (
                 <button 
                   onClick={handleCancelSubscription}
                   disabled={updating}
                   style={{ 
                     width: '100%', padding: '14px', borderRadius: 16, fontWeight: 800, 
                     background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer',
                     border: '1px solid rgba(239,68,68,0.2)'
                   }}
                 >
                   {updating ? <Loader2 size={18} className="animate-spin" /> : 'Mitgliedschaft kündigen'}
                 </button>
               ) : (
                 <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: '0.8rem', color: '#52525b', textAlign: 'center', fontStyle: 'italic' }}>
                   Keine aktive Mitgliedschaft
                 </div>
               )}
            </div>
            
            <div className="glass" style={{ padding: 32, borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid #27272a' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>Präferenzen</h3>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Sprache</span>
                  <span style={{ fontWeight: 800 }}>{user.preferred_language || 'Deutsch'}</span>
               </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
