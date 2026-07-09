import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import VenueReservationForm from '@/components/public/VenueReservationForm'
import Navbar from '@/components/public/Navbar'
import { MapPin, Star, Phone, Clock } from 'lucide-react'
import { getVenueZones } from '@/lib/actions/venue/TableActions'

export default async function VenueReservePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch Venue (Try bars first, then clubs)
  const { data: bar } = await supabase.from('bars').select('*').eq('slug', slug).single()
  const { data: club } = !bar ? await supabase.from('clubs').select('*').eq('slug', slug).single() : { data: null }

  const venue = bar || club
  if (!venue) notFound()

  // 2. Fetch Zones
  const zones = await getVenueZones(venue.id)

  const venueType = bar ? 'bar' : 'club'
  const heroImage = venue.images && venue.images.length > 0 ? venue.images[0] : 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=2000'

  // Structured Data (JSON-LD) for Reserve with Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": venueType === 'bar' ? "BarOrPub" : "NightClub",
    "name": venue.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": venue.address,
      "addressLocality": venue.city,
      "addressCountry": "AT"
    },
    "url": `https://clubify.at/${venueType}s/${slug}`,
    "potentialAction": {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://clubify.at/reserve/${slug}`,
        "inLanguage": "de-AT",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
          "http://schema.org/IOSPlatform",
          "http://schema.org/AndroidPlatform"
        ]
      },
      "result": {
        "@type": "FoodEstablishmentReservation",
        "name": "Tischreservierung"
      }
    }
  }

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main style={{ minHeight: '100vh', background: '#09090b', color: 'white', paddingBottom: 100 }}>
        {/* Simplified Hero */}
        <div style={{ position: 'relative', height: '30vh', overflow: 'hidden' }}>
          <Image src={heroImage} alt={venue.name} fill style={{ objectFit: 'cover', opacity: 0.4, filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #09090b)' }} />
          
          <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px' }}>
             <h1 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: 12, letterSpacing: '-0.03em' }}>{venue.name}</h1>
             <div style={{ display: 'flex', gap: 20, color: '#a1a1aa', fontSize: '1rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} color="#3b82f6" /> {venue.city}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={16} color="#fbbf24" fill="#fbbf24" /> {venue.avg_rating?.toFixed(1) || 'Neu'}</span>
             </div>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '-40px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
           <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', padding: '4px 16px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                 Google Place Action Link 
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>Tisch reservieren</h2>
              <p style={{ color: '#71717a', marginTop: 8 }}>Sichere dir deinen Platz in wenigen Sekunden.</p>
           </div>

           <VenueReservationForm 
            venueId={venue.id} 
            venueType={venueType} 
            venueName={venue.name}
            source="google"
            venueZones={zones}
            showZones={venue.show_zones ?? true}
           />
        </div>

        {/* Branding Footer */}
        <div style={{ marginTop: 80, textAlign: 'center', opacity: 0.3 }}>
           <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Powered by Clubify.at — Experience Nightlife
           </p>
        </div>
      </main>
    </>
  )
}
