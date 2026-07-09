'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Clock, Check, X, UserCircle, 
  ChevronRight, CalendarDays, MoreVertical,
  CalendarCheck2, Coffee, Trash2, ArrowRightLeft,
  Timer, UserPlus, Send
} from 'lucide-react'
import { 
    confirmReservation, 
    cancelReservation, 
    seatGuest, 
    completeReservation,
    createWalkIn 
} from '@/lib/actions/venue/ReservationActions'

import { RefreshCw } from 'lucide-react'

interface Table {
    id: string
    label: string
    capacity: number
    zone_id?: string
    venue_zones?: {
        name: string
    }
}

interface Reservation {
    id: string
    contact_name: string
    contact_email?: string
    contact_phone?: string
    guest_count: number
    reserved_date: string
    reserved_time: string
    status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
    table_id?: string
    notes?: string
    duration_minutes?: number
    is_waitlist?: boolean
}

interface Props {
  venueId: string
  venueType: 'bar' | 'club'
  tables: Table[]
  reservations: Reservation[]
}

export default function ReservationCommandCenter({ venueId, venueType, tables, reservations }: Props) {
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [customDuration, setCustomDuration] = useState(120)

    // Filtered lists
    const pending = reservations.filter(r => r.status === 'pending')
    const schedule = reservations.filter(r => r.status === 'confirmed')
    
    // LIVE OCCUPANCY CALCULATION
    // Only count as "Besetzt" if status is seated AND it's actually happening NOW
    const liveOccupancy = useMemo(() => {
        const nowMs = Date.now()
        const todayStr = new Date().toISOString().split('T')[0]
        
        return reservations.filter(r => {
            if (r.status !== 'seated') return false
            if (r.reserved_date !== todayStr) return false
            
            const startMs = new Date(`${r.reserved_date}T${r.reserved_time}`).getTime()
            const endMs = startMs + (r.duration_minutes || 120) * 60000
            
            return nowMs >= startMs && nowMs < endMs
        })
    }, [reservations])

    const seatedCount = liveOccupancy.length
    const freeCount = Math.max(0, tables.length - seatedCount)

    const getOccupiedTableForTime = (tableId: string, date: string, time: string, duration: number) => {
        // Strict date check: only reservations on the same day can conflict
        const reqDateStr = date?.split('T')[0]
        const reqStart = new Date(`${reqDateStr}T${time}`).getTime()
        const reqEnd = reqStart + (duration || 120) * 60000

        return reservations.find(r => {
            // Basic filters: same table, active status, exclude SELF
            if (r.table_id !== tableId) return false
            if (r.status === 'cancelled' || r.status === 'completed') return false
            if (selectedReservation && r.id === selectedReservation.id) return false
            
            // Fix: Strict date check to prevent "Leak" into next day
            if (r.reserved_date !== reqDateStr) return false
            
            const resStart = new Date(`${r.reserved_date}T${r.reserved_time}`).getTime()
            const resEnd = resStart + (r.duration_minutes || 120) * 60000
            
            // Overlap logic: (StartA < EndB) AND (EndA > StartB)
            return reqStart < resEnd && reqEnd > resStart
        })
    }

    const getOccupiedTableNow = (tableId: string) => {
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const nowMs = now.getTime()
        
        return liveOccupancy.find(r => {
            if (r.table_id !== tableId) return false
            if (r.reserved_date !== todayStr) return false
            
            const resStart = new Date(`${r.reserved_date}T${r.reserved_time}`).getTime()
            const resEnd = resStart + (r.duration_minutes || 120) * 60000
            
            return nowMs >= resStart && nowMs < resEnd
        })
    }

    const handleConfirm = async (id: string) => {
        setIsProcessing(id)
        await confirmReservation(id)
        setIsProcessing(null)
    }

    const handleSeat = async (resId: string, tableId: string) => {
        setIsProcessing(resId)
        await seatGuest(resId, tableId, customDuration)
        setIsProcessing(null)
        setShowTablePicker(false)
    }

    const handleComplete = async (resId: string) => {
        setIsProcessing(resId)
        await completeReservation(resId)
        setIsProcessing(null)
    }

    // --- STYLES ---
    const glassStyle: React.CSSProperties = {
        background: 'rgba(24, 24, 27, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        padding: 28
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(9, 9, 11, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 20,
        transition: 'all 0.2s ease'
    }

    const accentButton: React.CSSProperties = {
        padding: '12px 20px',
        borderRadius: 14,
        border: 'none',
        fontWeight: 900,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'transform 0.1s active'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, height: '100%', minHeight: 900 }}>
            
            {/* ── HERO STATS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                {[
                    { label: 'Offen', value: pending.length, color: '#3b82f6' },
                    { label: 'Besetzt', value: seatedCount, color: '#22c55e' },
                    { label: 'Erwartet', value: schedule.length, color: '#ec4899' },
                    { label: 'Kapazität', value: tables.reduce((acc, t) => acc + t.capacity, 0), color: '#a1a1aa' }
                ].map((stat, i) => (
                    <div key={i} style={{ ...glassStyle, padding: '24px 32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: stat.color }} />
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{stat.label}</p>
                        <p style={{ fontSize: '2.4rem', fontWeight: 200, color: 'white', margin: 0, fontFamily: 'Inter, sans-serif' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, flex: 1 }}>
                
                {/* ── PANEL: SMART LIVE FEED ── */}
                <div style={{ ...glassStyle, padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 950, color: 'white', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 15px #3b82f6' }} />
                            Aktivitäts-Feed
                        </h3>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6' }}>{pending.length} NEUE ANFRAGEN</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#52525b' }}>|</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ec4899' }}>{schedule.length} ANSTEHEND</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#52525b' }}>|</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#22c55e' }}>{liveOccupancy.length} IM LOKAL</span>
                        </div>
                    </div>

                    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* PENDING REQUESTS */}
                        {pending.map(res => {
                            const isAvailable = tables.some(t => !getOccupiedTableForTime(t.id, res.reserved_date, res.reserved_time, 120) && t.capacity >= res.guest_count)
                            return (
                                <div key={res.id} style={{ ...cardStyle, background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)', padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEUE ANFRAGE • {res.reserved_time} Uhr • {new Date(res.reserved_date).toLocaleDateString('de-DE')}</span>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: isAvailable ? '#22c55e' : '#ef4444' }}>{isAvailable ? 'TISCH VERFÜGBAR' : 'LOKAL VOLL'}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                        <div>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white', margin: '0 0 8px 0' }}>{res.contact_name}</p>
                                            <div style={{ display: 'flex', gap: 16, color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 600 }}>
                                                <span>{res.guest_count} Gäste</span>
                                                {res.contact_phone && <span>• {res.contact_phone}</span>}
                                                {res.contact_email && <span>• {res.contact_email}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => handleConfirm(res.id)} style={{ ...accentButton, background: 'white', color: 'black', width: 140 }}>Bestätigen</button>
                                            <button onClick={() => cancelReservation(res.id)} style={{ ...accentButton, width: 48, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><X size={20} /></button>
                                        </div>
                                    </div>
                                    {res.notes && <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, borderLeft: '3px solid #3b82f6', fontSize: '0.8rem', color: '#d4d4d8', fontStyle: 'italic' }}>"{res.notes}"</div>}
                                </div>
                            )
                        })}

                        {/* LIVE IN VENUE (NEWLY ADDED TO FEED) */}
                        {liveOccupancy.length > 0 && <p style={{ fontSize: '0.7rem', fontWeight: 950, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 24, marginBottom: 8 }}>Aktuell am Tisch</p>}
                        {liveOccupancy.map(res => (
                            <div key={res.id} style={{ ...cardStyle, background: 'rgba(34, 197, 94, 0.03)', borderColor: 'rgba(34, 197, 94, 0.1)', padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>{res.contact_name}</span>
                                        <p style={{ fontSize: '0.7rem', color: '#a1a1aa', margin: 0 }}>Seit {res.reserved_time} • {res.guest_count} Personen • Tisch: {tables.find(t => t.id === res.table_id)?.label}</p>
                                        <div style={{ fontSize: '0.65rem', color: '#52525b', marginTop: 4 }}>{res.contact_phone || res.contact_email}</div>
                                    </div>
                                    <button onClick={() => handleComplete(res.id)} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', fontWeight: 950, fontSize: '0.7rem', cursor: 'pointer' }}>CHECK-OUT</button>
                                </div>
                            </div>
                        ))}

                        {/* UPCOMING ARRIVALS */}
                        {schedule.length > 0 && <p style={{ fontSize: '0.7rem', fontWeight: 950, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 24, marginBottom: 8 }}>Nächste Reservierungen</p>}
                        {schedule.map(res => (
                            <div key={res.id} style={{ ...cardStyle, background: 'transparent', padding: '16px 0', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white' }}>{res.contact_name}</span>
                                        <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '2px 0 0 0' }}>{res.reserved_time} Uhr • {res.guest_count} Gäste</p>
                                        <div style={{ fontSize: '0.65rem', color: '#52525b', marginTop: 4 }}>{res.contact_phone} {res.contact_email && `| ${res.contact_email}`}</div>
                                    </div>
                                    <button onClick={() => { setSelectedReservation(res); setShowTablePicker(true); }} style={{ padding: '10px 20px', borderRadius: 12, background: '#ec4899', color: 'white', border: 'none', fontWeight: 950, fontSize: '0.7rem', cursor: 'pointer' }}>PLATZIEREN</button>
                                </div>
                            </div>
                        ))}

                        {pending.length === 0 && schedule.length === 0 && liveOccupancy.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.2 }}>
                                <Check size={48} style={{ margin: '0 auto 16px auto' }} />
                                <p style={{ fontSize: '0.9rem', fontWeight: 900 }}>KEINE AKTIVITÄT</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── TABLE PICKER MODAL ── */}
            <AnimatePresence>
                {showTablePicker && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: 24, backdropFilter: 'blur(10px)' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{ ...glassStyle, width: '100%', maxWidth: 700, background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: 48 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white', margin: 0 }}>Tisch auswählen</h2>
                                    <p style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase', marginTop: 6 }}>Gast: {selectedReservation?.contact_name} ({selectedReservation?.guest_count} P.)</p>
                                </div>
                                <button onClick={() => setShowTablePicker(false)} style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: 'none', color: '#52525b', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            {/* Duration Picker */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 24, marginBottom: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 950, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 16 }}>Aufenthaltsdauer</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button onClick={() => setCustomDuration(Math.max(15, customDuration - 15))} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 900 }}>-</button>
                                        <div style={{ minWidth: 100, textAlign: 'center' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: 950, color: 'white' }}>{customDuration}</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#52525b', marginLeft: 8 }}>Min</span>
                                        </div>
                                        <button onClick={() => setCustomDuration(customDuration + 15)} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 900 }}>+</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                                        {[90, 120, 180].map(val => (
                                            <button 
                                                key={val}
                                                onClick={() => setCustomDuration(val)}
                                                style={{ 
                                                    flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', 
                                                    background: customDuration === val ? '#ec4899' : 'rgba(255,255,255,0.03)',
                                                    color: customDuration === val ? 'white' : '#52525b', fontWeight: 900, transition: 'all 0.2s', cursor: 'pointer', fontSize: '0.75rem'
                                                }}
                                            >
                                                {val / 60} Std
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {tables.map(table => {
                                    // If we are placing a SPECIFIC reservation, check for that time slot.
                                    // Otherwise (general view), check for 'Now'.
                                    const isOccupied = selectedReservation 
                                        ? !!getOccupiedTableForTime(
                                            table.id, 
                                            selectedReservation.reserved_date || new Date().toISOString().split('T')[0], 
                                            selectedReservation.reserved_time, 
                                            customDuration
                                          )
                                        : !!getOccupiedTableNow(table.id)

                                    const isTooSmall = selectedReservation && table.capacity < selectedReservation.guest_count
                                    const zoneName = table.venue_zones?.name
                                    
                                    return (
                                        <button
                                            key={table.id}
                                            disabled={!!(isOccupied || isTooSmall)}
                                            onClick={() => selectedReservation && handleSeat(selectedReservation.id, table.id)}
                                            style={{ 
                                                ...cardStyle, 
                                                textAlign: 'left',
                                                cursor: isOccupied || isTooSmall ? 'not-allowed' : 'pointer',
                                                opacity: isOccupied || isTooSmall ? 0.3 : 1,
                                                borderColor: isTooSmall ? '#ef4444' : 'rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <p style={{ fontSize: '0.85rem', fontWeight: 950, color: 'white', margin: '0 0 4px 0' }}>
                                                {zoneName && <span style={{ opacity: 0.5, fontWeight: 700 }}>{zoneName} • </span>}
                                                {table.label}
                                            </p>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: isOccupied ? '#ef4444' : '#71717a', margin: 0 }}>
                                                {isOccupied ? 'Belegt zu dieser Zeit' : `${table.capacity} Plätze`}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
