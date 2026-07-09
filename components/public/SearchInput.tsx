'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Search, ChevronDown, X, Calendar, SlidersHorizontal, Percent } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchInputProps {
  placeholder: string
  type?: 'clubs' | 'bars' | 'events'
}

const GENRES_BY_TYPE = {
  clubs: ['Techno', 'House', 'Minimal', 'Industrial', '80s', 'Retrowave', 'Hip-Hop', 'Chart-Hits'],
  bars: ['Cocktails', 'Craft Beer', 'Wine', 'Gin', 'Whiskey', 'Non-Alc', 'Aperitivo', 'Dive Bar'],
  events: ['Techno', 'House', 'Hardcore', 'Deep House', 'Melodic Techno', 'Mainstage', 'R&B']
}

export default function SearchInput({ placeholder, type = 'clubs' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const currentPrice = searchParams.get('price')
  const currentGenre = searchParams.get('genre')
  const isOpenToday = searchParams.get('openToday') === 'true'
  const isHappyHour = searchParams.get('happyHour') === 'true'

  const updateParams = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    updateParams({ q: value || null })
  }

  const togglePrice = (price: string) => {
    updateParams({ price: currentPrice === price ? null : price })
  }

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ genre: e.target.value || null })
  }

  const toggleGenre = (genre: string) => {
    updateParams({ genre: currentGenre === genre ? null : genre })
  }

  const toggleOpenToday = () => {
    updateParams({ openToday: isOpenToday ? null : 'true' })
  }

  const toggleHappyHour = () => {
    updateParams({ happyHour: isHappyHour ? null : 'true' })
  }

  const clearFilters = () => {
    setQuery('')
    router.replace(pathname, { scroll: false })
    setIsDrawerOpen(false)
  }

  const hasActiveFilters = query || currentPrice || currentGenre || isOpenToday || isHappyHour
  const filterCount = (currentPrice ? 1 : 0) + (currentGenre ? 1 : 0) + (isOpenToday ? 1 : 0) + (isHappyHour ? 1 : 0)

  return (
    <div style={{ marginBottom: 48 }}>
      {/* Unified Search Header Bar */}
      <div style={{ 
        display: 'flex', alignItems: 'center', background: '#18181b', border: '1px solid #27272a', 
        borderRadius: 24, padding: '8px 24px 8px 20px', gap: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        minHeight: 64
      }} className="focus-within-border-violet search-container">
        
        {/* Search Input Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <Search style={{ color: '#71717a' }} size={18} />
          <input 
            type="text" 
            value={query}
            onChange={handleSearchChange}
            placeholder={placeholder} 
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '1rem' }}
          />
        </div>

        {/* Mobile Filter Trigger */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="mobile-filter-btn"
          style={{
            padding: '12px 18px', borderRadius: 16, border: 'none', background: hasActiveFilters ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
            color: hasActiveFilters ? '#8b5cf6' : 'white', cursor: 'pointer', display: 'none', alignItems: 'center', gap: 8
          }}
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilters && <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{filterCount}</span>}
        </button>

        {/* Desktop Filter Collection Area */}
        <div className="desktop-filters" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 1, height: 32, background: '#27272a', margin: '0 4px' }} />
          
          {/* Genre Dropdown */}
          <div style={{ position: 'relative' }}>
            <select 
              value={currentGenre || ''} 
              onChange={handleGenreChange}
              style={{
                padding: '10px 28px 10px 14px', borderRadius: 14, background: currentGenre ? 'rgba(139, 92, 246, 0.1)' : 'transparent', 
                border: 'none', color: currentGenre ? 'white' : '#a1a1aa', fontSize: '0.85rem', fontWeight: 700,
                outline: 'none', cursor: 'pointer', appearance: 'none', transition: 'all 0.2s'
              }}
            >
              <option value="">Alle Genres</option>
              {GENRES_BY_TYPE[type].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none' }} />
          </div>

          <div style={{ width: 1, height: 24, background: '#27272a' }} />

          {/* Pricing Selector (Reverted and Compact) */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 2, borderRadius: 12 }}>
            {['1', '2', '3', '4'].map(p => (
              <button
                key={p}
                onClick={() => togglePrice(p)}
                style={{
                  width: 38, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: currentPrice === p ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                  color: currentPrice === p ? 'white' : '#71717a',
                  fontSize: '0.75rem', fontWeight: 800, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {'€'.repeat(parseInt(p))}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: '#27272a' }} />

          {/* Today Toggle */}
          <button
            onClick={toggleOpenToday}
            style={{
              padding: '0 14px', borderRadius: 14, border: 'none', 
              background: isOpenToday ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              color: isOpenToday ? '#8b5cf6' : '#a1a1aa',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', height: 42
            }}
          >
            <Calendar size={16} />
            Heute
          </button>

          {/* % (Happy Hour) Toggle */}
          {type === 'bars' && (
            <button
              onClick={toggleHappyHour}
              style={{
                width: 42, height: 42, borderRadius: 14, border: 'none', 
                background: isHappyHour ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isHappyHour ? '#10b981' : '#a1a1aa',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                transition: 'all 0.2s'
              }}
              title="Happy Hour"
            >
              <Percent size={18} strokeWidth={3} />
            </button>
          )}

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ 
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '85%', maxWidth: 400, 
                background: '#09090b', borderLeft: '1px solid #27272a', zIndex: 101, padding: '32px 24px',
                display: 'flex', flexDirection: 'column', gap: 32
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Filter</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: '#18181b', border: 'none', padding: 8, borderRadius: 12, color: 'white' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Price Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Preisklasse</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                   {['1', '2', '3', '4'].map(p => (
                    <button
                      key={p}
                      onClick={() => togglePrice(p)}
                      style={{
                        height: 54, borderRadius: 16, border: '1px solid',
                        borderColor: currentPrice === p ? '#8b5cf6' : '#27272a',
                        background: currentPrice === p ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '#18181b',
                        color: currentPrice === p ? 'white' : '#a1a1aa',
                        fontSize: '0.9rem', fontWeight: 800, transition: 'all 0.2s'
                      }}
                    >
                      {'€'.repeat(parseInt(p))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Kategorie / Genre</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
                   {GENRES_BY_TYPE[type].map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      style={{
                        padding: '14px 8px', borderRadius: 16, border: '1px solid',
                        borderColor: currentGenre === g ? '#8b5cf6' : '#27272a',
                        background: currentGenre === g ? 'rgba(139, 92, 246, 0.1)' : '#18181b',
                        color: currentGenre === g ? 'white' : '#a1a1aa',
                        fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>Optionen</label>
                
                <button onClick={toggleOpenToday} style={{ width: '100%', height: 60, borderRadius: 18, border: '1px solid', borderColor: isOpenToday ? '#8b5cf6' : '#27272a', background: isOpenToday ? 'rgba(139, 92, 246, 0.1)' : '#18181b', color: 'white', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Calendar size={20} />
                    <span>Heute</span>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: isOpenToday ? '#8b5cf6' : '#3f3f46' }} />
                </button>

                {type === 'bars' && (
                  <button onClick={toggleHappyHour} style={{ width: '100%', height: 60, borderRadius: 18, border: '1px solid', borderColor: isHappyHour ? '#10b981' : '#27272a', background: isHappyHour ? 'rgba(16, 185, 129, 0.1)' : '#18181b', color: 'white', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Percent size={20} />
                      <span>Happy Hour</span>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: isHappyHour ? '#10b981' : '#3f3f46' }} />
                  </button>
                )}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                <button onClick={() => setIsDrawerOpen(false)} style={{ flex: 1, padding: '20px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', fontWeight: 800, fontSize: '1rem' }}>Anwenden</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .unified-search-bar:focus-within {
          border-color: #8b5cf6 !important;
        }
        @media (max-width: 900px) {
          .desktop-filters { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .search-container { padding: 8px 8px 8px 16px !important; }
        }
      `}} />
    </div>
  )
}
