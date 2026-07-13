import { createClient, getUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/public/Navbar'
import { MapPin, Users, Star, Clock, Globe, Camera, Phone, ChevronLeft, ArrowRight, GlassWater, Armchair } from 'lucide-react'
import VenueReservationModal from '@/components/public/VenueReservationModal'
import FavoriteButton from '@/components/public/FavoriteButton'
import ReviewSection from '@/components/public/ReviewSection'
import { isFavorited } from '@/lib/actions/user/FavoriteActions'
import { getReviewStats } from '@/lib/actions/user/ReviewActions'
import BackButton from '@/components/public/BackButton'

// Dummy Stockbild falls das Array images leer ist
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=2000'

export default async function BarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getUser()
  const { slug } = await params
  const supabase = await createClient()

  // Tabellenabfrage an bars statt clubs!
  const { data: bar, error } = await supabase
    .from('bars')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !bar) {
    notFound()
  }

  // Check favorite status
  const favorited = await isFavorited(bar.id, 'bar')

  // Fetch review stats
  const { avgRating, reviewCount } = await getReviewStats(bar.id, 'bar')

  // Reale Events aus der Datenbank laden (Nur Bestätigte & Zukünftige)
  const { data: realEvents } = await supabase
    .from('events')
    .select('*')
    .eq('bar_id', bar.id)
    .eq('venue_verification_status', 'approved')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(5)

  const upcomingEvents = realEvents || []

  const heroImage = bar.images && bar.images.length > 0 ? bar.images[0] : FALLBACK_IMAGE

  return (
    <>
      <Navbar user={user} />
      
      <main style={{ minHeight: '100vh', paddingBottom: 80, background: '#09090b', color: '#f1f5f9' }}>
        {/* HERO SECTION */}
        <div className="details-hero" style={{ position: 'relative', width: '100%', height: '55vh', overflow: 'hidden' }}>
          <Image 
            src={heroImage} 
            alt={bar.name} 
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
              <BackButton fallbackPath="/bars" />
              <FavoriteButton targetId={bar.id} type="bar" initialIsFavorited={favorited} />
            </div>

            {/* Title & Stats */}
            <div style={{ position: 'absolute', bottom: 40, left: '5%', right: '5%' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12, textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
                {bar.name}
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
                  <MapPin size={16} style={{ color: '#3b82f6' }} />
                  {bar.city}
                </div>

                {bar.price_range && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700 }}>
                    {'€'.repeat(bar.price_range)}<span style={{ color: '#52525b' }}>{'€'.repeat(4 - bar.price_range)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="details-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 5%' }}>
          
          {/* Main Info */}
          <div className="details-main">
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16, color: '#fff' }}>Über die Bar</h2>
              <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '1.05rem' }}>
                {bar.description || 'Diese Bar hat noch keine detaillierte Beschreibung hinterlegt.'}
              </p>
            </div>

            {/* Drink Types stattdessen music_genres */}
            {bar.drink_types && bar.drink_types.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GlassWater size={18} style={{ color: '#3b82f6' }} /> Spezialitäten
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {bar.drink_types.map((d: string) => (
                    <span key={d} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Happy Hours / Upcoming */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Events & Highlights</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {upcomingEvents.map((evt: any) => (
                  <Link href={`/events/${evt.slug}`} key={evt.id} style={{ textDecoration: 'none' }}>
                    <div className="hover-bg-elevated hover-translate" style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      background: '#18181b', border: '1px solid #27272a', padding: 20, borderRadius: 16, transition: 'all 0.2s', cursor: 'pointer' 
                    }}>
                      <div>
                        <div style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Clock size={12} /> {new Date(evt.date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{evt.name}</div>
                      </div>
                      <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem' }}>
                        {evt.ticket_price > 0 ? `${evt.ticket_price}€` : 'Free Entry'}
                      </div>
                    </div>
                  </Link>
                ))}
                {upcomingEvents.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#71717a', border: '1px dashed #27272a', borderRadius: 16 }}>
                    Aktuell keine anstehenden Events in dieser Bar bestätigt.
                  </div>
                )}
              </div>
            </div>



          </div>

          {/* Sidebar */}
          <div className="details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 20, padding: 24, position: 'relative' }}>
              <h3 className="sidebar-title" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Bar Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 {bar.address ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bar.address}, ${bar.city}, ${bar.country || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-info-item"
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><MapPin size={18} style={{ color: '#e2e8f0' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Adresse</div>
                      <div style={{ fontSize: '0.95rem', color: 'white' }}>{bar.address}<br/>{bar.city}</div>
                    </div>
                  </a>
                ) : (
                  <div className="sidebar-info-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><MapPin size={18} style={{ color: '#e2e8f0' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Adresse</div>
                      <div style={{ fontSize: '0.95rem', color: 'white' }}>Keine Adresse hinterlegt</div>
                    </div>
                  </div>
                )}

                {bar.capacity && (
                  <div className="sidebar-info-item" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 10 }}><Users size={18} style={{ color: '#e2e8f0' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: 2 }}>Kapazität</div>
                      <div style={{ fontSize: '0.95rem', color: 'white' }}>~ {bar.capacity.toLocaleString()} Plätze</div>
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: '#27272a', margin: '8px 0' }} />

                <div style={{ padding: '8px 0' }}>
                   <VenueReservationModal 
                     venueId={bar.id} 
                     venueType="bar" 
                     venueName={bar.name}
                     trigger={
                       <button style={{ 
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                         width: '100%', padding: '16px', borderRadius: 16, border: 'none', 
                         background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', 
                         fontWeight: 900, cursor: 'pointer',
                         boxShadow: '0 10px 20px -5px rgba(139, 92, 246, 0.3)'
                       }}>
                          <Armchair size={18} /> Tisch reservieren
                       </button>
                     }
                   />
                </div>

                <div style={{ height: 1, background: '#27272a', margin: '8px 0' }} />
                
                <div className="sidebar-social-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {bar.website && (
                    <a href={bar.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                      <Globe size={14} style={{ color: '#3b82f6' }} /> Webseite
                    </a>
                  )}
                  {bar.instagram && (
                    <a href={`https://instagram.com/${bar.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                      <Camera size={14} style={{ color: '#ec4899' }} /> Instagram
                    </a>
                  )}
                  {bar.phone && (
                    <a href={`tel:${bar.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                      <Phone size={14} style={{ color: '#a78bfa' }} /> Anrufen
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COMMUNITY & REVIEWS */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5% 40px 5%' }}>
          <ReviewSection targetId={bar.id} targetType="bar" user={user} />
        </div>
      </main>
    </>
  )
}
