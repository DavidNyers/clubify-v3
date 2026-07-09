'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Calendar as CalendarIcon, Users, Clock, Info, ChevronLeft, ChevronRight, 
    RefreshCw, AlertCircle, ChevronDown, ChevronUp, 
    LayoutPanelLeft, Filter, Search, ListFilter,
    ArrowUpDown, Globe, Smartphone, User, MoreVertical, Plus, X, Check, Trash2, CheckCircle2, Download,
    Eye,
    Printer
} from 'lucide-react'
import { 
    getReservationsByDate, createWalkIn, seatGuest, 
    completeReservation, cancelReservation, rescheduleReservation 
} from '@/lib/actions/venue/ReservationActions'

interface Table {
    id: string
    label: string
    capacity: number
    zone: string
}

interface Reservation {
    id: string
    contact_name: string
    guest_count: number
    reserved_date: string
    reserved_time: string
    duration_minutes: number
    status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
    table_id?: string
    source?: string
}

interface Props {
    venueId: string
    venueName?: string
    tables: Table[]
    reservations: Reservation[]
    openingHours?: any
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const WEEKDAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function ReservationTimeline({ venueId, venueName, tables, reservations: initialReservations, openingHours }: Props) {
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])
    const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [nowPosition, setNowPosition] = useState<number | null>(null)
    
    // UI Toggles & Search
    const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({})
    const [filterQuery, setFilterQuery] = useState('')
    const [showOccupancy, setShowOccupancy] = useState(true)
    const [groupObjects, setGroupObjects] = useState(true)
    const [sortByName, setSortByName] = useState(false)

    // --- CUSTOM DATE PICKER STATE ---
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [currentCalMonth, setCurrentCalMonth] = useState(new Date(viewDate).getMonth())
    const [currentCalYear, setCurrentCalYear] = useState(new Date(viewDate).getFullYear())
    const datePickerRef = useRef<HTMLDivElement>(null)

    // --- WALK-IN MODAL STATE ---
    const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false)
    const [walkInGuests, setWalkInGuests] = useState(2)
    const [selectedTableId, setSelectedTableId] = useState('')
    const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false)
    const [activeTableMenuId, setActiveTableMenuId] = useState<string | null>(null)
    const [isSavingWalkIn, setIsSavingWalkIn] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // --- RESERVATION MANAGEMENT STATE ---
    const [activeResMenuId, setActiveResMenuId] = useState<string | null>(null)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [selectedResForMove, setSelectedResForMove] = useState<Reservation | null>(null)

    // Drag-to-Scroll for Walk-Ins
    const walkInDeckRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!walkInDeckRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - walkInDeckRef.current.offsetLeft)
        setScrollLeft(walkInDeckRef.current.scrollLeft)
    }

    const handleMouseLeave = () => setIsDragging(false)
    const handleMouseUp = () => setIsDragging(false)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !walkInDeckRef.current) return
        e.preventDefault()
        const x = e.pageX - walkInDeckRef.current.offsetLeft
        const walk = (x - startX) * 2 // Scroll speed multiplier
        walkInDeckRef.current.scrollLeft = scrollLeft - walk
    }

    // Drag-to-Scroll for Main Grid
    const gridScrollRef = useRef<HTMLDivElement>(null)
    const [isDraggingGrid, setIsDraggingGrid] = useState(false)
    const [startGridX, setStartGridX] = useState(0)
    const [gridScrollLeft, setGridScrollLeft] = useState(0)

    const handleGridMouseDown = (e: React.MouseEvent) => {
        // Only trigger if clicking the empty track or background, not a button/reservation
        const target = e.target as HTMLElement
        if (target.closest('.reservation-block') || target.closest('button')) return
        
        if (!gridScrollRef.current) return
        setIsDraggingGrid(true)
        setStartGridX(e.pageX - gridScrollRef.current.offsetLeft)
        setGridScrollLeft(gridScrollRef.current.scrollLeft)
    }

    const handleGridMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingGrid || !gridScrollRef.current) return
        e.preventDefault()
        const x = e.pageX - gridScrollRef.current.offsetLeft
        const walk = (x - startGridX) * 1.5 // Multiplier
        gridScrollRef.current.scrollLeft = gridScrollLeft - walk
    }

    const stopGridDragging = () => setIsDraggingGrid(false)

    const [isMobile, setIsMobile] = useState(false)
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const scrollToNow = () => {
        if (gridScrollRef.current && nowPosition !== null) {
            const containerWidth = gridScrollRef.current.offsetWidth
            const targetScroll = Math.max(0, nowPosition - (isMobile ? 100 : 200))
            gridScrollRef.current.scrollTo({
                left: targetScroll,
                behavior: hasInitiallyScrolled ? 'smooth' : 'auto'
            })
        }
    }

    useEffect(() => {
        if (nowPosition !== null && !hasInitiallyScrolled && gridScrollRef.current) {
            scrollToNow()
            setHasInitiallyScrolled(true)
        }
    }, [nowPosition, hasInitiallyScrolled])

    // --- DYNAMIC TIMELINE CONFIG ---
    const { startHour, endHour } = useMemo(() => {
        const dayName = WEEKDAYS_EN[new Date(viewDate).getDay()]
        const hours = openingHours?.[dayName]
        if (hours && hours.open && hours.close) {
            const [openH] = hours.open.split(':').map(Number)
            let [closeH] = hours.close.split(':').map(Number)
            if (closeH <= openH) closeH += 24
            return {
                startHour: Math.max(0, openH - 1),
                endHour: closeH + 1
            }
        }
        return { startHour: 17, endHour: 30 } 
    }, [viewDate, openingHours])

    const hourWidth = isMobile ? 100 : 140
    const sidebarWidth = isMobile ? 100 : 220

    // Zone Grouping
    const zones = useMemo(() => {
        const groups: Record<string, Table[]> = {}
        const sortedTables = [...tables].sort((a,b) => sortByName ? a.label.localeCompare(b.label) : (a.capacity - b.capacity))
        sortedTables.forEach(t => {
            const z = (groupObjects ? (t.zone || 'Main') : 'Alle Tische')
            if (!groups[z]) groups[z] = []
            groups[z].push(t)
        })
        return groups
    }, [tables, groupObjects, sortByName])

    useEffect(() => {
        const initial: Record<string, boolean> = {}
        Object.keys(zones).forEach(z => { initial[z] = true })
        setExpandedZones(initial)
    }, [zones])

    // Load Data Helper
    const refreshData = async () => {
        setIsLoading(true)
        const result = await getReservationsByDate(venueId, viewDate)
        if (result.success && result.data) setReservations(result.data as Reservation[])
        setIsLoading(false)
    }

    // Load Data
    useEffect(() => {
        refreshData()
    }, [viewDate, venueId])

    // Now Line
    useEffect(() => {
        const updateNow = () => {
            const now = new Date()
            const h = now.getHours()
            const m = now.getMinutes()
            let adjustedH = h < startHour ? h + 24 : h
            if (adjustedH >= startHour && adjustedH < endHour) {
                setNowPosition(((adjustedH - startHour) * 60 + m) / 60 * hourWidth)
            } else setNowPosition(null)
        }
        updateNow(); const timer = setInterval(updateNow, 60000); return () => clearInterval(timer)
    }, [startHour, endHour, hourWidth])

    // Click outside to close custom select, date picker, or table menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false)
            }
            if (activeTableMenuId && !(event.target as Element).closest('.table-action-dots')) {
                setActiveTableMenuId(null)
            }
            if (activeResMenuId && !(event.target as Element).closest('.reservation-block')) {
                setActiveResMenuId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [activeTableMenuId, activeResMenuId])

    const timeSlots = useMemo(() => {
        const slots = []
        for (let i = startHour; i < endHour; i++) {
            const h = i % 24
            slots.push(`${h < 10 ? '0' : ''}${h}:00`)
        }
        return slots
    }, [startHour, endHour])

    const columnStats = useMemo(() => {
        return timeSlots.map((slot) => {
            const [h] = slot.split(':').map(Number)
            const count = reservations.filter(res => {
                if (res.status === 'cancelled' || res.status === 'completed' || !res.table_id) return false
                
                // Strict date check: Only count if reservation matches the current view date
                // Add reserved_date to Reservation interface if missing
                // @ts-ignore
                if (res.reserved_date && res.reserved_date !== viewDate) return false

                const [rh, rm] = res.reserved_time.split(':').map(Number)
                let adjRh = rh < startHour ? rh + 24 : rh
                let adjH = h < startHour ? h + 24 : h
                const resStart = adjRh * 60 + rm
                const resEnd = resStart + (res.duration_minutes || 120)
                const slotTime = adjH * 60
                return slotTime >= resStart && slotTime < resEnd
            }).length
            return { occupied: count, total: tables.length }
        })
    }, [reservations, tables, timeSlots, startHour])

    const getPosition = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number)
        let adjustedH = h < startHour ? h + 24 : h
        return ((adjustedH - startHour) * 60 + m) / 60 * hourWidth
    }

    const isToday = viewDate === new Date().toISOString().split('T')[0]

    // --- OCCUPANCY LOGIC ---
    const getZoneOccupancy = (zoneTables: Table[]) => {
        if (!isToday || nowPosition === null) return { occupied: 0, total: zoneTables.length }
        
        const now = new Date()
        const activeOccupancy = zoneTables.filter(table => {
            return reservations.some(r => {
                if (r.table_id !== table.id || ['cancelled', 'completed'].includes(r.status)) return false
                
                // Date check
                // @ts-ignore
                if (r.reserved_date && r.reserved_date !== viewDate) return false

                // Parse reservation start relative to viewDate
                const [h, m] = r.reserved_time.split(':').map(Number)
                const start = new Date(`${viewDate}T${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:00`)
                
                const end = new Date(start.getTime() + (r.duration_minutes || 120) * 60000)
                return now >= start && now <= end
            })
        }).length

        return { occupied: activeOccupancy, total: zoneTables.length }
    }

    const totalStats = useMemo(() => {
        if (!isToday || nowPosition === null) return { occupied: 0, total: tables.length }
        const now = new Date()
        const active = tables.filter(table => {
            return reservations.some(r => {
                if (r.table_id !== table.id || ['cancelled', 'completed'].includes(r.status)) return false
                
                // Date check
                // @ts-ignore
                if (r.reserved_date && r.reserved_date !== viewDate) return false

                const [h, m] = r.reserved_time.split(':').map(Number)
                const start = new Date(`${viewDate}T${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:00`)
                const end = new Date(start.getTime() + (r.duration_minutes || 120) * 60000)
                return now >= start && now <= end
            })
        }).length
        return { occupied: active, total: tables.length }
    }, [reservations, tables, isToday, nowPosition])

    // --- WALK-IN TRACKER (Seated Walk-Ins for quick reference/Deck) ---
    const walkIns = useMemo(() => {
        return reservations.filter(r => 
            (r.source?.toLowerCase() === 'walk-in' || r.contact_name?.toLowerCase() === 'walk-in') && 
            !['cancelled', 'completed'].includes(r.status) &&
            r.table_id // Show in deck only if it's an active seated walk-in
        )
    }, [reservations])

    // --- AUTO-TABLE SUGGESTION ---
    useEffect(() => {
        if (isAddWalkInOpen) {
            // Find first free table for guest count
            const freeTable = tables.find(t => {
                if (t.capacity < walkInGuests) return false
                const isOccupied = reservations.some(res => {
                    if (res.table_id !== t.id || res.status === 'cancelled') return false
                    // Simple overlap check: mark as taken if there's *any* active reservation for today at this minute
                    // Better would be a time-window check, but for immediate walk-in, simple is often best
                    return res.status === 'confirmed' || res.status === 'seated'
                })
                return !isOccupied
            })
            if (freeTable) setSelectedTableId(freeTable.id)
            else setSelectedTableId('')
        }
    }, [isAddWalkInOpen, walkInGuests, tables, reservations])

    const handleCreateWalkInAction = async () => {
        if (!selectedTableId || isSavingWalkIn) return
        setIsSavingWalkIn(true)
        try {
            const res = await createWalkIn(venueId, 'bar', selectedTableId, walkInGuests)
            if (res.success) {
                setIsAddWalkInOpen(false)
                await refreshData()
            } else {
                console.error("Failed to create walk-in:", res.error)
            }
        } catch (err) {
            console.error("Error in handleCreateWalkInAction:", err)
        } finally {
            setIsSavingWalkIn(false)
        }
    }

    const handleExportCSV = () => {
        const headers = ['Zone', 'Tisch', 'Kapazitaet', 'Gast', 'Zeit', 'Status']
        let csvRows = [headers.join(',')]
        
        tables.forEach(table => {
            const res = reservations.find(r => r.table_id === table.id && !['cancelled', 'completed'].includes(r.status))
            const row = [
                `"${table.zone || 'Main'}"`,
                `"${table.label}"`,
                table.capacity,
                `"${res ? res.contact_name : 'Frei'}"`,
                `"${res ? res.reserved_time : '-'}"`,
                `"${res ? (res.status === 'confirmed' ? 'Bestätigt' : res.status) : 'Verfügbar'}"`
            ]
            csvRows.push(row.join(','))
        })

        const csvString = csvRows.join('\n')
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `reservierungen-${viewDate}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleCompleteAction = async (id: string) => {
        setIsLoading(true)
        const res = await completeReservation(id)
        if (res.success) await refreshData()
        setIsLoading(false)
    }

    const handleCancelAction = async (id: string) => {
        if (!confirm('Möchtest du diesen Gast wirklich entfernen?')) return
        setIsLoading(true)
        const res = await cancelReservation(id)
        if (res.success) await refreshData()
        setIsLoading(false)
    }

    // --- CUSTOM DATE PICKER HELPERS ---
    const generateCalendarDays = (month: number, year: number) => {
        const days = []
        const firstDayOfMonth = new Date(year, month, 1).getDay() 
        const adjFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        for (let i = 0; i < adjFirstDay; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) days.push(i)
        return days
    }

    const handleSelectDate = (day: number) => {
        const selected = new Date(currentCalYear, currentCalMonth, day)
        selected.setHours(12, 0, 0, 0)
        setViewDate(selected.toISOString().split('T')[0])
        setIsDatePickerOpen(false)
    }

    const formattedDisplayDate = useMemo(() => {
        const d = new Date(viewDate)
        return `${d.getDate().toString().padStart(2, '0')}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    }, [viewDate])

    const handleCancelResAction = async (id: string) => {
        if (!confirm('Möshtest du diese Reservierung wirklich stornieren?')) return
        setIsLoading(true)
        const res = await cancelReservation(id)
        if (res.success) await refreshData()
        setIsLoading(false)
        setActiveResMenuId(null)
    }

    const openReschedule = (res: Reservation) => {
        setSelectedResForMove(res)
        setIsRescheduleModalOpen(true)
        setActiveResMenuId(null)
    }

    const handleRescheduleSubmit = async (newDate: string, newTime: string, newTableId: string) => {
        if (!selectedResForMove) return
        setIsLoading(true)
        try {
            const res = await rescheduleReservation({
                id: selectedResForMove.id,
                reserved_date: newDate,
                reserved_time: newTime,
                table_id: newTableId,
                duration_minutes: selectedResForMove.duration_minutes
            })
            if (res.success) {
                await refreshData()
                setIsRescheduleModalOpen(false)
                setSelectedResForMove(null)
            } else {
                alert('Fehler beim Verschieben: ' + (res.error as any)?.message || 'Unbekannter Fehler')
            }
        } catch (err) {
            console.error('Move Error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    // --- STYLES ---
    const walkInCardStyle: React.CSSProperties = {
        background: 'rgba(236, 72, 153, 0.08)',
        border: '1px solid rgba(236, 72, 153, 0.15)',
        borderRadius: 16,
        padding: isMobile ? '8px 12px' : '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: isMobile ? 140 : 180,
        flexShrink: 0,
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: isMobile ? 12 : 0 }}>
            
            {/* --- COMMAND DECK V2 --- */}
            <div className="command-deck-v2">
                <div className="deck-main-controls">
                    {/* Left: Global Date & Nav Cluster */}
                    <div className="deck-nav-cluster">
                        <div className="date-nav-block">
                            <div style={{ position: 'relative' }} ref={datePickerRef}>
                                <div onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="date-picker-compact">
                                    <CalendarIcon size={isMobile ? 16 : 18} color="#ec4899" />
                                    <span>{formattedDisplayDate}</span>
                                    <ChevronDown size={14} opacity={0.4} />
                                </div>
                                {isDatePickerOpen && (
                                    <div className="calendar-popover">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                            <button onClick={() => { if(currentCalMonth===0){ setCurrentCalMonth(11); setCurrentCalYear(v=>v-1)} else setCurrentCalMonth(v=>v-1) }} className="cal-nav-btn"><ChevronLeft size={16}/></button>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 950, color: 'white' }}>{MONTH_NAMES[currentCalMonth]} {currentCalYear}</div>
                                            <button onClick={() => { if(currentCalMonth===11){ setCurrentCalMonth(0); setCurrentCalYear(v=>v+1)} else setCurrentCalMonth(v=>v+1) }} className="cal-nav-btn"><ChevronRight size={16}/></button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                                            {DAY_LABELS.map(l => <div key={l} style={{ fontSize: '0.65rem', fontWeight: 950, color: '#52525b', textAlign: 'center' }}>{l}</div>)}
                                            {generateCalendarDays(currentCalMonth, currentCalYear).map((day, i) => (
                                                <div key={i} onClick={() => day && handleSelectDate(day)} className={`cal-day ${day && new Date(currentCalYear, currentCalMonth, day).toISOString().split('T')[0] === viewDate ? 'active' : ''}`}>{day}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="quick-nav-pills">
                                <button onClick={() => { const d=new Date(viewDate); d.setDate(d.getDate()-1); setViewDate(d.toISOString().split('T')[0]) }} className="pill-btn"><ChevronLeft size={18}/></button>
                                <button onClick={() => { const t=new Date(); setViewDate(t.toISOString().split('T')[0]); setCurrentCalMonth(t.getMonth()); setCurrentCalYear(t.getFullYear()) }} className={`pill-btn main ${isToday ? 'active' : ''}`}>Heute</button>
                                <button onClick={() => { const d=new Date(viewDate); d.setDate(d.getDate()+1); setViewDate(d.toISOString().split('T')[0]) }} className="pill-btn"><ChevronRight size={18}/></button>
                            </div>
                            {isToday && (
                                <button 
                                    onClick={scrollToNow}
                                    className="now-jump-btn"
                                >
                                    JETZT
                                </button>
                            )}
                        </div>

                        <div className="filter-nav-block">
                            <div className="toggle-chip-v2">
                                <div onClick={() => setGroupObjects(!groupObjects)} className={`toggle-track-v2 ${groupObjects ? 'active' : ''}`}>
                                    <div className="toggle-thumb-v2" style={{ left: groupObjects ? 21 : 3 }} />
                                </div>
                                <span>Zonen</span>
                            </div>
                        </div>

                        <div className="unified-search-bar" style={{ marginLeft: 8, height: 42, minWidth: isMobile ? '100%' : 260 }}>
                            <Search size={18} color="#ec4899" opacity={0.4} />
                            <input 
                                type="text" 
                                placeholder="Gast finden..." 
                                value={filterQuery} 
                                onChange={(e) => setFilterQuery(e.target.value)} 
                                className="sleek-search-input" 
                            />
                        </div>
                    </div>
                </div>

                {/* Second Row: Walk-In Control Deck */}
                <div className="deck-secondary-controls">
                    <div className="walk-in-command-cluster">
                        <div className="walk-in-label-block">
                            <Smartphone size={16} color="#ec4899" />
                            <span className="walk-in-count">WALK-INS ({walkIns.length})</span>
                        </div>
                        <div 
                            className={`walk-in-horizontal-deck ${isDragging ? 'dragging' : ''}`}
                            ref={walkInDeckRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                        >
                            {walkIns.length === 0 ? (
                                <div className="deck-empty-state">Derzeit keine Walk-Ins vor Ort.</div>
                            ) : (
                                walkIns.map(wi => {
                                    const tableLabel = tables.find(t => t.id === wi.table_id)?.label || '?'
                                    return (
                                        <div key={wi.id} style={walkInCardStyle} className="walk-in-card">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <p className="cc-wi-name">{wi.contact_name}</p>
                                                    <span className="cc-table-badge">{tableLabel}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <Users size={12} color="#ec4899" opacity={0.6} />
                                                    <span className="cc-wi-count">{wi.guest_count} Gäste</span>
                                                </div>
                                            </div>
                                            <div className="card-actions-vertical">
                                                <div onClick={(e) => { e.stopPropagation(); handleCompleteAction(wi.id) }} className="mini-card-action success" title="Auschecken">
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                <div onClick={(e) => { e.stopPropagation(); handleCancelAction(wi.id) }} className="mini-card-action danger" title="Löschen">
                                                    <Trash2 size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div onClick={() => setIsAddWalkInOpen(true)} className="mini-add-walkin"><Plus size={18} color="#ec4899" /></div>
                        </div>
                </div>
            </div>

            {/* --- RESCHEDULE MODAL --- */}
            {isRescheduleModalOpen && selectedResForMove && (
                <RescheduleModal 
                    reservation={selectedResForMove}
                    tables={tables}
                    onClose={() => setIsRescheduleModalOpen(false)}
                    onSubmit={handleRescheduleSubmit}
                />
            )}
        </div>

            {/* --- ADD WALK-IN MODAL --- */}
            {isAddWalkInOpen && (
                <div className="modal-overlay">
                    <div className="walk-in-modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Smartphone color="#ec4899" />
                                <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.2rem' }}>Walk-In hinzufügen</h3>
                            </div>
                            <button onClick={() => setIsAddWalkInOpen(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#71717a', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>Gästeanzahl</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div className="premium-stepper-capsule">
                                        <button onClick={() => setWalkInGuests(v => Math.max(1, v - 1))} className="stepper-action-btn"><ChevronLeft size={22}/></button>
                                        <div className="stepper-value-container">
                                            <input 
                                                type="number" 
                                                value={walkInGuests} 
                                                onChange={(e) => setWalkInGuests(parseInt(e.target.value) || 1)} 
                                                className="stepper-input-field"
                                            />
                                        </div>
                                        <button onClick={() => setWalkInGuests(v => v + 1)} className="stepper-action-btn"><ChevronRight size={22}/></button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        {[2,4,6,8,10].map(n => (
                                            <button 
                                                key={n} 
                                                onClick={() => setWalkInGuests(n)} 
                                                className={`shortcut-chip ${walkInGuests === n ? 'active' : ''}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#71717a', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Tisch-Zuweisung</label>
                                
                                <div className="custom-select-trigger" onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <LayoutPanelLeft size={18} color="#ec4899" />
                                        <span style={{ fontWeight: 800 }}>
                                            {selectedTableId 
                                                ? `${tables.find(t => t.id === selectedTableId)?.label} (${tables.find(t => t.id === selectedTableId)?.capacity} Plätze)` 
                                                : "Kein Tisch verfügbar"}
                                        </span>
                                    </div>
                                    <ChevronUp size={16} style={{ transform: isTableDropdownOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.3s', opacity: 0.4 }} />
                                </div>

                                {isTableDropdownOpen && (
                                    <div className="custom-select-options">
                                        <div className="options-scroll-container">
                                            {tables.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => { setSelectedTableId(t.id); setIsTableDropdownOpen(false) }} 
                                                    className={`select-option ${selectedTableId === t.id ? 'active' : ''}`}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 950 }}>{t.label}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                                                            <Users size={12} />
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{t.capacity}</span>
                                                        </div>
                                                    </div>
                                                    {t.zone && <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', opacity: 0.6 }}>{t.zone}</p>}
                                                </div>
                                            ))}
                                            {tables.length === 0 && <div className="select-option empty">Keine Tische vorhanden</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleCreateWalkInAction} disabled={!selectedTableId || isSavingWalkIn} style={{ marginTop: 12, height: 56, borderRadius: 16, background: '#ec4899', color: 'white', border: 'none', fontWeight: 950, fontSize: '1.1rem', cursor: selectedTableId ? 'pointer' : 'not-allowed', opacity: selectedTableId ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3)' }}>
                                {isSavingWalkIn ? <RefreshCw size={20} className="animate-spin" /> : <><Check size={20} /> Gast einchecken</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREVIEW MODAL --- */}
            {isPreviewOpen && (
                <div className="walk-in-modal-container" style={{ zIndex: 2000 }}>
                    <div className="walk-in-modal-content print-area" style={{ maxWidth: '95vw', width: 1200, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white' }}>
                                    {venueName ? `Heutige Reservierungen - ${venueName}` : 'Heutige Reservierungen'}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{formattedDisplayDate}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => window.print()} className="pill-btn main" style={{ height: 36, padding: '0 16px', fontSize: '0.8rem' }}>
                                    <Printer size={16} /> Drucken
                                </button>
                                <button onClick={() => setIsPreviewOpen(false)} className="pill-btn" style={{ height: 36, width: 36 }}><X size={18}/></button>
                            </div>
                        </div>

                        <div className="preview-scroll-area" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', padding: '0 20px 40px 20px' }}>
                            {Object.entries(zones).map(([zoneName, zoneTables]) => (
                                <div key={zoneName} style={{ marginBottom: 32 }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: 950, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, borderBottom: '2px solid rgba(236,72,153,0.3)', paddingBottom: 6 }}>
                                        {zoneName} <span style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.7rem' }}>({zoneTables.length} TISCHE)</span>
                                    </h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                <th style={{ textAlign: 'left', padding: '10px 15px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', width: 60 }}>Tisch</th>
                                                <th style={{ textAlign: 'left', padding: '10px 15px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Gast / Reservierung</th>
                                                <th style={{ textAlign: 'center', padding: '10px 15px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', width: 60 }}>Pax</th>
                                                <th style={{ textAlign: 'center', padding: '10px 15px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', width: 80 }}>Zeit</th>
                                                <th className="hide-on-screen" style={{ textAlign: 'center', padding: '10px 15px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', width: 80 }}>Check</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {zoneTables.map((table) => {
                                                const res = reservations.find(r => r.table_id === table.id && !['cancelled', 'completed'].includes(r.status))
                                                return (
                                                    <tr key={table.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: res ? 'rgba(236,72,153,0.02)' : 'transparent' }}>
                                                        <td style={{ padding: '12px 15px', fontSize: '0.85rem', fontWeight: 900, color: res ? '#ec4899' : 'rgba(255,255,255,0.2)' }}>{table.label}</td>
                                                        <td style={{ padding: '12px 15px' }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: res ? 'white' : 'rgba(255,255,255,0.1)' }}>{res ? res.contact_name : 'Verfügbar'}</div>
                                                            {res && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 }}>{res.status}</div>}
                                                        </td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: res ? 'white' : 'rgba(255,255,255,0.1)' }}>{table.capacity}</td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 950, color: res ? '#ec4899' : 'rgba(255,255,255,0.05)' }}>{res ? res.reserved_time : '--'}</td>
                                                        <td className="hide-on-screen" style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                            <div style={{ width: 24, height: 24, border: '1px solid rgba(0,0,0,0.1)', margin: '0 auto' }} />
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                        
                        {/* Branded Print Footer */}
                        <div className="print-footer hide-on-screen" style={{ borderTop: '1px solid #000', marginTop: 20, paddingTop: 10, textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'black' }}>
                                www.clubify.at/bar/{venueName?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'your-bar'}
                            </p>
                            <p style={{ fontSize: '0.6rem', color: '#666', marginTop: 4 }}>Gedruckt via Clubify Dashboard • {new Date().toLocaleDateString('de-DE')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN GRID --- */}
            <div className={`grid-glass-container ${isDraggingGrid ? 'dragging' : ''}`}>
                <div 
                    ref={gridScrollRef}
                    onMouseDown={handleGridMouseDown}
                    onMouseMove={handleGridMouseMove}
                    onMouseUp={stopGridDragging}
                    onMouseLeave={stopGridDragging}
                    style={{ overflowX: 'auto', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', cursor: isDraggingGrid ? 'grabbing' : 'auto' }} 
                    className="timeline-scroll-container"
                >
                    
                    {/* Header */}
                    <div className="grid-time-header">
                        <div className="grid-corner">
                            <div className="total-occupancy-card">
                                <span className="total-label">LIVE GESAMT</span>
                                <div className="total-stats-display">
                                    <span className="count">{totalStats.occupied}</span>
                                    <span className="slash">/</span>
                                    <span className="total">{totalStats.total}</span>
                                </div>
                                <div className="corner-actions">
                                    <button onClick={() => setIsPreviewOpen(true)} className="corner-action-btn" title="Vorschau">
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={handleExportCSV} className="corner-action-btn" title="Download CSV">
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {timeSlots.map((slot, i) => (
                            <div key={i} className="time-slot-column">
                                <div style={{ fontSize: '0.6rem', fontWeight: 950, color: '#ec4899', marginBottom: 4 }}>{showOccupancy ? `${columnStats[i].occupied}/${columnStats[i].total}` : ''}</div>
                                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 950, color: 'white' }}>{slot}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid-rows-container">
                        {Object.entries(zones).map(([zoneName, zoneTables]) => (
                            <div key={zoneName} style={{ display: 'flex', flexDirection: 'column', minWidth: 'max-content' }}>
                                {groupObjects && (
                                    <div onClick={() => setExpandedZones(prev => ({ ...prev, [zoneName]: !prev[zoneName] }))} className="zone-group-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', left: 32 }}>
                                            <ChevronDown size={isMobile ? 16 : 20} color="#ec4899" style={{ transform: expandedZones[zoneName] ? '' : 'rotate(-90deg)', transition: '0.3s' }} />
                                            <span className="zone-name">{zoneName}</span>
                                        </div>
                                        <div className="zone-divider" />
                                        <div className="zone-badge" style={{ position: 'sticky', right: 32 }}>
                                            <span className="zone-stats-count">
                                                {getZoneOccupancy(zoneTables).occupied}/{getZoneOccupancy(zoneTables).total}
                                            </span>
                                            <span className="zone-stats-label">Belegt</span>
                                        </div>
                                    </div>
                                )}

                                {expandedZones[zoneName] && zoneTables.map((table, tIndex) => (
                                    <div key={table.id} className={`table-row ${tIndex % 2 === 0 ? 'alt' : ''}`}>
                                        <div className="table-sidebar">
                                            <div className="sidebar-indicator" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="table-label">{isMobile ? table.label.replace('Tisch ', 'T') : table.label}</p>
                                                {!isMobile && <p className="table-capacity">{table.capacity} Plätze</p>}
                                            </div>
                                            {!isMobile && (
                                                <div 
                                                    className="table-action-dots" 
                                                    onClick={(e) => { e.stopPropagation(); setActiveTableMenuId(activeTableMenuId === table.id ? null : table.id) }}
                                                    style={{ position: 'relative' }}
                                                >
                                                    <MoreVertical size={18} />
                                                    {activeTableMenuId === table.id && (
                                                        <div className="table-context-menu">
                                                            <div className="menu-item"><Info size={14}/> Details</div>
                                                            <div className="menu-item"><Clock size={14}/> Status ändern</div>
                                                            <div className="menu-item danger"><Trash2 size={14}/> Sperren</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="reservation-track" style={{ minWidth: timeSlots.length * hourWidth, height: '100%' }}>
                                            {timeSlots.map((_, i) => <div key={i} className="hour-guide-line" style={{ left: i * hourWidth }} />)}
                                            {isToday && nowPosition !== null && (
                                                <div className="now-indicator-line" style={{ left: nowPosition }} />
                                            )}
                                            {reservations
                                                .filter(r => r.table_id === table.id && !['cancelled', 'completed'].includes(r.status))
                                                .filter(r => r.contact_name.toLowerCase().includes(filterQuery.toLowerCase()))
                                                .map(res => {
                                                    const sourceColor = res.source === 'google' ? '#3b82f6' : '#ec4899'
                                                    const visualDuration = Math.min(Math.max(res.duration_minutes || 120, 30), 480)
                                                    const blockWidth = visualDuration / 60 * hourWidth
                                                    const isMenuActive = activeResMenuId === res.id

                                                    return (
                                                        <div 
                                                          key={res.id} 
                                                          className="reservation-block" 
                                                          onClick={(e) => { e.stopPropagation(); setActiveResMenuId(isMenuActive ? null : res.id) }}
                                                          style={{ 
                                                            left: getPosition(res.reserved_time) + 4, 
                                                            width: blockWidth - 8, 
                                                            background: `linear-gradient(135deg, ${sourceColor}44, ${sourceColor}22)`, 
                                                            border: `1.5px solid ${sourceColor}88`,
                                                            cursor: 'pointer',
                                                            zIndex: isMenuActive ? 300 : 10
                                                          }}
                                                        >
                                                            {res.source === 'google' ? <Globe size={isMobile ? 14 : 18} color={sourceColor} /> : <Smartphone size={isMobile ? 14 : 18} color={sourceColor}/>}
                                                            <div style={{ flex: 1, minWidth: 0 }}><p className="res-name">{res.contact_name}</p></div>
                                                            {blockWidth > (isMobile ? 80 : 130) && (
                                                                <div className="res-count-badge">
                                                                    <User size={12} color={sourceColor} />
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 950, color: 'white' }}>{res.guest_count}</span>
                                                                </div>
                                                            )}

                                                            {/* RESERVATION CONTEXT MENU */}
                                                            {isMenuActive && (
                                                                <div className="res-context-menu">
                                                                    <div className="menu-item" onClick={() => openReschedule(res)}>
                                                                        <ArrowUpDown size={14} color="#8b5cf6" /> Verschieben
                                                                    </div>
                                                                    <div className="menu-item danger" onClick={() => handleCancelResAction(res.id)}>
                                                                        <Trash2 size={14} /> Stornieren
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .command-deck-v2 {
                    background: rgba(24, 24, 27, 0.4);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 28px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 24px;
                    box-shadow: 0 16px 48px -8px rgba(0,0,0,0.4);
                }
                .deck-main-controls { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
                .deck-secondary-controls { display: flex; align-items: center; width: 100%; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; margin-top: 4px; }
                .deck-nav-cluster { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; flex: 1; }
                .date-nav-block { display: flex; align-items: center; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06); }
                .date-picker-compact { padding: 8px 16px; display: flex; align-items: center; gap: 10px; color: white; font-size: 0.9rem; font-weight: 800; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.1); transition: 0.2s; }
                .date-picker-compact:hover { background: rgba(255,255,255,0.03); }
                .quick-nav-pills { display: flex; gap: 4px; padding-left: 4px; }
                .pill-btn { background: transparent; border: none; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; opacity: 0.6; }
                .pill-btn:hover { background: rgba(255,255,255,0.05); opacity: 1; }
                .pill-btn.main { width: auto; padding: 0 14px; font-size: 0.8rem; font-weight: 900; opacity: 1; }
                .pill-btn.main.active { border: 1.5px solid #ec4899; color: #ec4899; background: rgba(236,72,153,0.05); }
                .filter-nav-block { background: rgba(0,0,0,0.3); padding: 4px 14px; height: 42px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; }
                .toggle-chip-v2 { display: flex; align-items: center; gap: 10px; color: #71717a; font-size: 0.75rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.05em; }
                .toggle-track-v2 { width: 42px; height: 22px; background: rgba(255,255,255,0.08); border-radius: 99px; position: relative; cursor: pointer; transition: 0.2s; }
                .toggle-track-v2.active { background: #ec489933; border: 1px solid #ec4899; }
                .toggle-thumb-v2 { width: 16px; height: 16px; background: white; border-radius: 99px; position: absolute; top: 2px; transition: 0.2s; box-shadow: 0 0 10px rgba(236,72,153,0.4); }
                .walk-in-command-cluster { flex: 1; display: flex; align-items: center; gap: 24px; background: rgba(255,255,255,0.015); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; min-width: 0; }
                .walk-in-label-block { display: flex; align-items: center; gap: 10px; }
                .walk-in-count { font-size: 0.75rem; font-weight: 950; color: #ec4899; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
                .walk-in-horizontal-deck { display: flex; align-items: center; gap: 14px; overflow-x: auto; padding: 4px 20px 4px 0; scrollbar-width: none; flex: 1; min-width: 0; cursor: grab; user-select: none; }
                .walk-in-horizontal-deck.dragging { cursor: grabbing; }
                .walk-in-horizontal-deck::-webkit-scrollbar { display: none; }
                .walk-in-card { flex-shrink: 0; transition: transform 0.1s; }
                .walk-in-card:active { transform: scale(0.98); }
                .deck-empty-state { font-size: 0.8rem; color: #52525b; font-style: normal; font-weight: 700; opacity: 0.6; }
                .cc-wi-name { font-size: 0.85rem; font-weight: 950; color: white; margin: 0; white-space: nowrap; }
                .cc-table-badge { font-size: 0.65rem; font-weight: 950; background: #ec4899; color: white; padding: 2px 6px; border-radius: 6px; text-transform: uppercase; }
                .cc-wi-count { font-size: 0.75rem; font-weight: 900; color: #ec4899; opacity: 0.8; }
                .card-actions-vertical { display: flex; flex-direction: column; gap: 6px; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 10px; }
                .mini-card-action { background: rgba(255,255,255,0.03); color: #71717a; padding: 8px; border-radius: 10px; display: flex; cursor: pointer; transition: 0.2s; }
                .mini-card-action.success:hover { background: rgba(34, 197, 94, 0.2); color: #22c55e; transform: scale(1.1); }
                .mini-card-action.danger:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; transform: scale(1.1); }
                .mini-add-walkin { width: 44px; height: 44px; border: 2px dashed rgba(236,72,153,0.3); border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: 0.2s; }
                .mini-add-walkin:hover { background: rgba(236,72,153,0.1); border-color: #ec4899; border-style: solid; transform: scale(1.05); }
                
                .premium-stepper-capsule {
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 8px;
                    width: 100%;
                }
                .stepper-action-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 18px;
                    border: none;
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stepper-action-btn:hover { background: rgba(236, 72, 153, 0.2); color: #ec4899; transform: scale(1.05); }
                .stepper-action-btn:active { transform: scale(0.95); }
                
                .stepper-value-container { flex: 1; text-align: center; }
                .stepper-input-field {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 1.8rem;
                    font-weight: 950;
                    width: 100%;
                    text-align: center;
                    outline: none;
                }
                
                .shortcut-chip {
                    flex: 1;
                    padding: 10px 0;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #71717a;
                    border: 1px solid transparent;
                    font-size: 0.85rem;
                    font-weight: 950;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .shortcut-chip:hover { background: rgba(255, 255, 255, 0.08); color: white; }
                .shortcut-chip.active {
                    background: rgba(236, 72, 153, 0.15);
                    border-color: rgba(236, 72, 153, 0.3);
                    color: #ec4899;
                }
                
                .custom-select-trigger {
                    height: 64px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 0 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .custom-select-trigger:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255,255,255,0.15); }
                
                .custom-select-options {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: rgba(12, 12, 14, 0.95);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 24px;
                    z-index: 100;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.8);
                    overflow: hidden;
                    animation: calendar-in 0.2s ease-out;
                }
                .options-scroll-container { max-height: 280px; overflow-y: auto; padding: 8px; }
                .select-option {
                    padding: 12px 16px;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .select-option:hover { background: rgba(255, 255, 255, 0.05); }
                .select-option.active { background: rgba(236, 72, 153, 0.12); color: #ec4899; }
                .select-option.empty { cursor: default; color: #52525b; font-style: italic; }
                
                .options-scroll-container::-webkit-scrollbar { width: 6px; }
                .options-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .deck-header-right { width: 100%; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 8px; }
                .unified-search-bar { display: flex; align-items: center; gap: 14px; padding: 0 16px; height: 48px; background: rgba(0,0,0,0.2); border-radius: 16px; }
                .sleek-search-input { background: transparent; border: none; color: white; width: 100%; font-size: 0.95rem; font-weight: 700; outline: none; }
                
                .modal-overlay { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100vw; 
                    height: 100vh; 
                    background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(12px); 
                    z-index: 9999; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    animation: fadeIn 0.2s ease-out; 
                }
                .walk-in-modal-container { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100vw; 
                    height: 100vh; 
                    background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(12px); 
                    z-index: 9999; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    animation: fadeIn 0.2s ease-out; 
                }
                .walk-in-modal-content { 
                    background: #0c0c0e; 
                    border: 1px solid rgba(255,255,255,0.12); 
                    border-radius: 32px; 
                    padding: 40px; 
                    width: 460px; 
                    max-width: 95vw;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.8); 
                }
                .modal-select { width: 100%; height: 56px; border-radius: 16px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0 16px; font-size: 1rem; font-weight: 700; outline: none; transition: 0.2s; }
                .modal-select:focus { border-color: #ec4899; }

                .calendar-popover { position: absolute; top: 110%; left: 0; width: 320px; background: rgba(12, 12, 14, 0.95); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 24px; z-index: 500; box-shadow: 0 32px 64px rgba(0,0,0,0.8); animation: calendar-in 0.3s ease-out; }
                .cal-nav-btn { background: rgba(255,255,255,0.05); border: none; color: white; padding: 10px; border-radius: 12px; cursor: pointer; }
                .cal-day { height: 38px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 900; color: white; border-radius: 10px; cursor: pointer; transition: 0.2s; }
                .cal-day.active { background: #ec4899; }
                .grid-glass-container { background: #09090b; border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; display: flex; flexDirection: column; box-shadow: 0 24px 64px -12px rgba(0,0,0,0.5); height: 100%; flex: 1; }
                .grid-time-header { display: flex; padding-right: 120px; border-bottom: 1px solid rgba(255,255,255,0.15); background: #09090b; position: sticky; top: 0; z-index: 120; min-width: fit-content; }
                .grid-corner { width: ${sidebarWidth}px; flex-shrink: 0; background: #09090b; position: sticky; left: 0; z-index: 140; border-right: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
                .total-occupancy-card { display: flex; flex-direction: column; align-items: center; width: 100%; padding: 4px 0; gap: 4px; }
                .total-label { font-size: 0.55rem; font-weight: 950; color: rgba(255,255,255,0.3); letter-spacing: 0.08em; text-transform: uppercase; }
                .total-stats-display { display: flex; align-items: center; gap: 4px; line-height: 1; }
                .total-stats-display .count { font-size: 1.1rem; font-weight: 950; color: #ec4899; text-shadow: 0 0 10px rgba(236,72,153,0.3); }
                .total-stats-display .slash { font-size: 0.8rem; color: rgba(255,255,255,0.1); font-weight: 950; }
                .total-stats-display .total { font-size: 0.8rem; font-weight: 800; color: rgba(255,255,255,0.3); }
                .corner-actions { display: flex; gap: 6px; }
                .corner-action-btn { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.05); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                .corner-action-btn:hover { background: rgba(236,72,153,0.1); color: #ec4899; border-color: rgba(236,72,153,0.2); }
                .corner-action-btn:active { transform: scale(0.95); }

                .time-slot-column { width: ${hourWidth}px; flex-shrink: 0; padding: 24px 0; border-left: 1px solid rgba(255,255,255,0.05); text-align: center; }
                .grid-rows-container { display: flex; flex-direction: column; width: max-content; min-width: 100%; background: #09090b; border-right: 120px solid transparent; }
                .zone-group-header { display: flex; align-items: center; justify-content: space-between; background: #09090b; padding: 16px 32px; position: sticky; left: 0; z-index: 130; cursor: pointer; border-bottom: 1px solid rgba(255, 255, 255, 0.05); border-left: 4px solid #ec4899; box-shadow: 10px 0 15px -3px rgba(0,0,0,0.5); width: 100%; }
                .zone-group-header:hover { background: #121214; }
                .zone-name { font-size: 1.1rem; font-weight: 950; color: white; letter-spacing: -0.02em; }
                .zone-divider { flex: 1; height: 1px; background: linear-gradient(to right, rgba(255,255,255,0.1), transparent); margin: 0 24px; opacity: 0.3; }
                .zone-badge { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
                .zone-stats-count { font-size: 1rem; font-weight: 950; color: #ec4899; }
                .zone-stats-label { font-size: 0.7rem; font-weight: 900; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
                
                .table-row { display: flex; min-height: 72px; position: relative; border-bottom: 1px solid rgba(255,255,255,0.03); background: #09090b; }
                .table-row.alt { background: #0c0c0e; }
                .table-sidebar { width: ${sidebarWidth}px; flex-shrink: 0; position: sticky; left: 0; z-index: 100; background: #09090b; border-right: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 16px; padding: 0 28px; }
                .table-row.alt .table-sidebar { background: #0c0c0e; }
                .table-action-dots { color: #52525b; cursor: pointer; padding: 4px; border-radius: 6px; transition: 0.2s; }
                .table-action-dots:hover { background: rgba(255,255,255,0.05); color: white; }
                
                .table-context-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 180px;
                    background: rgba(12,12,14,0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 8px;
                    z-index: 500;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.8);
                    animation: calendar-in 0.2s ease-out;
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #a1a1aa;
                    transition: 0.2s;
                }
                .menu-item:hover { background: rgba(255,255,255,0.05); color: white; }
                .menu-item.danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .sidebar-indicator { width: 4px; height: 28px; background: #ec4899; border-radius: 2px; box-shadow: 0 0 12px #ec4899; }
                .reservation-track { flex: 1; position: relative; }
                .hour-guide-line { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.08); z-index: 1; }
                .now-indicator-line { 
                    position: absolute; 
                    top: 0; 
                    bottom: 0; 
                    width: 2px; 
                    background: linear-gradient(to bottom, #ec4899, rgba(236,72,153,0)); 
                    z-index: 2; 
                    pointer-events: none; 
                }
                .now-indicator-line::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -4px;
                    width: 10px;
                    height: 10px;
                    background: #ec4899;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #ec4899;
                }
                .reservation-block { position: absolute; height: 52px; top: 10px; backdrop-filter: blur(16px); border-radius: 16px; display: flex; align-items: center; padding: 0 18px; gap: 14px; z-index: 10; transition: 0.2s; box-shadow: inset 0 1px 1.5px rgba(255,255,255,0.3), 0 12px 28px -6px rgba(0,0,0,0.5); }
                .res-count-badge { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); }
                
                .grid-glass-container.dragging { user-select: none; }
                .grid-glass-container.dragging .timeline-scroll-container { cursor: grabbing !important; }
                
                .now-jump-btn { background: #ec4899; color: white; border: none; padding: 6px 14px; border-radius: 10px; font-size: 0.65rem; font-weight: 950; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(236,72,153,0.3); margin-left: 8px; }
                .now-jump-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(236,72,153,0.4); }
                .now-jump-btn:active { transform: scale(0.95); }
                
                .p-t-label { fontSize: 0.75rem; fontWeight: 950; color: rgba(255,255,255,0.5); width: 24px; }
                .p-t-divider { border-left: 1px solid rgba(255,255,255,0.1); height: 20px; margin: 0 4px; }
                .p-t-name { fontSize: 0.8rem; fontWeight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
                .p-t-info { fontSize: 0.6rem; color: rgba(255,255,255,0.3); }
                .p-t-time { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.5); text-align: right; }
                .preview-table-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }

                @media (max-width: 768px) {
                    .command-deck-v2 { padding: 12px; border-radius: 20px; gap: 12px; margin-bottom: 12px; }
                    .deck-main-controls { flex-direction: column; align-items: stretch; gap: 16px; }
                    .deck-nav-cluster { flex-direction: column; align-items: stretch; gap: 12px; }
                    .date-nav-block { width: 100%; flex-direction: column; gap: 12px; align-items: stretch; }
                    .quick-nav-pills { width: 100%; justify-content: space-between; }
                    .pill-btn { flex: 1; height: 44px; justify-content: center; }
                    .now-jump-btn { height: 44px; width: 100%; margin-left: 0; font-size: 0.8rem; }
                    .date-picker-compact { width: 100%; height: 48px; border: 1px solid rgba(255,255,255,0.1); }
                    .filter-nav-block { width: 100%; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; }
                    .unified-search-bar { width: 100% !important; margin-left: 0 !important; }
                    .walk-in-command-cluster { width: 100%; flex-direction: column; align-items: stretch; gap: 16px; }
                    .walk-in-label-block { width: 100%; justify-content: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                    .walk-in-horizontal-deck { width: 100%; min-height: 100px; }
                    .grid-glass-container { border-radius: 0; border: none; background: transparent; }
                    .total-occupancy-card { padding: 8px 0; }
                    .total-stats-pill .count { font-size: 0.9rem; }
                    .grid-time-header { padding-left: 100px; padding-right: 60px; }
                    .table-sidebar { width: 100px; padding: 0 12px; }
                    .walk-in-modal-content { width: calc(100vw - 32px); padding: 24px; border-radius: 24px; }
                }

                .hide-on-screen { display: none; }

                @media print {
                    @page { 
                        size: auto;
                        margin: 15mm 10mm 15mm 10mm; 
                    }
                    
                    :global(html, body) { 
                        background: white !important; 
                        height: auto !important; 
                        overflow: visible !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Hard hide for ALL dashboard UI residues */
                    :global(.dashboard-header), 
                    :global(.navigation-shell), 
                    :global(.command-deck-v2), 
                    :global(.grid-glass-container), 
                    :global(.dashboard-header *),
                    :global(.navigation-shell *),
                    :global(header), 
                    :global(nav), 
                    :global(aside), 
                    :global(.sidebar) { 
                        display: none !important; 
                        visibility: hidden !important;
                        opacity: 0 !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    :global(.dashboard-header), 
                    :global(.navigation-shell), 
                    :global(.command-deck-v2), 
                    :global(.grid-glass-container), 
                    :global(header), 
                    :global(nav), 
                    :global(aside), 
                    :global(.sidebar) { 
                        display: none !important; 
                        visibility: hidden !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                    
                    .walk-in-modal-container { 
                        background: white !important; 
                        padding: 0 !important; 
                        position: static !important; 
                        width: 100% !important;
                        display: block !important;
                        z-index: 99999 !important;
                        height: auto !important;
                        min-height: 0 !important;
                        visibility: visible !important;
                    }

                    .walk-in-modal-content {
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .print-area { 
                        display: block !important; 
                        background: white !important; 
                        color: black !important; 
                        width: 100% !important; 
                    }

                    .print-area * { 
                        color: black !important; 
                        background: transparent !important; 
                        border-color: #333 !important; 
                        box-shadow: none !important; 
                    }
                    
                    .preview-scroll-area { 
                        overflow: visible !important; 
                        height: auto !important; 
                        max-height: none !important; 
                    }

                    table { 
                        display: table !important;
                        width: 100% !important; 
                        border: 1px solid #000 !important; 
                        border-collapse: collapse !important;
                        margin-top: 10px !important;
                    }
                    
                    thead { display: table-header-group !important; }
                    tbody { display: table-row-group !important; }
                    tr { display: table-row !important; break-inside: avoid; }
                    th { 
                        display: table-cell !important;
                        background: #f5f5f5 !important; 
                        border: 1px solid #000 !important; 
                        color: #000 !important; 
                        font-weight: bold !important;
                        padding: 8px !important;
                        -webkit-print-color-adjust: exact;
                    }
                    
                    td { 
                        display: table-cell !important;
                        border: 1px solid #000 !important; 
                        color: #000 !important;
                        padding: 10px 15px !important;
                    }

                    .hide-on-screen { display: table-cell !important; }
                    .p-t-name { color: black !important; font-size: 1rem !important; }
                    h3 { font-size: 1.8rem !important; color: #000 !important; text-align: center !important; margin-bottom: 5px !important; }
                    h4 { font-size: 1rem !important; color: #000 !important; border-bottom: 2px solid #000 !important; margin-top: 25px !important; }
                    
                    .print-footer { display: block !important; }
                    tr { break-inside: avoid; }
                    .pill-btn, .now-indicator-line { display: none !important; }
                }
            `}</style>
            
            <style jsx global>{`
                .timeline-scroll-container::-webkit-scrollbar { height: 10px; }
                .timeline-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; border: 3px solid #09090b; }
                .timeline-scroll-container::-webkit-scrollbar-track { background: transparent; }
                @keyframes calendar-in { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media print {
                    @page { 
                        size: auto;
                        margin: 15mm 10mm 15mm 10mm; 
                        -webkit-print-color-adjust: exact;
                    }
                    
                    html, body { 
                        background: white !important; 
                        height: auto !important; 
                        overflow: visible !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: hidden !important; /* Hide EVERYTHING by default */
                    }

                    /* Restore visibility for the modal branch */
                    .walk-in-modal-container, 
                    .walk-in-modal-container * {
                        visibility: visible !important;
                    }

                    .dashboard-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }

                    .dashboard-header, 
                    .navigation-shell, 
                    .command-deck-v2, 
                    .grid-glass-container,
                    header, nav, aside, footer { 
                        display: none !important; 
                    }
                    
                    .walk-in-modal-container { 
                        background: white !important; 
                        padding: 0 !important; 
                        position: absolute !important; /* Ensure it floats to the top of the paper */
                        top: 0 !important;
                        left: 0 !important;
                        display: block !important;
                        width: 100% !important;
                        z-index: 99999 !important;
                    }

                    .walk-in-modal-content {
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .print-area { 
                        display: block !important; 
                        background: white !important; 
                        color: black !important; 
                        width: 100% !important; 
                    }

                    .print-area * { 
                        color: black !important; 
                        background: transparent !important; 
                        border-color: #000 !important; 
                        box-shadow: none !important; 
                    }
                    
                    .preview-scroll-area { 
                        overflow: visible !important; 
                        height: auto !important; 
                        max-height: none !important; 
                        padding: 0 !important;
                    }

                    table { 
                        display: table !important;
                        width: 100% !important; 
                        border: 2px solid #000 !important; 
                        border-collapse: collapse !important;
                        margin-top: 15px !important;
                    }
                    
                    thead { display: table-header-group !important; }
                    tbody { display: table-row-group !important; }
                    tr { display: table-row !important; break-inside: avoid; border: 1px solid #000 !important; }
                    th { 
                        display: table-cell !important;
                        background: #f0f0f0 !important; 
                        border: 1px solid #000 !important; 
                        color: #000 !important; 
                        font-weight: 700 !important;
                        padding: 10px !important;
                    }
                    
                    td { 
                        display: table-cell !important;
                        border: 1px solid #000 !important; 
                        color: #000 !important;
                        padding: 10px 15px !important;
                    }

                    .hide-on-screen { display: table-cell !important; }
                    .p-t-name { font-size: 1.1rem !important; font-weight: 700 !important; color: #000 !important; }
                    h3 { font-size: 2.2rem !important; color: #000 !important; text-align: center !important; margin-bottom: 8px !important; }
                    h4 { font-size: 1.2rem !important; color: #000 !important; border-bottom: 3px solid #000 !important; margin-top: 25px !important; padding-bottom: 5px !important; }
                    
                    .print-footer { display: block !important; }
                    .pill-btn, .now-indicator-line { display: none !important; }
                }
                .res-context-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(12,12,14,0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 6px;
                    z-index: 500;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.8);
                    animation: calendar-in 0.2s ease-out;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
            `}</style>
        </div>
    )
}

function RescheduleModal({ reservation, tables, onClose, onSubmit }: { 
    reservation: Reservation, 
    tables: Table[], 
    onClose: () => void, 
    onSubmit: (date: string, time: string, tableId: string) => void 
}) {
    const [date, setDate] = useState(reservation.reserved_date)
    const [time, setTime] = useState(reservation.reserved_time)
    const [tableId, setTableId] = useState(reservation.table_id || '')
    
    // UI States for Pickers
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [showTablePicker, setShowTablePicker] = useState(false)
    const [calendarMonth, setCalendarMonth] = useState(new Date(reservation.reserved_date))

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: '14px 18px',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: 600,
        outline: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.65rem',
        fontWeight: 950,
        color: '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        marginBottom: 10,
        marginLeft: 4
    }

    // Helper: Days in Month
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1)
        const days = []
        // Adjust to Monday start (0=Sun, 1=Mon... -> Mo=1, Tu=2, We=3, Th=4, Fr=5, Sa=6, Su=0)
        let firstDay = date.getDay()
        if (firstDay === 0) firstDay = 7 // Make Sunday 7
        
        // Pad previous month
        for (let i = 1; i < firstDay; i++) days.push(null)
        
        while (date.getMonth() === month) {
            days.push(new Date(date))
            date.setDate(date.getDate() + 1)
        }
        return days
    }

    const calendarDays = useMemo(() => getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth()), [calendarMonth])

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    return createPortal(
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 999999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(20px)', 
            WebkitBackdropFilter: 'blur(20px)', 
            background: 'rgba(0,0,0,0.9)' 
        }}>
            <div style={{ 
                width: 440, 
                background: '#09090b', 
                border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 40, 
                padding: 40,
                boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ padding: 10, background: 'rgba(236, 72, 153, 0.1)', borderRadius: 12 }}>
                            <ArrowUpDown size={20} color="#ec4899" />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.02em' }}>Termin ändern</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#52525b', borderRadius: 12, padding: 8, cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* DATE SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Datum</label>
                        <div onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }} style={{ ...inputStyle, borderColor: showDatePicker ? '#ec4899' : 'rgba(255,255,255,0.05)' }}>
                            <span>{new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            <CalendarIcon size={16} color={showDatePicker ? '#ec4899' : '#52525b'} />
                        </div>
                        
                        <AnimatePresence>
                            {showDatePicker && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{ 
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 12,
                                        background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>{MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                                            <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                                        {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((d, i) => (
                                            <span key={i} style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3f3f46', textAlign: 'center', marginBottom: 8 }}>{d}</span>
                                        ))}
                                        {calendarDays.map((d, i) => {
                                            if (!d) return <div key={i} />
                                            const dISO = d.toISOString().split('T')[0]
                                            const isSelected = dISO === date
                                            return (
                                                <button 
                                                    key={i} 
                                                    onClick={() => { setDate(dISO); setShowDatePicker(false); }}
                                                    style={{ 
                                                        width: '100%', aspectRatio: '1', borderRadius: 10, border: 'none', 
                                                        background: isSelected ? '#ec4899' : 'transparent',
                                                        color: isSelected ? 'white' : '#a1a1aa',
                                                        fontSize: '0.75rem', fontWeight: isSelected ? 900 : 500, cursor: 'pointer'
                                                    }}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* TIME SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Uhrzeit</label>
                        <div onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }} style={{ ...inputStyle, borderColor: showTimePicker ? '#ec4899' : 'rgba(255,255,255,0.05)', fontFamily: 'Space Mono, monospace' }}>
                            <span>{time} Uhr</span>
                            <Clock size={16} color={showTimePicker ? '#ec4899' : '#52525b'} />
                        </div>

                        <AnimatePresence>
                            {showTimePicker && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{ 
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 12,
                                        background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 12,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                            const h = Math.floor(i / 4).toString().padStart(2, '0')
                                            const m = ((i % 4) * 15).toString().padStart(2, '0')
                                            const t = `${h}:${m}`
                                            const isSelected = t === time
                                            return (
                                                <button 
                                                    key={i} 
                                                    onClick={() => { setTime(t); setShowTimePicker(false); }}
                                                    style={{ 
                                                        padding: '8px 4px', borderRadius: 8, border: 'none', 
                                                        background: isSelected ? '#ec4899' : 'rgba(255,255,255,0.03)',
                                                        color: isSelected ? 'white' : '#71717a',
                                                        fontSize: '0.7rem', fontWeight: isSelected ? 900 : 600, cursor: 'pointer',
                                                        fontFamily: 'Space Mono, monospace'
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

                    {/* TABLE SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Tisch-Zuweisung</label>
                        <div 
                            onClick={() => { setShowTablePicker(!showTablePicker); setShowDatePicker(false); setShowTimePicker(false); }} 
                            style={{ ...inputStyle, borderColor: showTablePicker ? '#ec4899' : 'rgba(255,255,255,0.05)' }}
                        >
                            <span>{tableId ? tables.find(t => t.id === tableId)?.label : 'Warteliste / Kein Tisch'}</span>
                            <ChevronDown size={16} color={showTablePicker ? '#ec4899' : '#52525b'} />
                        </div>

                        <AnimatePresence>
                            {showTablePicker && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{ 
                                        position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100, marginBottom: 12,
                                        background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 12,
                                        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', maxHeight: 300, overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <button 
                                            onClick={() => { setTableId(''); setShowTablePicker(false); }}
                                            style={{ 
                                                width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', textAlign: 'left',
                                                background: tableId === '' ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                                                color: tableId === '' ? '#ec4899' : '#a1a1aa',
                                                fontSize: '0.85rem', fontWeight: tableId === '' ? 900 : 500, cursor: 'pointer'
                                            }}
                                        >
                                            Warteliste / Kein Tisch
                                        </button>
                                        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                                        {tables.map(t => {
                                            const isSelected = t.id === tableId
                                            return (
                                                <button 
                                                    key={t.id} 
                                                    onClick={() => { setTableId(t.id); setShowTablePicker(false); }}
                                                    style={{ 
                                                        width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', textAlign: 'left',
                                                        background: isSelected ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                                                        color: isSelected ? '#ec4899' : '#a1a1aa',
                                                        fontSize: '0.85rem', fontWeight: isSelected ? 900 : 500, cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                >
                                                    <span>{t.label}</span>
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{t.capacity} Plätze</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={() => onSubmit(date, time, tableId)}
                        style={{ 
                            marginTop: 16, width: '100%', padding: '18px', borderRadius: 16, border: 'none', 
                            background: '#ec4899', color: 'white', fontWeight: 950, cursor: 'pointer',
                            fontSize: '0.9rem', letterSpacing: '0.02em', boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)'
                        }}
                    >
                        Änderungen speichern
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
