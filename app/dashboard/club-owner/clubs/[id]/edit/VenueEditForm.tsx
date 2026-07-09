'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Play, Music, MapPin, Info, LayoutGrid } from 'lucide-react'
import { updateVenue, VenueUpdatePayload } from '@/lib/actions/venues/VenueActions'

interface VenueEditFormProps {
  venue: any
  type: 'clubs' | 'bars'
}

export default function VenueEditForm({ venue, type }: VenueEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<VenueUpdatePayload>({
    name: venue.name || '',
    description: venue.description || '',
    address: venue.address || '',
    city: venue.city || '',
    capacity: venue.capacity || 0,
    price_range: venue.price_range || 1,
    music_genres: venue.music_genres || [],
    status: venue.status || 'draft'
  })

  const [genreInput, setGenreInput] = useState('')

  const handleAddGenre = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && genreInput.trim()) {
      e.preventDefault()
      if (!formData.music_genres?.includes(genreInput.trim())) {
        setFormData({ ...formData, music_genres: [...(formData.music_genres || []), genreInput.trim()] })
      }
      setGenreInput('')
    }
  }

  const removeGenre = (genre: string) => {
    setFormData({ ...formData, music_genres: formData.music_genres?.filter(g => g !== genre) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await updateVenue(venue.id, type, formData)
    
    if (res.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(res.error || 'Fehler beim Speichern')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* General Settings */}
      <div className="glass" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={20} className="text-violet" /> Grundinformationen
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Name der Location</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Beschreibung</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Location & Capacity */}
      <div className="glass" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={20} className="text-violet" /> Standort & Kapazität
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Adresse</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Stadt</label>
            <input 
              type="text" 
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Kapazität (max. Personen)</label>
            <input 
              type="number" 
              value={formData.capacity}
              onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Preis-Fokus (1-4 €)</label>
            <select 
              value={formData.price_range}
              onChange={e => setFormData({ ...formData, price_range: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
            >
              <option value={1} style={{background: '#1a1a1a'}}>€ (Budget)</option>
              <option value={2} style={{background: '#1a1a1a'}}>€€ (Moderate)</option>
              <option value={3} style={{background: '#1a1a1a'}}>€€€ (Premium)</option>
              <option value={4} style={{background: '#1a1a1a'}}>€€€€ (Luxury)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Music Genres */}
      <div className="glass" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Music size={20} className="text-violet" /> Musikrichtungen
        </h2>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Genres hinzufügen (Enter zum Bestätigen)</label>
          <input 
            type="text" 
            value={genreInput}
            onChange={e => setGenreInput(e.target.value)}
            onKeyDown={handleAddGenre}
            placeholder="Techno, House, R&B..."
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {formData.music_genres?.map(genre => (
              <span key={genre} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(139,92,246,0.3)' }}>
                {genre}
                <button type="button" onClick={() => removeGenre(genre)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Status & Save */}
      <div className="glass" style={{ 
        padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', 
        background: 'rgba(139,92,246,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           <div>
             <div style={{ color: 'white', fontWeight: 700, marginBottom: 4 }}>Sichtbarkeit</div>
             <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Bestimme, ob deine Location öffentlich sichtbar ist.</div>
           </div>
           <select 
             value={formData.status}
             onChange={e => setFormData({ ...formData, status: e.target.value as any })}
             style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
           >
             <option value="draft" style={{background: '#1a1a1a'}}>Entwurf</option>
             <option value="published" style={{background: '#1a1a1a'}}>Veröffentlicht</option>
             <option value="closed" style={{background: '#1a1a1a'}}>Dauerhaft geschlossen</option>
           </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
          {success && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>Änderungen gespeichert!</span>}
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 14, fontWeight: 700 }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Speichern
          </button>
        </div>
      </div>
    </form>
  )
}
