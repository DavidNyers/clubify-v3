import { createClient, getUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/public/Navbar'
import { MapPin, Users, Ticket, Clock, Calendar, ShieldAlert, Music, ChevronLeft, CalendarPlus, Star } from 'lucide-react'
import FavoriteButton from '@/components/public/FavoriteButton'
import ReviewSection from '@/components/public/ReviewSection'
import { isFavorited } from '@/lib/actions/user/FavoriteActions'
import { getReviewStats } from '@/lib/actions/user/ReviewActions'
import BackButton from '@/components/public/BackButton'
import TicketPurchaseButton from '@/components/public/TicketPurchaseButton'

// Dummy Stockbild für Events
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540039155732-d68f2c5cb13b?auto=format&fit=crop&q=80&w=2000'

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getUser()
  const { slug } = await params
  const supabase = await createClient()

  // Lade das Event inklusive Location (Club oder Bar)
  const { data: event, error } = await supabase
    .from('events')
    .select('*, clubs(id, name, city, address), bars(id, name, city, address)')
    .eq('slug', slug)
    .single()

  if (error || !event) return notFound()

  // Check favorite status
  const favorited = await isFavorited(event.id, 'event')

  // Fetch review stats
  const { avgRating, reviewCount } = await getReviewStats(event.id, 'event')

  const heroImage = event.images && event.images.length > 0 ? event.images[0] : FALLBACK_IMAGE
  const isVenueApproved = event.venue_verification_status === 'approved'
  const location = isVenueApproved ? (event.clubs || event.bars) : null
  const venueType = event.clubs ? 'clubs' : 'bars'

  // Format Date safely
  const evtDate = new Date(event.date)
  let timeString = 'TBA'
  try {
     timeString = evtDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  } catch(e) {}

  return (
    <>
      <Navbar user={user} />
      
      <main style={{ minHeight: '100vh', paddingBottom: 80, background: '#09090b', color: '#f1f5f9' }}>
        {/* HERO SECTION */}
        <div style={{ position: 'relative', width: '100%', height: '60vh', overflow: 'hidden' }}>
          <Image 
            src={heroImage} 
            alt={event.name} 
            fill 
            style={{ objectFit: 'cover' }}
            priority
          />
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(to top, #09090b 5%, rgba(9,9,11,0.5) 40%, rgba(9,9,11,0.2) 100%)' 
          }} />
          
          <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', height: '100%', padding: '0 5%', zIndex: 10 }}>
            {/* Back Button & Favorite */}
            <div style={{ position: 'absolute', top: 90, left: '5%', display: 'flex', gap: 12 }}>
              <BackButton fallbackPath="/events" />
              <FavoriteButton targetId={event.id} type="event" initialIsFavorited={favorited} />
            </div>

            {/* Bottom Info */}
            <div className="details-hero-content" style={{ position: 'absolute', bottom: 40, left: '5%', right: '5%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#f59e0b', color: 'black', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> {evtDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16, textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
                  {event.name}
                </h1>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', fontSize: '0.95rem' }}>
                  <Link href="#reviews" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-bg-amber">
                      <Star size={16} fill="#f59e0b" />
                      {avgRating > 0 ? avgRating : 'Neu'}
                      <span style={{ color: '#a1a1aa', fontWeight: 400, marginLeft: 4 }}>
                        ({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})
                      </span>
                    </div>
                  </Link>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                    {isVenueApproved && location ? (
                      <Link href={`/${venueType}/${location.name.toLowerCase().replace(/ /g, '-')}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc', textDecoration: 'none' }} className="hover-text-violet">
                        <MapPin size={18} style={{ color: '#f59e0b' }} />
                        <span style={{ fontWeight: 700 }}>{location.name}</span>, {location.city}
                      </Link>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a1a1aa' }}>
                        <MapPin size={18} style={{ color: '#71717a' }} />
                        <span style={{ fontWeight: 700 }}>Location TBA</span> (Wird vom Club bestätigt)
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={16} style={{ color: '#a1a1aa' }} />
                      Start: {timeString} Uhr
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="details-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 5%' }}>
          
          {/* Main Info */}
          <div className="details-main">
            <div className="details-section">
              <h2 className="details-section-title">Über das Event</h2>
              <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                {event.description || 'Der Organizer hat noch keine Event-Beschreibung hinzugefügt, aber die Lineups sprechen für sich!'}
              </p>
            </div>

            {/* Lineup */}
            {event.lineup && event.lineup.length > 0 && (
              <div className="details-section">
                <h3 className="details-section-title">
                  <Users size={20} style={{ color: '#f59e0b' }} /> Line-Up
                </h3>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' }}>
                  {event.lineup.map((artist: string, idx: number) => (
                    <div key={idx} style={{ 
                      padding: '16px 24px', borderBottom: idx < event.lineup.length - 1 ? '1px solid #27272a' : 'none',
                      fontSize: '1.1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 16
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      {artist}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Music Genres */}
            {event.genre && event.genre.length > 0 && (
              <div className="details-section">
                <h3 className="details-section-title">
                  <Music size={18} style={{ color: '#3b82f6' }} /> Genres
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {event.genre.map((g: string) => (
                    <span key={g} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 20, padding: 24, position: 'relative' }}>
              <h3 className="sidebar-title details-section-title">Event Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><CalendarPlus size={18} style={{ color: '#e2e8f0' }} /></div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Datum</div>
                    <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>{evtDate.toLocaleDateString('de-DE')}</div>
                  </div>
                </div>

                {location?.address ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><MapPin size={18} style={{ color: '#e2e8f0' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Location</div>
                      <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>{location.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: 2 }}>{location.address}<br/>{location.city}</div>
                    </div>
                  </a>
                ) : (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><MapPin size={18} style={{ color: '#e2e8f0' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Location</div>
                      <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>Location TBA</div>
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: '#27272a', margin: '8px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {event.age_restriction && (
                     <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#e2e8f0', fontSize: '0.9rem' }}>
                       <ShieldAlert size={16} style={{ color: '#ef4444' }} /> Ab {event.age_restriction} Jahren
                     </div>
                  )}
                  {event.max_guests && (
                     <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#e2e8f0', fontSize: '0.9rem' }}>
                       <Users size={16} style={{ color: '#a1a1aa' }} /> Kapazität: {event.max_guests} Gäste
                     </div>
                  )}
                </div>

                <div className="sidebar-booking-container" style={{ marginTop: 20 }}>
                  <TicketPurchaseButton eventId={event.id} ticketPrice={event.ticket_price} currency={event.currency} isLoggedIn={!!user} />
                </div>
                
              </div>
            </div>
          </div>

        </div>

        {/* COMMUNITY & REVIEWS */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5% 40px 5%' }}>
          <ReviewSection targetId={event.id} targetType="event" user={user} />
        </div>
      </main>
    </>
  )
}
