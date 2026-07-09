'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomDatePickerProps {
  label: string
  value: string // ISO Date YYYY-MM-DD
  onChange: (value: string) => void
}

export default function CustomDatePicker({ label, value, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Shift to Monday start (0=Mon, 6=Sun)
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const startOffset = firstDayOfMonth(year, month)

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day + 1) // +1 because logic is 0-indexed internally but 1-based for days
    onChange(selected.toISOString().split('T')[0])
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 54,
          padding: '0 18px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid #3f3f46',
          borderRadius: 16,
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s',
          borderColor: isOpen ? '#8b5cf6' : '#3f3f46',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {value ? new Date(value).toLocaleDateString('de-AT') : 'TT.MM.JJJJ'}
        </span>
        <CalendarIcon size={18} style={{ color: isOpen ? '#8b5cf6' : '#71717a' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          minWidth: '280px',
          background: '#09090b',
          border: '1px solid #27272a',
          borderRadius: 20,
          zIndex: 100,
          padding: '20px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          userSelect: 'none'
        }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 4 }}><ChevronLeft size={20} /></button>
            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>{monthNames[month]} {year}</div>
            <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 4 }}><ChevronRight size={20} /></button>
          </div>

          {/* Weekdays */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {weekDays.map(wd => (
              <div key={wd} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase' }}>{wd}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Start Offsets */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} />
            ))}
            
            {/* Days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const dayDate = new Date(year, month, day + 1).toISOString().split('T')[0]
              const isSelected = dayDate === value
              const isToday = new Date().toISOString().split('T')[0] === dayDate

              return (
                <div 
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 800 : 500,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    background: isSelected ? '#8b5cf6' : 'transparent',
                    color: isSelected ? 'white' : (isToday ? '#8b5cf6' : '#a1a1aa'),
                    border: isToday && !isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                  className="hover-bg-zinc-800"
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Year Fast Select Quick Logic */}
          <div style={{ borderTop: '1px solid #27272a', marginTop: 16, paddingTop: 12, display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
             {[year - 1, year, year + 1].map(y => (
               <button 
                key={y} 
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewDate(new Date(y, month, 1)) }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  background: y === year ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  color: y === year ? '#8b5cf6' : '#52525b',
                  border: '1px solid #27272a',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
               >
                 {y}
               </button>
             ))}
          </div>
        </div>
      )}
    </div>
  )
}
