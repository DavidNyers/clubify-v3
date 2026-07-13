'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  GlassWater, Calendar as CalendarIcon, Users, 
  Check, X, Armchair, Loader2, MessageSquare,
  ChevronRight, Info
} from 'lucide-react'
import { requestTableReservation } from '@/lib/actions/club/TableActions'
import { motion, AnimatePresence } from 'framer-motion'

interface TableReservationModalProps {
  clubId: string
  clubName: string
  packages: any[]
  user: any
  trigger: React.ReactNode
}

export default function TableReservationModal({ clubId, clubName, packages, user, trigger }: TableReservationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [date, setDate] = useState<string>('')
  const [guests, setGuests] = useState<number>(2)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const resetAndClose = () => {
    setIsOpen(false)
    setSuccess(false)
    setSelectedPkgId(null)
    setNotes('')
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="sidebar-booking-container" style={{ width: '100%' }}>
        {trigger}
      </div>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={resetAndClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
              />

              {/* Modal Content */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ 
                  position: 'relative', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
                  background: '#18181b', border: '1px solid #27272a', borderRadius: 32, padding: 32,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
              >
                <button 
                  onClick={resetAndClose}
                  style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a1a1aa', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>

                {success ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' }}>
                      <Check size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Anfrage gesendet!</h2>
                    <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginBottom: 32 }}>Der Club {clubName} hat deine Anfrage erhalten und wird sie in Kürze prüfen.</p>
                    <button onClick={resetAndClose} style={{ background: 'white', color: 'black', border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 800, cursor: 'pointer' }}>Schließen</button>
                  </div>
                ) : (
                  <>
                    <header style={{ marginBottom: 32 }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Armchair style={{ color: '#8b5cf6' }} size={28} /> Tisch bei {clubName} reservieren
                      </h2>
                      <p style={{ color: '#71717a' }}>Wähle dein Paket und sichere dir deinen Platz.</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                      {/* Package Selection */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                        <div 
                          onClick={() => setSelectedPkgId(null)}
                          style={{ background: '#09090b', border: `2px solid ${selectedPkgId === null ? '#8b5cf6' : '#27272a'}`, borderRadius: 20, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>Standard Tisch</h4>
                          <p style={{ fontSize: '0.8rem', color: '#71717a' }}>Reservierung ohne Vorab-Paket.</p>
                        </div>

                        {packages.map(pkg => (
                          <div 
                            key={pkg.id}
                            onClick={() => setSelectedPkgId(pkg.id)}
                            style={{ background: '#09090b', border: `2px solid ${selectedPkgId === pkg.id ? '#8b5cf6' : '#27272a'}`, borderRadius: 20, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>{pkg.name}</h4>
                              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f8fafc' }}>{pkg.price}€</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#71717a' }}>Bis zu {pkg.max_guests} Personen</p>
                          </div>
                        ))}
                      </div>

                      {/* Details Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Wunschtermin</label>
                          <div style={{ position: 'relative' }}>
                             <CalendarIcon size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#a1a1aa' }} />
                             <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: '10px 12px 10px 36px', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Personen</label>
                          <div style={{ position: 'relative' }}>
                             <Users size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#a1a1aa' }} />
                             <input type="number" min={1} max={30} value={guests} onChange={e => setGuests(parseInt(e.target.value))} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: '10px 12px 10px 36px', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 32 }}>
                         <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, marginBottom: 8 }}>Besondere Wünsche oder Anlass</label>
                         <textarea 
                          placeholder="z.B. Geburtstagstisch, bestimmte Platzierung..."
                          value={notes} onChange={e => setNotes(e.target.value)}
                          rows={2}
                          style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', outline: 'none', resize: 'none', fontSize: '0.9rem' }} 
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={loading || !date}
                        style={{ 
                          width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', 
                          border: 'none', padding: 16, borderRadius: 16, fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                          opacity: (!date || loading) ? 0.6 : 1
                        }}
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Reservierungsanfrage senden
                      </button>
                      <p style={{ textAlign: 'center', color: '#52525b', fontSize: '0.7rem', marginTop: 16 }}>
                         Hinweis: Erst nach Bestätigung durch {clubName} ist dein Tisch sicher.
                      </p>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
