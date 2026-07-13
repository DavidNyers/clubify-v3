'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Navigation } from 'lucide-react'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800'

type Venue = {
  id: string
  name: string
  slug: string
  city: string
  address?: string
  lat?: number
  lng?: number
  price_range?: number
  avg_rating?: number
  featured?: boolean
  images?: string[]
  music_genres?: string[]
  status?: string
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface Props {
  venues: Venue[]
  type: 'clubs' | 'bars'
  tagKey?: 'music_genres'
  tagClass?: string
}

export default function VenueListClient({ venues, type, tagKey = 'music_genres', tagClass = 'clubs-tag' }: Props) {
  const [sorted, setSorted] = useState<(Venue & { distKm?: number })[]>(venues)
  const [locating, setLocating] = useState(false)
  const [located, setLocated] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const withDist = venues.map(v => ({
          ...v,
          distKm: v.lat && v.lng ? haversineKm(latitude, longitude, v.lat, v.lng) : Infinity
        }))

        // LOCAL = within 50km (Wien to Graz is ~170km, so this cleanly separates cities)
        // 1. Local featured
        // 2. Local non-featured  (both sorted by distance)
        // 3. Remote venues       (sorted by distance, at the very end)
        withDist.sort((a, b) => {
          const distA = a.distKm ?? 999
          const distB = b.distKm ?? 999
          const aLocal = distA < 50
          const bLocal = distB < 50

          // One is local, other is remote → local always wins
          if (aLocal && !bLocal) return -1
          if (!aLocal && bLocal) return 1

          // Both local → featured first, then by distance
          if (aLocal && bLocal) {
            if (a.featured && !b.featured) return -1
            if (!a.featured && b.featured) return 1
            return distA - distB
          }

          // Both remote → purely by distance
          return distA - distB
        })

        setSorted(withDist)
        setLocating(false)
        setLocated(true)
      },
      () => setLocating(false)
    )
  }, [])

  return (
    <>
      {/* Location status indicator */}
      {(locating || located) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.8rem', color: located ? '#10b981' : '#71717a',
          marginBottom: 16, fontWeight: 600
        }}>
          <Navigation size={14} style={{ flexShrink: 0 }} />
          {locating ? 'Standort wird ermittelt...' : 'Sortiert nach deinem Standort'}
        </div>
      )}

      <div className="listings-grid">
        {sorted.map((venue, idx) => {
          const coverImage = venue.images && venue.images.length > 0 ? venue.images[0] : FALLBACK_IMAGE
          const tags = tagKey === 'music_genres' ? venue.music_genres : []
          const hoverClass = type === 'clubs' ? 'hover-border-violet' : 'hover-border-blue'
          const isLocal = (venue.distKm ?? 999) < 50
          const prevIsLocal = idx > 0 ? (sorted[idx - 1].distKm ?? 999) < 50 : true
          // Show "Weitere Städte" divider at the boundary between local and remote
          const showDivider = located && !isLocal && prevIsLocal

          return (
            <div key={venue.id}>
              {showDivider && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  margin: '24px 0 16px', color: '#52525b', fontSize: '0.78rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  Weitere Städte
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
              <Link
                href={`/${type}/${venue.slug}`}
                className="listing-card-wrap"
                style={{ display: 'block', marginBottom: 0 }}
              >
              <div className={`listing-card hover-translate ${hoverClass}`}>

                {/* Image */}
                <div className="listing-card-img-wrap">
                  <Image src={coverImage} alt={venue.name} fill style={{ objectFit: 'cover' }} />
                  {venue.featured && (
                    <div className="listing-card-badge" style={{
                      background: type === 'clubs'
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                        : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      color: 'white',
                      boxShadow: type === 'clubs'
                        ? '0 4px 15px rgba(236,72,153,0.4)'
                        : '0 4px 15px rgba(59,130,246,0.4)'
                    }}>
                      FEATURED
                    </div>
                  )}
                  {/* Distance badge */}
                  {venue.distKm !== undefined && venue.distKm < 999 && (
                    <div style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                      borderRadius: 8, padding: '3px 8px',
                      fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Navigation size={10} />
                      {venue.distKm < 1
                        ? `${Math.round(venue.distKm * 1000)}m`
                        : `${venue.distKm.toFixed(1)} km`}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="listing-card-content">
                  <div className="listing-card-title-row">
                    <h3 className="listing-card-title">{venue.name}</h3>
                    {(venue.avg_rating ?? 0) > 0 && (
                      <div className="listing-card-rating">
                        <Star size={10} fill="#f59e0b" style={{ display: 'inline', marginTop: -2 }} />
                        {' '}{venue.avg_rating}
                      </div>
                    )}
                  </div>

                  <div className="listing-card-info-row">
                    <MapPin size={12} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.city}</span>
                    {venue.price_range && <span style={{ color: '#52525b', margin: '0 2px' }}>•</span>}
                    {venue.price_range && <span style={{ color: '#10b981', fontWeight: 800 }}>{'€'.repeat(venue.price_range)}</span>}
                  </div>

                  {tags && tags.length > 0 && (
                    <div className="listing-card-tags">
                      {tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className={`listing-card-tag ${tagClass}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
