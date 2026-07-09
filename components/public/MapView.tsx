'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import { MapPin, Music2, Beer, Calendar, Star, Navigation, Menu, X, Search, Filter, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MapViewProps {
  clubs: any[]
  bars: any[]
  events: any[]
}

export default function MapView({ clubs, bars, events }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({})

  const [viewState, setViewState] = useState({
    latitude: 48.2082, // Vienna default
    longitude: 16.3738,
    zoom: 12
  })
  
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null)
  const [filter, setFilter] = useState<'all' | 'clubs' | 'bars' | 'events'>('all')
  const [showOpenNow, setShowOpenNow] = useState(false)
  const [showHappyHour, setShowHappyHour] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)

  // Robust responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024) // Higher threshold for more complex desktop bar
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const processedList = useMemo(() => {
    let list: any[] = []
    
    const CLUBS_FALLBACK = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=600'
    const BARS_FALLBACK = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600'
    const EVENTS_FALLBACK = 'https://images.unsplash.com/photo-1540039155732-d68f2c5cb13b?auto=format&fit=crop&q=80&w=600'

    if (filter === 'all' || filter === 'clubs') {
      clubs.forEach(c => {
        if (c.lat && c.lng) list.push({ ...c, type: 'club', color: '#8b5cf6', icon: Music2, image: (c.images && c.images.length > 0) ? c.images[0] : CLUBS_FALLBACK })
      })
    }
    
    if (filter === 'all' || filter === 'bars') {
      bars.forEach(b => {
        if (b.lat && b.lng) list.push({ ...b, type: 'bar', color: '#ec4899', icon: Beer, image: (b.images && b.images.length > 0) ? b.images[0] : BARS_FALLBACK })
      })
    }
    
    if (filter === 'all' || filter === 'events') {
      events.forEach(e => {
        if (e.clubs?.lat && e.clubs?.lng) {
          list.push({ 
            ...e, 
            lat: e.clubs.lat, 
            lng: e.clubs.lng, 
            type: 'event', 
            color: '#f59e0b', 
            icon: Calendar, 
            address: e.clubs.address,
            image: (e.images && e.images.length > 0) ? e.images[0] : EVENTS_FALLBACK
          })
        }
      })
    }
    
    if (showOpenNow) {
      list = list.filter(item => item.featured || item.type === 'bar') 
    }

    if (showHappyHour) {
      list = list.filter(item => item.type === 'bar' && item.price_range <= 3)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.music_genres && item.music_genres.some((g: string) => g.toLowerCase().includes(q)))
      )
    }

    // Circular Offset (Spiderfier) for overlapping venues
    const coordGroups: { [key: string]: any[] } = {}
    list.forEach(item => {
      const key = `${item.lat.toFixed(6)},${item.lng.toFixed(6)}`
      if (!coordGroups[key]) coordGroups[key] = []
      coordGroups[key].push(item)
    })

    const result: any[] = []
    Object.values(coordGroups).forEach(group => {
      if (group.length === 1) {
        result.push(group[0])
      } else {
        group.forEach((item, index) => {
          // Add a tiny spiral offset (approx 5-10 meters)
          const angle = (index / group.length) * Math.PI * 2
          const radius = 0.00012 // Distort just enough to see separate pins at high zoom
          result.push({
            ...item,
            lat: item.lat + (Math.cos(angle) * radius),
            lng: item.lng + (Math.sin(angle) * radius)
          })
        })
      }
    })

    return result
  }, [clubs, bars, events, filter, showOpenNow, showHappyHour, searchQuery])

  const ICON_PATHS = {
    club: '<path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
    bar: '<path d="M17 11V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a4 4 0 0 0 4 4h7a4 4 0 0 0 4-4v-2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 6h3a1 1 0 0 1 1 1.1c-.2 2.8-.3 3.5-.7 4.9a1 1 0 0 1-1.3.1h-2" fill="none" stroke="currentColor" stroke-width="2"/>',
    event: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  }

  // Sync markers with clustered source features
  const refreshMarkers = (map: maplibregl.Map) => {
    if (!map) return

    const renderedFeatures = map.queryRenderedFeatures({ layers: ['venues-clusters-hidden'] })
    const newMarkers: { [key: string]: maplibregl.Marker } = {}

    renderedFeatures.forEach(feature => {
      const coords = (feature.geometry as any).coordinates
      const props = feature.properties
      const isCluster = props.cluster
      
      const markerId = isCluster ? `cluster-${props.cluster_id}` : `${props.type}-${props.id}`
      let marker = markersRef.current[markerId]

      if (marker) {
        newMarkers[markerId] = marker
        marker.setLngLat(coords)
        // Ensure pointer events are correct even for reused markers
        marker.getElement().style.pointerEvents = isCluster ? 'none' : 'auto'
      } else {
        const el = document.createElement('div')
        el.style.cursor = 'pointer'
        el.style.pointerEvents = isCluster ? 'none' : 'auto'

        if (isCluster) {
          const count = props.point_count
          const hasClubs = props.has_clubs
          const hasBars = props.has_bars
          const hasEvents = props.has_events
          
          el.style.width = '42px'
          el.style.height = '42px'
          el.style.pointerEvents = 'none' 
          
          // Hybrid colors logic
          const activeColors: string[] = []
          if (hasClubs) activeColors.push('#8b5cf6')
          if (hasBars) activeColors.push('#ec4899')
          if (hasEvents) activeColors.push('#f59e0b')

          let borderStyle = ''
          if (activeColors.length > 1) {
            const gradient = `linear-gradient(135deg, ${activeColors.join(', ')})`
            borderStyle = `border: 3px solid transparent; background: linear-gradient(#1f2937, #1f2937) padding-box, ${gradient} border-box;`
          } else {
            const color = activeColors[0] || '#8b5cf6'
            borderStyle = `border: 2px solid ${color}; background: #1f2937;`
          }

          el.innerHTML = `
            <div style="width: 100%; height: 100%; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-size: 0.85rem; ${borderStyle}">
              ${count}
            </div>
          `
        } else {
          el.style.width = '44px'
          el.style.height = '52px'
          el.style.display = 'flex'
          el.style.flexDirection = 'column'
          el.style.alignItems = 'center'
          
          const color = props.color || '#8b5cf6'
          const iconType = props.type as keyof typeof ICON_PATHS
          
          el.innerHTML = `
            <div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white;">
              <svg viewBox="0 0 24 24" width="18" height="18">${ICON_PATHS[iconType] || ''}</svg>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; margin-top: -3px;"></div>
          `
          el.onclick = (e) => {
            e.stopPropagation()
            const item = processedList.find(v => v.id === props.id && v.type === props.type)
            if (item) setSelectedVenue(item)
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
    Object.assign(markersRef.current, newMarkers)
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,

      fadeDuration: 0
    })

    map.on('load', () => {
      map.addSource('venues', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
        clusterProperties: {
          has_clubs: ['any', ['==', ['get', 'type'], 'club']],
          has_bars: ['any', ['==', ['get', 'type'], 'bar']],
          has_events: ['any', ['==', ['get', 'type'], 'event']]
        }
      })

      map.addLayer({
        id: 'venues-clusters-hidden',
        type: 'circle',
        source: 'venues',
        paint: { 'circle-opacity': 0.01, 'circle-radius': 30 }
      })

      // Events
      map.on('move', () => refreshMarkers(map))
      map.on('moveend', () => refreshMarkers(map))
      map.on('sourcedata', (e) => {
        if (e.sourceId === 'venues') refreshMarkers(map)
      })

      // NEW: Robust Cluster Click Handler
      map.on('click', 'venues-clusters-hidden', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['venues-clusters-hidden'] })
        if (!features.length) return

        const feature = features[0]
        const clusterId = feature.properties.cluster_id
        const source = map.getSource('venues') as maplibregl.GeoJSONSource
        
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({
            center: (feature.geometry as any).coordinates,
            zoom: (zoom || map.getZoom() + 1.5),
            duration: 600
          })
        }).catch(() => {
          map.easeTo({ center: (feature.geometry as any).coordinates, zoom: map.getZoom() + 1.5, duration: 600 })
        })
      })

      // Change cursor on hover
      map.on('mouseenter', 'venues-clusters-hidden', () => map.getCanvas().style.cursor = 'pointer')
      map.on('mouseleave', 'venues-clusters-hidden', () => map.getCanvas().style.cursor = '')

      setMapLoaded(true)
    })

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'bottom-right')
    map.addControl(new maplibregl.FullscreenControl(), 'bottom-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync Source Data when filtered list changes
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const source = mapRef.current.getSource('venues') as maplibregl.GeoJSONSource
      if (source) {
        const features = processedList.map(v => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(v.lng), Number(v.lat)] },
          properties: { 
            id: v.id,
            type: v.type,
            name: v.name,
            color: v.color,
            image: v.image
          }
        }))
        source.setData({ type: 'FeatureCollection', features: features as any })
        // Safety refresh: wait a bit for MapLibre's rendering engine to digest the new data
        setTimeout(() => mapRef.current && refreshMarkers(mapRef.current), 150)
        setTimeout(() => mapRef.current && refreshMarkers(mapRef.current), 400)
      }
    }
  }, [processedList, mapLoaded])


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Selected Venue Info */}
      <AnimatePresence>
        {selectedVenue && (
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 100, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
            borderRadius: 24, padding: 0, width: 320, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', color: '#09090b',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* Header Image */}
            <div style={{ position: 'relative', width: '100%', height: 160 }}>
              <img 
                src={selectedVenue.image} 
                alt={selectedVenue.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ 
                position: 'absolute', inset: 0, 
                background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 40%)' 
              }} />
              <button 
                onClick={() => setSelectedVenue(null)} 
                style={{ 
                  position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', 
                  border: 'none', color: 'white', cursor: 'pointer',
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 10 }}>
                 <span style={{ 
                  background: `${selectedVenue.color}20`, color: selectedVenue.color,
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {selectedVenue.type}
                </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 6, letterSpacing: '-0.02em' }}>{selectedVenue.name}</h3>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52525b', fontSize: '0.9rem', marginBottom: 20 }}>
              <MapPin size={16} /> {selectedVenue.address || selectedVenue.city}
            </p>
            <Link 
              href={`/${selectedVenue.type}s/${selectedVenue.slug}`}
              style={{
                display: 'block', textAlign: 'center', padding: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white',
                borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem',
                boxShadow: `0 4px 15px ${selectedVenue.color}40`
              }}
            >
              Details ansehen
            </Link>
          </div>
        </div>
      )}
      </AnimatePresence>

      {/* Responsive Filter Bar (Desktop ONLY) */}
      {!isMobile && (
        <div style={{ 
          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          display: 'flex', alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          background: 'rgba(9, 9, 11, 0.85)', backdropFilter: 'blur(20px)', 
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', height: 60, padding: '0 10px'
        }}>
          {/* Search Section */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <Search style={{ position: 'absolute', left: 16, color: '#71717a' }} size={18} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Venues suchen..."
              style={{
                background: 'transparent', border: 'none', padding: '0 10px 0 44px',
                color: 'white', outline: 'none', fontSize: '0.9rem', width: 220, fontWeight: 500,
                height: 40
              }}
            />
          </div>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {/* Category Dropdown Area */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              style={{
                background: 'transparent', border: 'none', color: 'white', padding: '0 20px',
                height: 48, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: 700, borderRadius: 12, transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <motion.div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, color: '#8b5cf6' }}
                animate={{ rotate: isFilterMenuOpen ? 180 : 0 }}
              >
                {filter === 'clubs' ? <Music2 size={18} /> : filter === 'bars' ? <Beer size={18} /> : filter === 'events' ? <Calendar size={18} /> : <ChevronDown size={20} />}
              </motion.div>
              {filter === 'all' ? 'Alle' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 5, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, width: 200,
                    background: '#18181b', borderRadius: 16, padding: 8,
                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 101, marginTop: 8
                  }}
                >
                  {[
                    { id: 'all', label: 'Alle', icon: Filter },
                    { id: 'clubs', label: 'Clubs', icon: Music2 },
                    { id: 'bars', label: 'Bars', icon: Beer },
                    { id: 'events', label: 'Events', icon: Calendar }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setFilter(f.id as any); setIsFilterMenuOpen(false); }}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                        textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        background: filter === f.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                        color: filter === f.id ? '#8b5cf6' : '#a1a1aa',
                        fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
                      }}
                    >
                      <f.icon size={16} />
                      {f.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: 8, padding: '0 8px' }}>
             <button
              onClick={() => setShowOpenNow(!showOpenNow)}
              style={{
                height: 44, padding: '0 16px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                background: showOpenNow ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: showOpenNow ? '#22c55e' : '#71717a',
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: showOpenNow ? '#22c55e' : '#3f3f46',
                boxShadow: showOpenNow ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
              }} />
              Geöffnet
            </button>
 
            <button
              onClick={() => setShowHappyHour(!showHappyHour)}
              style={{
                height: 44, padding: '0 16px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                background: showHappyHour ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                color: showHappyHour ? '#eab308' : '#71717a',
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <Beer size={16} />
              Happy Hour
            </button>

          </div>
        </div>
      )}

      {/* Floating Menu Button (Mobile ONLY) */}
      {isMobile && (
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            style={{
              width: 48, height: 48, borderRadius: 14, background: 'rgba(24, 24, 27, 0.8)',
              backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Mobile Drawer (Existing) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: 320,
                background: '#09090b', zIndex: 1001, padding: 24, borderRight: '1px solid #18181b',
                boxShadow: '20px 0 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Filter</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={24} /></button>
              </div>

               <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: 12 }}>Suche</label>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 14, top: 14, color: '#71717a' }} size={18} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suchen..."
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 16,
                      padding: '14px 14px 14px 44px', color: 'white', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { id: 'all', label: 'Alle' },
                    { id: 'clubs', label: 'Clubs' },
                    { id: 'bars', label: 'Bars' },
                    { id: 'events', label: 'Events' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      style={{
                        padding: '12px', borderRadius: 12, border: '1px solid',
                        borderColor: filter === f.id ? '#8b5cf6' : '#27272a',
                        background: filter === f.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                        color: filter === f.id ? 'white' : '#71717a',
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
              </div>

              <div style={{ marginTop: 'auto' }}>
                 <button onClick={() => setIsDrawerOpen(false)} style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', border: 'none', fontWeight: 800 }}>
                   Ergebnisse anzeigen
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
