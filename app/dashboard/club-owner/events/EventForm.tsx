'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Calendar, Clock, Ticket, Users, Music, Info, FileText } from 'lucide-react'
import { createEvent, updateEvent, EventPayload } from '@/lib/actions/events/EventActions'

interface EventFormProps {
  venues: { id: string, name: string }[]
  event?: any
  mode?: 'create' | 'edit'
}

export default function EventForm({ venues, event, mode = 'create' }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventPayload>({
    club_id: event?.club_id || venues[0]?.id || '',
    name: event?.name || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    doors_open: event?.doors_open ? new Date(event.doors_open).toISOString().slice(0, 16) : '',
    max_guests: event?.max_guests || 0,
    ticket_price: event?.ticket_price || 0,
    currency: event?.currency || 'EUR',
    lineup: event?.lineup || [],
    genre: event?.genre || [],
    status: event?.status || 'draft'
  })

  const [lineupInput, setLineupInput] = useState('')
  const [genreInput, setGenreInput] = useState('')

  const handleAddField = (field: 'lineup' | 'genre', value: string) => {
    if (value.trim() && !formData[field]?.includes(value.trim())) {
      setFormData({ ...formData, [field]: [...(formData[field] || []), value.trim()] })
    }
  }

  const removeField = (field: 'lineup' | 'genre', value: string) => {
    setFormData({ ...formData, [field]: formData[field]?.filter(v => v !== value) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = mode === 'create' 
      ? await createEvent(formData)
      : await updateEvent(event.id, formData)
    
    if (res.success) {
      setSuccess(true)
      if (mode === 'create') router.push('/dashboard/club-owner/events')
      else setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(res.error || 'Fehler beim Speichern')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* General */}
      <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} className="text-violet" /> Basis-Infos
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Location auswählen</label>
            <select 
              value={formData.club_id}
              onChange={e => setFormData({ ...formData, club_id: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
              disabled={mode === 'edit'}
            >
              {venues.map(v => <option key={v.id} value={v.id} style={{background: '#1a1a1a'}}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Name des Events</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Silver Sky Grand Opening"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Beschreibung</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} className="text-violet" /> Datum & Uhrzeit
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Event Datum & Start</label>
            <input 
              type="datetime-local" 
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Einlass ab (optional)</label>
            <input 
              type="datetime-local" 
              value={formData.doors_open}
              onChange={e => setFormData({ ...formData, doors_open: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
        </div>
      </div>

      {/* Tickets & Capacity */}
      <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ticket size={18} className="text-violet" /> Tickets & Tickets
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Ticketpreis (€)</label>
            <input 
              type="number" step="0.01"
              value={formData.ticket_price}
              onChange={e => setFormData({ ...formData, ticket_price: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Max. Gästeliste / Kapazität</label>
            <input 
              type="number" 
              value={formData.max_guests}
              onChange={e => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
        </div>
      </div>

      {/* Lineup & Genres */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 20 }}>Lineup / Artists</h2>
          <input 
            type="text" 
            value={lineupInput}
            onChange={e => setLineupInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddField('lineup', lineupInput), setLineupInput(''))}
            placeholder="Künstler hinzufügen..."
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {formData.lineup?.map(art => (
              <span key={art} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: 6, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {art} <button type="button" onClick={() => removeField('lineup', art)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 20 }}>Genres</h2>
          <input 
            type="text" 
            value={genreInput}
            onChange={e => setGenreInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddField('genre', genreInput), setGenreInput(''))}
            placeholder="Genres hinzufügen..."
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {formData.genre?.map(g => (
              <span key={g} style={{ padding: '3px 10px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', borderRadius: 6, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {g} <button type="button" onClick={() => removeField('genre', g)} style={{ border: 'none', background: 'none', color: '#a78bfa', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(139, 92, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           <label style={{ color: 'white', fontWeight: 600 }}>Status:</label>
           <select 
             value={formData.status}
             onChange={e => setFormData({ ...formData, status: e.target.value as any })}
             style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white' }}
           >
             <option value="draft" style={{background: '#1a1a1a'}}>Entwurf</option>
             <option value="published" style={{background: '#1a1a1a'}}>Öffentlich</option>
             <option value="cancelled" style={{background: '#1a1a1a'}}>Abgesagt</option>
           </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
          {success && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>Gespeichert!</span>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 12, fontWeight: 700 }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {mode === 'create' ? 'Event erstellen' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
