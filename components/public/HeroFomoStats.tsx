'use client'
import { useState, useEffect } from 'react'

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
}

export default function HeroFomoStats({
  initialCity,
  initialEventCount,
  initialVenueCount,
  isLoggedIn,
  favCount,
  favEventCount,
}: HeroFomoStatsProps) {
  const [city, setCity] = useState(initialCity)
  const [eventCount, setEventCount] = useState(initialEventCount)
  const [venueCount, setVenueCount] = useState(initialVenueCount)

  useEffect(() => {
    // Only run geolocation for guest users
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

  if (isLoggedIn) {
    return (
      <div className="hero-fomo-grid">
        <div className="hero-fomo-item">
          <div className="hero-fomo-val">{city} 📍</div>
          <div className="hero-fomo-lbl">Deine Stadt</div>
        </div>
        <div className="hero-fomo-item">
          <div className="hero-fomo-val" style={{ color: '#fbbf24' }}>
            {favEventCount > 0 ? `${favEventCount} Events 🔥` : 'Keine Events'}
          </div>
          <div className="hero-fomo-lbl">diese Woche bei deinen Favoriten</div>
        </div>
        <div className="hero-fomo-item">
          <div className="hero-fomo-val" style={{ color: '#c4b5fd' }}>
            {favCount} Favoriten 💜
          </div>
          <div className="hero-fomo-lbl">gespeicherte Clubs &amp; Bars</div>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-fomo-grid">
      <div className="hero-fomo-item">
        <div className="hero-fomo-val">{city} 📍</div>
        <div className="hero-fomo-lbl">deine Stadt</div>
      </div>
      <div className="hero-fomo-item">
        <div className="hero-fomo-val" style={{ color: '#fbbf24' }}>
          {eventCount > 0 ? `${eventCount} Events 🔥` : 'Bald neue Events'}
        </div>
        <div className="hero-fomo-lbl">diese Woche in deiner Nähe</div>
      </div>
      <div className="hero-fomo-item">
        <div className="hero-fomo-val" style={{ color: '#67e8f9' }}>
          {venueCount > 0 ? `${venueCount} Locations 🏛️` : 'Top Clubs &amp; Bars'}
        </div>
        <div className="hero-fomo-lbl">in deiner Umgebung</div>
      </div>
    </div>
  )
}
