'use client'

import { useState } from 'react'
import { 
  GlassWater, Calendar as CalendarIcon, Users, 
  Check, ChevronRight, Info, Star, Armchair,
  Clock, MessageSquare, Loader2
} from 'lucide-react'
import { requestTableReservation } from '@/lib/actions/club/TableActions'
import { motion, AnimatePresence } from 'framer-motion'

interface TableReservationSectionProps {
  clubId: string
  packages: any[]
  user: any
}

export default function TableReservationSection({ clubId, packages, user }: TableReservationSectionProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [date, setDate] = useState<string>('')
  const [guests, setGuests] = useState<number>(2)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Bitte logge dich ein, um eine Reservierung vorzunehmen.')
      return
    }
    if (!date) return

    setLoading(true)
    try {
      const res = await requestTableReservation({
        clubId,
        packageId: selectedPkgId || undefined,
        date,
        guests,
        notes
      })
      if (res.success) {
        setSuccess(true)
      }
    } catch (err) {
      alert('Fehler bei der Reservierung. Bitte versuche es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 40, textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 24, border: '1px solid rgba(34, 197, 94, 0.2)' }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white' }}>
          <Check size={32} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Anfrage gesendet!</h3>
        <p style={{ color: '#a1a1aa', marginBottom: 24 }}>Der Club wird deine Reservierung prüfen. Du erhältst eine Benachrichtigung, sobald sie bestätigt wurde.</p>
        <button onClick={() => setSuccess(false)} style={{ background: 'white', color: 'black', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Weitere Reservierung</button>
      </motion.div>
    )
  }

  return (
    <div id="reservation" style={{ marginTop: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Armchair style={{ color: '#8b5cf6' }} size={24} /> Tisch & VIP Reservierung
          </h2>
          <p style={{ color: '#71717a' }}>Sichere dir die besten Plätze und exklusive Flaschenpakete.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Basic Reservation Card */}
        <div 
          onClick={() => setSelectedPkgId(null)}
          style={{ 
            background: '#18181b', border: `2px solid ${selectedPkgId === null ? '#8b5cf6' : '#27272a'}`, 
            borderRadius: 24, padding: 24, cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
          }}
        >
          {selectedPkgId === null && <div style={{ position: 'absolute', top: 16, right: 16, background: '#8b5cf6', color: 'white', padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800 }}>AUSGEWÄHLT</div>}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Standard Tisch</h3>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: 20 }}>Einfache Reservierung ohne vorab gebuchtes Paket. Mindestumsatz nach Absprache vor Ort.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: '0.85rem' }}>
             <Users size={14} /> bis zu 10 Personen
          </div>
        </div>

        {/* Dynamic Packages */}
        {packages.map(pkg => (
          <div 
            key={pkg.id}
            onClick={() => setSelectedPkgId(pkg.id)}
            style={{ 
              background: '#18181b', border: `2px solid ${selectedPkgId === pkg.id ? '#8b5cf6' : '#27272a'}`, 
              borderRadius: 24, padding: 24, cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
            }}
          >
            {selectedPkgId === pkg.id && <div style={{ position: 'absolute', top: 16, right: 16, background: '#8b5cf6', color: 'white', padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800 }}>AUSGEWÄHLT</div>}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>{pkg.name}</h3>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 12 }}>{pkg.price} €</div>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: 16, minHeight: 40 }}>{pkg.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pkg.items?.slice(0, 3).map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#a1a1aa' }}>
                  <Check size={12} style={{ color: '#22c55e' }} /> {item}
                </div>
              ))}
              {pkg.items?.length > 3 && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 18 }}>+ {pkg.items.length - 3} weitere</span>}
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#71717a', fontSize: '0.8rem' }}>
               <Users size={14} /> bis zu {pkg.max_guests} Personen
            </div>
          </div>
        ))}
      </div>

      {/* Reservation Form */}
      <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid #27272a', borderRadius: 28, padding: 32 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Details deiner Reservierung</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Wunschtermin</label>
            <div style={{ position: 'relative' }}>
               <CalendarIcon size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#a1a1aa' }} />
               <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: '12px 14px 12px 40px', color: 'white', outline: 'none' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Gästeanzahl</label>
            <div style={{ position: 'relative' }}>
               <Users size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#a1a1aa' }} />
               <input 
                type="number" 
                min={1} max={20}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: '12px 14px 12px 40px', color: 'white', outline: 'none' }} 
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Besondere Wünsche / Anlass</label>
            <div style={{ position: 'relative' }}>
               <MessageSquare size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#a1a1aa' }} />
               <input 
                placeholder="z.B. Geburtstag, Junggesellenabschied, Tisch-Platzierung..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: '12px 14px 12px 40px', color: 'white', outline: 'none' }} 
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', 
                border: 'none', padding: 16, borderRadius: 16, fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                boxShadow: '0 8px 25px rgba(139, 92, 246, 0.2)'
              }}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Armchair size={24} />}
              {selectedPkgId ? 'Paket verbindlich anfragen' : 'Tisch jetzt anfragen'}
            </button>
            <p style={{ textAlign: 'center', color: '#52525b', fontSize: '0.75rem', marginTop: 16 }}>
               Hinweis: Dies ist eine unverbindliche Anfrage. Erst nach Bestätigung durch den Club-Betreiber gilt der Tisch als reserviert.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
