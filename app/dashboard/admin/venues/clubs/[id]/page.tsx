'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Save, MapPin, Users, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { updateClubAdmin } from '@/lib/actions/admin/AdminVenueActions'

export default function AdminClubDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '',
    capacity: 0, status: 'draft'
  })

  useEffect(() => {
    async function loadItem() {
      const supabase = createClient()
      const clubId = Array.isArray(params.id) ? params.id[0] : params.id
      const { data } = await supabase.from('clubs').select('*, users(id, full_name, email)').eq('id', clubId).single()
      if (data) {
        setClub(data)
        setFormData({
          name: data.name, description: data.description || '', address: data.address || '', 
          city: data.city || '', capacity: data.capacity || 0, status: data.status
        })
      }
      setLoading(false)
    }
    loadItem()
  }, [params.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClubAdmin(club.id, formData)
      alert('Erfolgreich aktualisiert & im Audit-Log gespeichert.')
      router.push('/dashboard/admin/venues')
    } catch(err) {
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="animate-spin text-violet" size={40} /></div>
  if (!club) return <div style={{ padding: 40, color: 'white' }}>Club nicht gefunden.</div>

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <Link href="/dashboard/admin/venues" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#a1a1aa', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem' }} className="hover-text-primary">
        <ArrowLeft size={16} /> Zurück zur Übersicht
      </Link>

      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 style={{ color: '#8b5cf6' }} size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Club Bearbeiten: {club.name}</h1>
          <p style={{ color: '#71717a', display: 'flex', gap: 8, alignItems: 'center' }}>
             Besitzer: <Link href={`/dashboard/admin/users/${club.users?.id}`} style={{ color: '#a78bfa', textDecoration: 'none' }}>{club.users?.full_name} ({club.users?.email})</Link>
          </p>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, padding: 24, border: '1px solid #27272a' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={18} className="text-amber" /> Moderations-Status</h3>
           <select 
             value={formData.status} 
             onChange={e => setFormData({...formData, status: e.target.value})}
             style={{ 
               width: '100%', background: formData.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : '#09090b', 
               border: `1px solid ${formData.status === 'suspended' ? 'rgba(239, 68, 68, 0.5)' : '#27272a'}`, 
               borderRadius: 12, padding: 12, outline: 'none',
               color: formData.status === 'suspended' ? '#fca5a5' : 'white'
             }}
           >
             <option value="draft">Draft (Entwurf / Unsichtbar)</option>
             <option value="published">Published (Live & Sichtbar)</option>
             <option value="suspended">Suspended (Gesperrt / Regelverstoß)</option>
           </select>
           {formData.status === 'suspended' && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: 8 }}>Dieser Club wird für niemanden mehr sichtbar sein. Der Besitzer wird eventuell kontaktiert.</p>}
        </div>

        <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, padding: 24, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 16 }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Allgemeine Info</h3>
           
           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Club Name</label>
             <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
           </div>

           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Beschreibung</label>
             <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical' }} />
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
             <div>
               <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}><MapPin size={12} className="inline mr-1" /> Adresse</label>
               <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Stadt</label>
               <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
             </div>
           </div>

           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}><Users size={12} className="inline mr-1" /> Kapazität</label>
             <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
           </div>
        </div>

        <button 
          type="submit" disabled={saving}
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', padding: 16, borderRadius: 16,
            color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
          Änderungen erzwingen (Admin)
        </button>
      </form>
    </div>
  )
}
