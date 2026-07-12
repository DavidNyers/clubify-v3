'use client'
import { useState, useEffect } from 'react'

export default function HeroCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)

  const fallback = [
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
  ]
  const allImages = images.length > 0 ? images : fallback

  useEffect(() => {
    if (allImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % allImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [allImages.length])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 500,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {allImages.map((img, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          <img
            src={img}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, transparent 50%), linear-gradient(to top, rgba(9,9,11,0.7) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Dots */}
      {allImages.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, zIndex: 2,
        }}>
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === current ? '#8b5cf6' : 'rgba(255,255,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
