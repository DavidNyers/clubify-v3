'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export default function HeroSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/map?q=${encodeURIComponent(query.trim())}` : '/map')
  }

  return (
    <form
      onSubmit={handleSearch}
      className="hero-search-form"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 520,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: '6px 6px 6px 22px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => {
        const form = e.currentTarget
        form.style.borderColor = 'rgba(139,92,246,0.5)'
        form.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), 0 0 0 3px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
      onBlur={e => {
        const form = e.currentTarget
        form.style.borderColor = 'rgba(255,255,255,0.1)'
        form.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      <Search size={20} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Stadt, Club oder Event suchen…"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'white',
          fontSize: '0.97rem',
          padding: '11px 14px',
          fontFamily: 'Inter, sans-serif',
          minWidth: 0,
        }}
      />
      <button
        type="submit"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          border: 'none',
          borderRadius: 13,
          padding: '12px 20px',
          cursor: 'pointer',
          color: 'white',
          flexShrink: 0,
          transition: 'opacity 0.2s, transform 0.15s',
          fontWeight: 700,
          fontSize: '0.85rem',
          gap: 6,
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <ArrowRight size={18} />
      </button>
    </form>
  )
}
