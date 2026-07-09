'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { User as UserIcon, Clock, MapPin, Search, X, Shield, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserLocation {
  id: string
  full_name: string | null
  username: string | null
  role: string | null
  email: string
  avatar_url: string | null
  last_lat: number
  last_lng: number
  last_active_at: string
  last_location: string | null
}

interface UserLiveMapProps {
  initialUsers: UserLocation[]
  mapboxToken?: string // Backwards compatibility, but using MapLibre default tiles
}

export default function UserLiveMap({ initialUsers }: UserLiveMapProps) {
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
// ... (omitting intermediate state/logic that isn't changing except interfaces)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'offline'>('all')
  const [mapLoaded, setMapLoaded] = useState(false)

  const isLive = (timestamp: string | null) => {
    if (!timestamp) return false
    const lastActive = new Date(timestamp).getTime()
    const now = new Date().getTime()
    return (now - lastActive) < 15 * 60 * 1000 
  }

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      const matchesSearch = !searchTerm || 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const userIsLive = isLive(u.last_active_at)
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'live' && userIsLive) ||
        (statusFilter === 'offline' && !userIsLive)

      return matchesSearch && matchesStatus
    })
  }, [initialUsers, searchTerm, statusFilter])

  // Sync markers with clustered source features
  const refreshMarkers = (map: maplibregl.Map) => {
    if (!mapLoaded || !map) return

    // Query features from the invisible hidden layer
    const renderedFeatures = map.queryRenderedFeatures({ layers: ['user-clusters-hidden'] })
    const newMarkers: { [key: string]: maplibregl.Marker } = {}

    renderedFeatures.forEach(feature => {
      const coords = (feature.geometry as any).coordinates
      const props = feature.properties
      const isCluster = props.cluster
      
      // STABLE IDs: Important for splitting/merging
      // For users, use their DB id. For clusters, use their engine-provided id.
      const markerId = isCluster ? `cluster-${props.cluster_id}` : `user-${props.id}`

      if (markersRef.current[markerId]) {
        newMarkers[markerId] = markersRef.current[markerId]
        newMarkers[markerId].setLngLat(coords)
      } else {
        const el = document.createElement('div')
        el.style.cursor = 'pointer'
        el.style.pointerEvents = 'auto'

        if (isCluster) {
          const count = props.point_count
          el.style.width = '48px'
          el.style.height = '48px'
          let color = '#8b5cf6' 
          if (count > 5) color = '#f59e0b' 
          if (count > 20) color = '#ef4444' 

          el.innerHTML = `
            <div style="width: 100%; height: 100%; border-radius: 50%; background: ${color}; color: white; border: 3px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 15px rgba(0,0,0,0.5); user-select: none;">
              ${count}
            </div>
          `
          el.onclick = (e) => {
            e.stopPropagation()
            const source = map.getSource('users') as maplibregl.GeoJSONSource
            source.getClusterExpansionZoom(props.cluster_id).then((zoom) => {
              map.easeTo({ center: coords, zoom: (zoom || map.getZoom() + 1.5), duration: 600 })
            }).catch(() => {
              map.easeTo({ center: coords, zoom: map.getZoom() + 1.5, duration: 600 })
            })
          }
        } else {
          el.style.width = '44px'
          el.style.height = '44px'
          const live = props.is_live
          el.innerHTML = `
             <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${live ? '#22c55e' : '#71717a'}; overflow: hidden; background: #27272a; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
              ${props.avatar_url 
                ? `<img src="${props.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`
                : `<div style="color: white; font-weight: 800; font-size: 0.8rem;">${props.full_name?.[0] || props.email?.[0]?.toUpperCase() || 'U'}</div>`
              }
            </div>
            ${live ? '<div style="position: absolute; top: 0; right: 4px; width: 12px; height: 12px; background: #22c55e; border-radius: 50%; border: 2px solid #09090b;"></div>' : ''}
          `
          el.onclick = (e) => {
            e.stopPropagation()
            const user = initialUsers.find(u => u.id === props.id)
            if (user) setSelectedUser(user)
          }
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map)
        newMarkers[markerId] = marker
      }
    })

    // Remove obsolete
    Object.keys(markersRef.current).forEach(mid => {
      if (!newMarkers[mid]) {
        markersRef.current[mid].remove()
        delete markersRef.current[mid]
      }
    })
    
    // Safety sync: update markers ref
    Object.assign(markersRef.current, newMarkers)
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [16.3738, 48.2082], 
      zoom: 12,
      fadeDuration: 0
    })

    map.on('load', () => {
      map.addSource('users', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      })

      // MUST have a radius > 0 to be considered "rendered" for queryRenderedFeatures
      map.addLayer({
        id: 'user-clusters-hidden',
        type: 'circle',
        source: 'users',
        paint: { 
          'circle-opacity': 0, 
          'circle-stroke-opacity': 0,
          'circle-radius': 20 
        }
      })

      setMapLoaded(true)
      // Initial trigger to show users if data is already there
      setTimeout(() => refreshMarkers(map), 100)
    })

    // Marker Update Triggers
    map.on('move', () => refreshMarkers(map)) 
    map.on('moveend', () => refreshMarkers(map))
    map.on('sourcedata', (e) => {
      if (e.sourceId === 'users') {
        refreshMarkers(map)
      }
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])


  // Sync data whenever users or filters change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      console.log(`Updating map with ${filteredUsers.length} users (Filter: ${statusFilter})`)
      const source = mapRef.current.getSource('users') as maplibregl.GeoJSONSource
      if (source) {
        const features = filteredUsers.map(u => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(u.last_lng || 0), Number(u.last_lat || 0)] },
          properties: { 
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            avatar_url: u.avatar_url,
            last_active_at: u.last_active_at,
            is_live: isLive(u.last_active_at)
          }
        }))
        source.setData({ type: 'FeatureCollection', features: features as any })
        // Force immediate sync
        setTimeout(() => mapRef.current && refreshMarkers(mapRef.current), 200)
      }
    }
  }, [filteredUsers, mapLoaded])

  // Periodic safety sync (useful for live updates and engine delays)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const interval = setInterval(() => refreshMarkers(mapRef.current!), 3000)
    return () => clearInterval(interval)
  }, [mapLoaded])


  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'Gerade eben'
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`
    return new Date(timestamp).toLocaleDateString('de-DE')
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', background: '#09090b' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Info Panel Overlay */}
      {selectedUser && (
        <div style={{ 
          position: 'absolute', top: 20, right: 20, zIndex: 100,
          background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)',
          borderRadius: 24, padding: 24, width: 320, border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: 'white'
        }}>
          <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.4rem' }}>
                  {selectedUser.full_name?.[0] || 'U'}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedUser.full_name || 'Anonym'}
                {selectedUser.role === 'admin' && <Shield size={14} style={{ color: '#8b5cf6' }} />}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600, marginBottom: 2 }}>
                {selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}
              </div>
              <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {selectedUser.role || 'User'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <Clock size={16} style={{ color: isLive(selectedUser.last_active_at) ? '#22c55e' : '#71717a' }} /> 
              <span>Status:</span>
              <span style={{ fontWeight: 700, color: isLive(selectedUser.last_active_at) ? '#22c55e' : 'white' }}>
                {isLive(selectedUser.last_active_at) ? 'Online' : 'Zuletzt ' + formatTimeAgo(selectedUser.last_active_at)}
              </span>
            </div>
            
            {selectedUser.last_location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#71717a' }}>
                <MapPin size={16} />
                <span style={{ color: 'white', fontWeight: 500 }}>{selectedUser.last_location}</span>
              </div>
            )}

            <div style={{ display: 'flex', color: '#71717a', fontSize: '0.75rem', gap: 4, marginLeft: 24 }}>
              <span style={{ fontFamily: 'monospace' }}>{selectedUser.last_lat.toFixed(4)}, {selectedUser.last_lng.toFixed(4)}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button 
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', 
                  background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
                className="hover-bg-white-01"
                onClick={() => {
                  if(mapRef.current) {
                    mapRef.current.flyTo({ center: [Number(selectedUser.last_lng), Number(selectedUser.last_lat)], zoom: 15, duration: 2000 })
                  }
                }}
              >
                Fokus
              </button>
              <button 
                style={{ 
                  flex: 1.5, padding: '12px', borderRadius: 12, border: 'none', 
                  background: '#8b5cf6', color: 'white', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: '0.85rem'
                }}
                className="hover-scale"
                onClick={() => router.push(`/dashboard/admin/users/${selectedUser.id}`)}
              >
                <ExternalLink size={14} /> Verwalten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Overlays */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search & Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 12, color: '#71717a' }} size={16} />
            <input 
              type="text" 
              placeholder="User suchen..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ 
                padding: '10px 16px 10px 38px', background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', width: 220,
                outline: 'none', fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ 
            padding: '10px 16px', background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white',
            fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span>{filteredUsers.filter(u => isLive(u.last_active_at)).length} Live</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>
          {[
            { id: 'all', label: 'Alle' },
            { id: 'live', label: 'Online' },
            { id: 'offline', label: 'Offline' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                background: statusFilter === f.id ? 'white' : 'transparent',
                color: statusFilter === f.id ? '#09090b' : '#71717a'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!mapLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', zIndex: 1000, color: 'white' }}>
          Lade Live-Monitor...
        </div>
      )}
    </div>
  )
}



// Simple CSS for spin animation not needed if we use framer-motion or just simple JS
// but for the sake of completion:
const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>
