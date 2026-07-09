'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// MapView wird explizit NUR auf dem Client geladen (wegen Mapbox-GL Turbopack Bug)
const MapView = dynamic(() => import('./MapView'), { 
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa' }}>
      <div style={{ textAlign: 'center', animation: 'pulse 2s infinite' }}>
        <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: '#8b5cf6' }} />
        <h2 style={{ color: 'white', marginBottom: 8, fontSize: '1.2rem', fontWeight: 600 }}>Karte wird geladen...</h2>
      </div>
    </div>
  )
})

export default function MapLoader({ clubs, bars, events }: { clubs: any[], bars: any[], events: any[] }) {
  return <MapView clubs={clubs} bars={bars} events={events} />
}
