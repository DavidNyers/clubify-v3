'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Loader2 } from 'lucide-react'

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

type State = 'idle' | 'locating' | 'ready' | 'denied'

interface GeoFomoProps {
  weekEventCount: number
  upcomingEvents: any[]
}

export default function GeoFomo({ weekEventCount, upcomingEvents }: GeoFomoProps) {
  const [state, setState] = useState<State>('idle')
  const [city, setCity] = useState<string | null>(null)
  const [cityData, setCityData] = useState<{ eventCount: number; venueCount: number } | null>(null)

  const locate = () => {
    if (!navigator.geolocation) { setState('denied'); return }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude)
        setCity(c)
        try {
          const res = await fetch(`/api/fomo?city=${encodeURIComponent(c)}`)
          setCityData(await res.json())
        } catch { /* ignore */ }
        setState('ready')
      },
      () => setState('denied'),
      { timeout: 8000 }
    )
  }

  const displayEventCount = (state === 'ready' && cityData?.eventCount != null)
    ? cityData.eventCount
    : weekEventCount

  return (
    <section className="fomo-section">
      <div className="container">
        <div className="fomo-inner">

          {/* Left: FOMO chips */}
          <div className="fomo-left">
            <p className="fomo-greeting">
              {state === 'ready' && city
                ? <><MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', color: '#a78bfa', marginRight: 4 }} />{city}</>
                : 'Was läuft diese Woche? 🔥'
              }
            </p>

            <div className="fomo-chips">
              <div className="fomo-chip fomo-chip-fire">
                <span>🔥</span>
                <span>
                  {displayEventCount > 0
                    ? `${displayEventCount} Events diese Woche${state === 'ready' && city ? ` in ${city}` : ''}`
                    : 'Bald neue Events'}
                </span>
              </div>

              {state === 'idle' && (
                <button onClick={locate} className="fomo-chip fomo-chip-location">
                  <MapPin size={13} />
                  <span>Events in meiner Nähe</span>
                </button>
              )}

              {state === 'locating' && (
                <div className="fomo-chip fomo-chip-location" style={{ opacity: 0.6 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Wird ermittelt…</span>
                </div>
              )}

              {state === 'ready' && cityData && cityData.venueCount > 0 && (
                <div className="fomo-chip fomo-chip-heart">
                  <span>🏛️</span>
                  <span>{cityData.venueCount} Venues in {city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: event previews + register CTA */}
          <div className="fomo-events">
            {upcomingEvents.slice(0, 2).map(ev => {
              const d = new Date(ev.date)
              return (
                <Link key={ev.id} href={`/events/${ev.slug}`} className="fomo-event-pill">
                  <div className="fomo-event-date">
                    <span>{d.getDate()}</span>
                    <span>{d.toLocaleDateString('de-DE', { month: 'short' })}</span>
                  </div>
                  <div className="fomo-event-info">
                    <span className="fomo-event-name">{ev.name}</span>
                    <span className="fomo-event-price">
                      {ev.ticket_price > 0 ? `${ev.ticket_price}${ev.currency || '€'}` : 'Free Entry'}
                    </span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                </Link>
              )
            })}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <Link href="/events" className="fomo-see-all">
                Alle Events <ArrowRight size={13} />
              </Link>
              <Link href="/auth/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.22)',
                color: '#c4b5fd', fontSize: '0.76rem', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}>
                Personalisieren →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
