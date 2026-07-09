'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, Users, Clock, 
  User, Mail, Phone, MessageSquare, 
  Check, Loader2, Armchair, 
  ChevronRight, ChevronLeft, ChevronDown
} from 'lucide-react'
import { requestPublicReservation, checkAvailability } from '@/lib/actions/venue/ReservationActions'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  venueId: string
  venueType: 'bar' | 'club'
  venueName: string
  source?: string
  venueZones?: any[]
  showZones?: boolean
}

export default function VenueReservationForm({ venueId, venueType, venueName, source = 'app', venueZones, showZones = true }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [activePicker, setActivePicker] = useState<'date' | 'time' | 'guests' | null>(null)
  
  // For Calendar View
  const [viewMonth, setViewMonth] = useState(new Date())
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '', // Will be set by useEffect
    guests: 2,
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  // Helper to determine if a time slot is available
  const getTimeStatus = (timeStr: string) => {
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD local
    
    // 1. Past Date Check
    if (formData.date < todayStr) return 'past'
    if (formData.date > todayStr) return 'available'

    // 2. Same Day Logic (Check 2h buffer)
    const [h, m] = timeStr.split(':').map(Number)
    const slotDate = new Date(now)
    slotDate.setHours(h, m, 0, 0)

    // Handle early morning slots as "following day" if currently late night
    if (h < 5 && now.getHours() > 12) {
      slotDate.setDate(slotDate.getDate() + 1)
    }

    const diffMs = slotDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffMs < 0) return 'past'
    if (diffHours < 2) return 'toosoon'
    return 'available'
  }

  const allHours = [17,18,19,20,21,22,23,0,1,2,3,4]
  const allMinutes = ['00', '15', '30', '45']
  const allTimePossibleSlots = allHours.flatMap(h => allMinutes.map(m => `${String(h).padStart(2, '0')}:${m}`))
  
  const timePeriods = [
    { label: 'Abend', slots: allTimePossibleSlots.filter(t => parseInt(t.split(':')[0]) >= 17 && parseInt(t.split(':')[0]) < 22) },
    { label: 'Nacht', slots: allTimePossibleSlots.filter(t => parseInt(t.split(':')[0]) >= 22 || parseInt(t.split(':')[0]) < 5) }
  ]

  // Auto-set the first available time slot when the date changes or on mount
  useEffect(() => {
    // Collect all slots from all periods
    const allAvailable = timePeriods.flatMap(p => p.slots).filter(t => getTimeStatus(t) === 'available')
    
    if (allAvailable.length > 0) {
      if (!formData.time || getTimeStatus(formData.time) === 'past') {
        setFormData(prev => ({ ...prev, time: allAvailable[0] }))
      }
    }
  }, [formData.date])

  const handleSubmit = async (e: React.FormEvent, forceWaitlist = false) => {
    if (e) e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Bypass availability check to avoid technical roadblocks
      // Users can always submit a request; venue owner manages seating on dashboard

      // 2. Submit reservation
      const res = await requestPublicReservation({
        venueId,
        venueType,
        ...formData,
        date: formData.date, // Explicitly ensure date is sent as 'date'
        source,
        isWaitlist: forceWaitlist
      })
      
      if (res.success) {
        setIsWaitlist(forceWaitlist)
        setSuccess(true)
        setShowWaitlistModal(false)
      } else {
        alert('Fehler: ' + res.error)
      }
    } catch (err) {
      console.error('Reservation Error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          padding: '60px 40px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)', 
          borderRadius: 32, border: '1px solid rgba(34, 197, 94, 0.2)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' }}>
          <Check size={40} strokeWidth={3} />
        </div>
        <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'white', marginBottom: 12 }}>
          {isWaitlist ? 'Warteliste bestätigt!' : 'Anfrage gesendet!'}
        </h3>
        <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {isWaitlist 
            ? `Vielen Dank, ${formData.name.split(' ')[0]}! Du stehst auf der Warteliste. Wir melden uns, falls ein Tisch frei wird.`
            : `Vielen Dank, ${formData.name.split(' ')[0]}! ${venueName} hat deine Anfrage erhalten. Wir melden uns in Kürze bei dir.`
          }
        </p>
        <button 
          onClick={() => setSuccess(false)}
          style={{ background: 'white', color: 'black', border: 'none', padding: '16px 32px', borderRadius: 16, fontWeight: 900, cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Zurück zum Formular
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 32, padding: 32, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ padding: 10, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 12 }}>
                <Armchair size={20} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white', margin: 0, textAlign: 'center' }}>Termin & Gäste</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, position: 'relative', zIndex: 10 }}>
             {/* GUESTS SELECTOR */}
             <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>Personen</label>
                <div 
                  onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                   <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.guests}</span>
                   <ChevronDown size={14} color="#52525b" />
                </div>
                
                <AnimatePresence>
                  {activePicker === 'guests' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', top: '100%', left: 0, width: 200, zIndex: 60, marginTop: 8, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    >
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                          {[1,2,3,4,5,6,7,8,10,12,15,20].map(g => (
                            <div 
                              key={g}
                              onClick={() => { setFormData({...formData, guests: g}); setActivePicker(null); }}
                              style={{ 
                                padding: '8px 0', borderRadius: 8, textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, 
                                background: formData.guests === g ? '#8b5cf6' : 'rgba(255,255,255,0.03)', 
                                color: 'white', cursor: 'pointer' 
                              }}
                            >
                              {g}
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* DATE SELECTOR */}
             <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>Datum</label>
                <div 
                  onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                   <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.date === new Date().toISOString().split('T')[0] ? 'Heute' : formData.date.split('-').reverse().join('.')}</span>
                   <ChevronDown size={14} color="#52525b" />
                </div>

                <AnimatePresence>
                  {activePicker === 'date' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      style={{ position: 'absolute', top: '100%', left: -50, width: 300, zIndex: 100, marginTop: 8, background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}
                    >
                       <CalendarPicker 
                         selectedDate={formData.date} 
                         onSelect={(d) => { setFormData({...formData, date: d}); setActivePicker(null); }}
                          viewMonth={viewMonth}
                          setViewMonth={setViewMonth}
                       />
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* TIME SELECTOR (With Dropdown) */}
             <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>Uhrzeit</label>
                <div 
                  onClick={() => setActivePicker(activePicker === 'time' ? null : 'time')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                   <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formData.time}</span>
                   <ChevronDown size={14} color="#52525b" />
                </div>

                <AnimatePresence>
                  {activePicker === 'time' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', top: '100%', right: 0, width: 180, zIndex: 110, marginTop: 8, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 10, maxHeight: 250, overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}
                    >
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {allTimePossibleSlots.map(t => {
                             const status = getTimeStatus(t)
                             const isDisabled = status !== 'available'
                             return (
                                <button
                                  key={`drop-${t}`}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => { setFormData({...formData, time: t}); setActivePicker(null); }}
                                  style={{ 
                                    padding: '10px 12px', borderRadius: 8, border: 'none', textAlign: 'left',
                                    background: formData.time === t ? '#8b5cf6' : 'transparent',
                                    color: isDisabled ? '#3f3f46' : 'white', fontWeight: 700, fontSize: '0.85rem', 
                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {t}
                                </button>
                             )
                          })}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

             {/* STABLE TIME GRID OVERHAUL */}
              <div id="time-grid" style={{ marginTop: 8, padding: '32px 24px', background: 'rgba(0,0,0,0.2)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.03)', maxWidth: 500, margin: '8px auto 0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8b5cf6', fontWeight: 950 }}>
                    Zeit auswählen
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {timePeriods.map(period => (
                    <div key={period.label}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>
                        {period.label === 'Abend' ? 'Schöner Abend' : 'Späte Nacht'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {period.slots.map(t => {
                          const isSelected = formData.time === t
                          const status = getTimeStatus(t)
                          const isPast = status === 'past' || status === 'toosoon'
                          
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={isPast}
                              onClick={() => setFormData({...formData, time: t})}
                              style={{ 
                                width: 'calc(25% - 8px)',
                                minWidth: '75px',
                                padding: '14px 0', borderRadius: 14, 
                                border: isSelected ? '1.5px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                                background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: isPast ? '#27272a' : (isSelected ? 'white' : '#a1a1aa'), 
                                fontWeight: isSelected ? 900 : 700, fontSize: '0.9rem', 
                                cursor: isPast ? 'not-allowed' : 'pointer', 
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isPast ? 0.3 : 1,
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                              }}
                            >
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>

        <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 32, padding: 32, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ padding: 10, background: 'rgba(236, 72, 153, 0.1)', borderRadius: 12 }}>
                <User size={20} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white', margin: 0, textAlign: 'center' }}>Kontaktdaten</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
               <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 16, top: 16, color: '#52525b' }} />
                  <input 
                    placeholder="Vollständiger Name" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 14px 14px 44px', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                  />
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
               <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 16, top: 16, color: '#52525b' }} />
                  <input 
                    type="email" placeholder="E-Mail" required value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 14px 14px 44px', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                  />
               </div>
               <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 16, top: 16, color: '#52525b' }} />
                  <input 
                    type="tel" placeholder="Telefon" value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 14px 14px 44px', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                  />
               </div>
            </div>

            <div style={{ position: 'relative' }}>
               <MessageSquare size={16} style={{ position: 'absolute', left: 16, top: 16, color: '#52525b' }} />
               <textarea 
                placeholder="Besondere Wünsche (optional)" value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 14px 14px 44px', color: 'white', outline: 'none', fontSize: '0.95rem', minHeight: 100, resize: 'none' }} 
               />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          style={{ 
            width: '100%', padding: 20, borderRadius: 24, border: 'none', 
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', 
            fontSize: '1.2rem', fontWeight: 950, cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: '0 15px 35px -10px rgba(139, 92, 246, 0.4)',
            opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Armchair size={24} />}
          {loading ? 'Sende Anfrage...' : 'Jetzt Tisch anfragen'}
        </button>

        <p style={{ textAlign: 'center', color: '#52525b', fontSize: '0.8rem', margin: '0 0 20px 0' }}>
            Hinweis: Dies ist eine unverbindliche Anfrage. Die Reservierung ist erst gültig, wenn sie von der Bar bestätigt wurde.
        </p>
      </form>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWaitlistModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass"
              style={{ 
                position: 'relative', width: '100%', maxWidth: 450, 
                background: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 32, padding: 40, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ padding: 20, background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', width: 'fit-content', margin: '0 auto 24px' }}>
                <Clock size={40} color="#8b5cf6" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white', marginBottom: 12 }}>Wir sind leider voll</h3>
              <p style={{ color: '#a1a1aa', marginBottom: 32, lineHeight: 1.6 }}>
                Für den {new Date(formData.date).toLocaleDateString('de-DE')} um {formData.time} Uhr haben wir für {formData.guests} Gäste leider keinen Tisch mehr frei.
                <br /><br />
                Möchten Sie sich stattdessen auf die <strong>Warteliste</strong> setzen lassen? Wir melden uns, falls jemand absagt.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={() => handleSubmit(null as any, true)}
                  disabled={loading}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none', 
                    background: 'white', color: 'black', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Auf die Warteliste
                </button>
                <button 
                  onClick={() => setShowWaitlistModal(false)}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', 
                    background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CalendarPicker({ selectedDate, onSelect, viewMonth, setViewMonth }: { 
  selectedDate: string, onSelect: (d: string) => void, viewMonth: Date, setViewMonth: (d: Date) => void 
}) {
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1 // Start on Monday

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }
  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: 'white' }}>{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={prevMonth} style={{ padding: 6, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
          <button type="button" onClick={nextMonth} style={{ padding: 6, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
        {weekDays.map(d => <div key={d} style={{ fontSize: '0.7rem', fontWeight: 900, color: '#52525b', paddingBottom: 8 }}>{d}</div>)}
        {Array.from({ length: startOffset }).map((_, i) => <div key={i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = selectedDate === dateStr
          const isToday = new Date().toISOString().split('T')[0] === dateStr
          const isPast = new Date(dateStr) < new Date(new Date().setHours(0,0,0,0))

          return (
            <div 
              key={day}
              onClick={(e) => { e.stopPropagation(); if (!isPast) onSelect(dateStr); }}
              style={{ 
                padding: '8px 0', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, 
                cursor: isPast ? 'not-allowed' : 'pointer',
                background: isSelected ? '#8b5cf6' : 'transparent',
                color: isSelected ? 'white' : (isPast ? '#27272a' : (isToday ? '#8b5cf6' : 'white')),
                border: isToday && !isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : 'none'
              }}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
