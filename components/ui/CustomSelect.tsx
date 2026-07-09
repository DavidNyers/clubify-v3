'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function CustomSelect({ label, options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

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
          boxShadow: isOpen ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : 'none',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedOption?.label}</span>
        <ChevronDown size={18} style={{ color: '#71717a', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: 16,
          zIndex: 100,
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(12px)'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              style={{
                padding: '12px 18px',
                fontSize: '0.9rem',
                color: opt.value === value ? '#8b5cf6' : '#a1a1aa',
                background: opt.value === value ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                cursor: 'pointer',
                fontWeight: opt.value === value ? 700 : 500,
                transition: 'all 0.15s'
              }}
              className="hover-bg-zinc-800"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
