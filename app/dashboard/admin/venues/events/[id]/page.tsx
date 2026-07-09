'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Save, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { updateEventAdmin } from '@/lib/actions/admin/AdminVenueActions'

export default function AdminEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '', description: '', ticket_price: 0, status: 'draft'
  })

  useEffect(() => {
    async function loadItem() {
      const supabase = createClient()
      const eventId = Array.isArray(params.id) ? params.id[0] : params.id
      const { data } = await supabase.from('events').select('*, users!events_manager_id_fkey(id, full_name, email)').eq('id', eventId).single()
      if (data) {
        setEvent(data)
        setFormData({
          name: data.name, description: data.description || '', ticket_price: data.ticket_price || 0, status: data.status
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
      await updateEventAdmin(event.id, formData)
      alert('Erfolgreich aktualisiert & im Audit-Log gespeichert.')
      router.push('/dashboard/admin/venues')
    } catch(err) {
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="animate-spin text-violet" size={40} /></div>
  if (!event) return <div style={{ padding: 40, color: 'white' }}>Event nicht gefunden.</div>

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <Link href="/dashboard/admin/venues" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#a1a1aa', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem' }} className="hover-text-primary">
        <ArrowLeft size={16} /> Zurück zur Übersicht
      </Link>

      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar style={{ color: '#22d3ee' }} size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Event Bearbeiten: {event.name}</h1>
          <p style={{ color: '#71717a', display: 'flex', gap: 8, alignItems: 'center' }}>
             Manager: <Link href={`/dashboard/admin/users/${event.users?.id}`} style={{ color: '#22d3ee', textDecoration: 'none' }}>{event.users?.full_name} ({event.users?.email})</Link>
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
        </div>

        <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, padding: 24, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 16 }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Allgemeine Info</h3>
           
           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Event Name</label>
             <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
           </div>

           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Beschreibung</label>
             <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical' }} />
           </div>

           <div>
             <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', marginBottom: 6 }}>Ticket Preis (€)</label>
             <input type="number" step="0.01" value={formData.ticket_price} onChange={e => setFormData({...formData, ticket_price: parseFloat(e.target.value)})} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none' }} />
           </div>
        </div>

        <button 
          type="submit" disabled={saving}
          style={{ 
            background: 'linear-gradient(135deg, #22d3ee, #ec4899)', border: 'none', padding: 16, borderRadius: 16,
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
