'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Navigation, Users } from 'lucide-react'

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
  capacity?: number
  review_count?: number
  dress_code?: string
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

// City priority order for fallback (no geo) — capitals first
const CITY_ORDER: Record<string, number> = { 'Wien': 0, 'Graz': 1, 'Salzburg': 2 }

function sortVenues(withDist: (Venue & { distKm?: number })[]) {
  withDist.sort((a, b) => {
    const distA = a.distKm ?? 999
    const distB = b.distKm ?? 999
    const aLocal = distA < 50
    const bLocal = distB < 50
    if (aLocal && !bLocal) return -1
    if (!aLocal && bLocal) return 1
    if (aLocal && bLocal) {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return distA - distB
    }
    return distA - distB
  })
}

function fallbackSort(venues: Venue[]) {
  return [...venues].sort((a, b) => {
    const cityA = CITY_ORDER[a.city] ?? 99
    const cityB = CITY_ORDER[b.city] ?? 99
    if (cityA !== cityB) return cityA - cityB
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
  })
}

export default function VenueListClient({ venues, type, tagKey = 'music_genres', tagClass = 'clubs-tag' }: Props) {
  const [sorted, setSorted] = useState<(Venue & { distKm?: number })[]>(() => fallbackSort(venues))
  const [locating, setLocating] = useState(false)
  const [located, setLocated] = useState(false)

  useEffect(() => {
    // 1. Try cached location for instant sort
    try {
      const cached = localStorage.getItem('clubify-geo')
      if (cached) {
        const { lat, lng } = JSON.parse(cached)
        const withDist = venues.map(v => ({
          ...v,
          distKm: v.lat && v.lng ? haversineKm(lat, lng, v.lat, v.lng) : Infinity
        }))
        sortVenues(withDist)
        setSorted(withDist)
        setLocated(true)
      }
    } catch { /* ignore */ }

    // 2. Get fresh position (fast: 5s timeout, accept 10min old cache)
    if (!navigator.geolocation) return
    if (!located) setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try { localStorage.setItem('clubify-geo', JSON.stringify({ lat, lng })) } catch { /* ignore */ }
        const withDist = venues.map(v => ({
          ...v,
          distKm: v.lat && v.lng ? haversineKm(lat, lng, v.lat, v.lng) : Infinity
        }))
        sortVenues(withDist)
        setSorted(withDist)
        setLocating(false)
        setLocated(true)
      },
      () => setLocating(false),
      { maximumAge: 600_000, timeout: 5_000, enableHighAccuracy: false }
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
                        {' '}{Math.round(Number(venue.avg_rating) * 10) / 10}
                        {venue.review_count !== undefined && venue.review_count > 0 && (
                          <span style={{ opacity: 0.6, fontSize: '0.65rem', marginLeft: 2, fontWeight: 500 }}>
                            ({venue.review_count})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="listing-card-info-row">
                    <MapPin size={12} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.city}</span>
                    {venue.price_range && <span style={{ color: '#52525b', margin: '0 2px' }}>•</span>}
                    {venue.price_range && <span style={{ color: '#10b981', fontWeight: 800 }}>{'€'.repeat(venue.price_range)}</span>}
                  </div>

                  {/* Metadata Row: Capacity and Dresscode */}
                  {(venue.capacity || venue.dress_code) && (
                    <div className="listing-card-info-row" style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.72rem', marginTop: 1, gap: 8, display: 'flex', alignItems: 'center' }}>
                      {venue.capacity && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Users size={11} style={{ opacity: 0.7 }} /> {venue.capacity.toLocaleString('de-AT')} Plätze
                        </span>
                      )}
                      {venue.capacity && venue.dress_code && <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>}
                      {venue.dress_code && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          👔 {venue.dress_code}
                        </span>
                      )}
                    </div>
                  )}

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
