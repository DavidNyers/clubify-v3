'use client'
import { useState, useEffect } from 'react'
import { MapPin, Flame, Building2, Heart } from 'lucide-react'
import Link from 'next/link'

const CITIES = [
  { name: 'Wien',     lat: 48.2082, lon: 16.3738 },
  { name: 'Berlin',   lat: 52.52,   lon: 13.405  },
  { name: 'München',  lat: 48.1351, lon: 11.582  },
  { name: 'Graz',     lat: 47.0707, lon: 15.4395 },
  { name: 'Salzburg', lat: 47.8095, lon: 13.055  },
  { name: 'Linz',     lat: 48.3069, lon: 14.2858 },
]

function nearestCity(lat: number, lon: number): string {
  return CITIES.reduce((best, c) => {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2
    const bd = (best.lat - lat) ** 2 + (best.lon - lon) ** 2
    return d < bd ? c : best
  }).name
}

interface HeroFomoStatsProps {
  initialCity: string
  initialEventCount: number
  initialVenueCount: number
  isLoggedIn: boolean
  favCount: number
  favEventCount: number
  nextEventLabel: string
  nextEventSlug?: string
}

export default function HeroFomoStats({
  initialCity,
  initialEventCount,
  initialVenueCount,
  isLoggedIn,
  favCount,
  favEventCount,
  nextEventLabel,
  nextEventSlug,
}: HeroFomoStatsProps) {
  const [city, setCity] = useState(initialCity)
  const [eventCount, setEventCount] = useState(initialEventCount)
  const [venueCount, setVenueCount] = useState(initialVenueCount)

  useEffect(() => {
    if (isLoggedIn) return

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const nearest = nearestCity(pos.coords.latitude, pos.coords.longitude)
          setCity(nearest)
          try {
            const res = await fetch(`/api/fomo?city=${encodeURIComponent(nearest)}`)
            const data = await res.json()
            if (data.eventCount != null) setEventCount(data.eventCount)
            if (data.venueCount != null) setVenueCount(data.venueCount)
          } catch { /* ignore */ }
        },
        () => { /* ignore */ }
      )
    }
  }, [isLoggedIn])

  // Renders 3 clean, styled mobile chips: showing next event instead of fav events count
  const renderMobileChips = () => {
    return (
      <div className="hero-fomo-mobile-chips">
        <Link href={`/map?q=${encodeURIComponent(city)}`} className="fomo-mobile-chip fomo-chip-location" style={{ textDecoration: 'none' }}>
          <MapPin size={11} />
          <span>{city}</span>
        </Link>
        <Link href={nextEventSlug ? `/events/${nextEventSlug}` : '/events'} className="fomo-mobile-chip fomo-chip-events" style={{ textDecoration: 'none' }}>
          <Flame size={11} />
          <span>{nextEventLabel || 'Keine Events'}</span>
        </Link>
        {isLoggedIn ? (
          <Link href="/profile?tab=favorites" className="fomo-mobile-chip fomo-chip-favorites" style={{ textDecoration: 'none' }}>
            <Heart size={11} />
            <span>{favCount} Favs</span>
          </Link>
        ) : (
          <Link href="/map" className="fomo-mobile-chip fomo-chip-venues" style={{ textDecoration: 'none' }}>
            <Building2 size={11} />
            <span>{venueCount} Locations</span>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      {/* MOBILE: Minimal inline chips row */}
      <div className="hero-fomo-mobile">
        {renderMobileChips()}
      </div>

      {/* DESKTOP: 3-column stats grid with Lucide icons */}
      <div className="hero-fomo-desktop">
        {isLoggedIn ? (
          <div className="hero-fomo-grid">
            <Link href={`/map?q=${encodeURIComponent(city)}`} className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={20} style={{ color: '#a78bfa' }} />
                {city}
              </div>
              <div className="hero-fomo-lbl">Deine Stadt</div>
            </Link>
            <Link href="/events" className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
                <Flame size={20} style={{ color: '#fbbf24' }} />
                {favEventCount > 0 ? `${favEventCount} Events` : 'Keine'}
              </div>
              <div className="hero-fomo-lbl">diese Woche bei deinen Favoriten</div>
            </Link>
            <Link href="/profile?tab=favorites" className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4b5fd' }}>
                <Heart size={20} style={{ color: '#c4b5fd' }} />
                {favCount} Favoriten
              </div>
              <div className="hero-fomo-lbl">gespeicherte Clubs &amp; Bars</div>
            </Link>
          </div>
        ) : (
          <div className="hero-fomo-grid">
            <Link href={`/map?q=${encodeURIComponent(city)}`} className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={20} style={{ color: '#a78bfa' }} />
                {city}
              </div>
              <div className="hero-fomo-lbl">deine Stadt</div>
            </Link>
            <Link href="/events" className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
                <Flame size={20} style={{ color: '#fbbf24' }} />
                {eventCount > 0 ? eventCount : 'Bald neue'}
              </div>
              <div className="hero-fomo-lbl">Events diese Woche in deiner Nähe</div>
            </Link>
            <Link href="/map" className="hero-fomo-item-link">
              <div className="hero-fomo-val" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#67e8f9' }}>
                <Building2 size={20} style={{ color: '#67e8f9' }} />
                {venueCount} Locations
              </div>
              <div className="hero-fomo-lbl">in deiner Umgebung</div>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
