import { createClient, getUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/public/Navbar'
import { MapPin, Users, Music, Star, Clock, Globe, Camera, Phone, ChevronLeft, ArrowRight, Armchair } from 'lucide-react'
import FavoriteButton from '@/components/public/FavoriteButton'
import ReviewSection from '@/components/public/ReviewSection'
import { isFavorited } from '@/lib/actions/user/FavoriteActions'
import { getReviewStats } from '@/lib/actions/user/ReviewActions'
import TableReservationModal from '@/components/public/TableReservationModal'
import BackButton from '@/components/public/BackButton'

// Dummy Stockbild falls das Array images leer ist
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=2000'

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getUser()
  const { slug } = await params
  const supabase = await createClient()

  // Lade Club + Pakete parallel
  const [
    { data: club, error: clubError },
    { data: packages }
  ] = await Promise.all([
    supabase.from('clubs').select('*').eq('slug', slug).single(),
    supabase.from('table_packages').select('*').order('price', { ascending: true }) 
  ])

  if (clubError || !club) {
    notFound()
  }

  // Filtern der Pakete für diesen spezifischen Club
  const clubPackages = (packages || []).filter(p => p.club_id === club.id && p.status === 'active')

  // Check favorite status
  const favorited = await isFavorited(club.id, 'club')

  // Fetch review stats
  const { avgRating, reviewCount } = await getReviewStats(club.id, 'club')

  // Reale Events aus der Datenbank laden (Nur Bestätigte & Zukünftige)
  const { data: realEvents } = await supabase
    .from('events')
    .select('*')
    .eq('club_id', club.id)
    .eq('venue_verification_status', 'approved')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(5)

  const upcomingEvents = realEvents || []

  const heroImage = club.images && club.images.length > 0 ? club.images[0] : FALLBACK_IMAGE

  return (
    <>
      <Navbar user={user} />
      
      <main className="details-page-main" style={{ minHeight: '100vh', paddingBottom: 80, background: '#09090b', color: '#f1f5f9' }}>
        {/* HERO SECTION */}
        <div className="details-hero" style={{ position: 'relative', width: '100%', height: '55vh', overflow: 'hidden' }}>
          <Image 
            src={heroImage} 
            alt={club.name} 
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
              <BackButton fallbackPath="/clubs" />
              <FavoriteButton targetId={club.id} type="club" initialIsFavorited={favorited} />
            </div>

            {/* Title & Stats */}
            <div className="details-hero-content" style={{ position: 'absolute', bottom: 40, left: '5%', right: '5%' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16, textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
                {club.name}
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
                  <MapPin size={16} style={{ color: '#8b5cf6' }} />
                  {club.city}
                </div>

                {club.price_range && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700 }}>
                    {'€'.repeat(club.price_range)}<span style={{ color: '#52525b' }}>{'€'.repeat(4 - club.price_range)}</span>
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
            <div className="details-section">
              <h2 className="details-section-title">Über den Club</h2>
              <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '1.05rem' }}>
                {club.description || 'Dieser Club hat noch keine detaillierte Beschreibung hinterlegt, aber die Tanzfläche wartet bereits auf dich.'}
              </p>
            </div>

            {/* Music Genres */}
            {club.music_genres && club.music_genres.length > 0 && (
              <div className="details-section">
                <h3 className="details-section-title">
                  <Music size={18} style={{ color: '#ec4899' }} /> Musik Styles
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {club.music_genres.map((g: string) => (
                    <span key={g} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#fbcfe8', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="details-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                <h3 className="details-section-title" style={{ marginBottom: 0 }}>Anstehende Events</h3>
                <Link href="#" className="hover-text-violet" style={{ color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Alle ansehen <ArrowRight size={14} />
                </Link>
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
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>{evt.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9' }}>{evt.ticket_price > 0 ? `ab ${evt.ticket_price}€` : 'Free Entry'}</div>
                         <div style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>Tickets verfügbar</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {upcomingEvents.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#71717a', border: '1px dashed #27272a', borderRadius: 16 }}>
                    Aktuell keine anstehenden Events in diesem Club bestätigt.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Info Box */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 24, padding: 24, position: 'relative' }}>
              <h3 className="sidebar-title details-section-title">Club Infos</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {club.address ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${club.address}, ${club.city}, ${club.country || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-info-item"
                    style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 12 }}><MapPin size={18} style={{ color: '#a78bfa' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: 2 }}>Adresse</div>
                      <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{club.address}</div>
                      <div style={{ fontSize: '0.85rem', color: '#71717a', marginTop: 2 }}>{club.city}, {club.country}</div>
                    </div>
                  </a>
                ) : (
                  <div className="sidebar-info-item" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ background: '#27272a', padding: 10, borderRadius: 12 }}><MapPin size={18} style={{ color: '#a78bfa' }} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: 2 }}>Adresse</div>
                      <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>Keine Adresse hinterlegt</div>
                    </div>
                  </div>
                )}

                <div className="sidebar-info-item" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ background: '#27272a', padding: 10, borderRadius: 12 }}><Clock size={18} style={{ color: '#fb923c' }} /></div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: 2 }}>Öffnungszeiten</div>
                    <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>Ab 23:00 Uhr offen</div>
                  </div>
                </div>

                {(club.website || club.instagram || club.phone) && (
                  <>
                    <div style={{ height: 1, background: '#27272a', margin: '8px 0' }} className="hide-mobile" />
                    <div className="sidebar-social-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      {club.website && (
                        <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                          <Globe size={14} style={{ color: '#a78bfa' }} /> Webseite
                        </a>
                      )}
                      {club.instagram && (
                        <a href={`https://instagram.com/${club.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                          <Camera size={14} style={{ color: '#ec4899' }} /> Instagram
                        </a>
                      )}
                      {club.phone && (
                        <a href={`tel:${club.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }} className="hover-bg-elevated">
                          <Phone size={14} style={{ color: '#3b82f6' }} /> Anrufen
                        </a>
                      )}
                    </div>
                  </>
                )}

                <TableReservationModal 
                  clubId={club.id} 
                  clubName={club.name} 
                  packages={clubPackages} 
                  user={user}
                  trigger={
                    <button 
                      style={{ 
                        marginTop: 12, width: '100%', background: 'white', color: 'black', 
                        border: 'none', padding: 14, borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                      }}
                    >
                      <Armchair size={18} /> Tisch reservieren
                    </button>
                  }
                />
              </div>
            </div>
          </div>

        </div>

        {/* COMMUNITY & REVIEWS */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5% 40px 5%' }}>
          <ReviewSection targetId={club.id} targetType="club" user={user} />
        </div>
      </main>
    </>
  )
}
