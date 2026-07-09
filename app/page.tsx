import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import type { Metadata } from 'next'
import { Search, Ticket, Smartphone, MapPin, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clubify — Discover Nightlife',
  description: 'Entdecke die besten Clubs, Bars und Events in deiner Nähe. Tickets kaufen, Tische reservieren, QR-Check-in.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('id, full_name, role, avatar_url').eq('id', user.id).single()
    profile = data
  }

  // Fetch featured content
  const [
    clubsRes, 
    eventsRes,
    barsRes
  ] = await Promise.all([
    supabase.from('clubs').select('id, name, slug, city, images, avg_rating, price_range, music_genres').eq('status', 'published').order('avg_rating', { ascending: false }).limit(3),
    supabase.from('events').select('id, name, slug, date, ticket_price, currency, images, lineup').eq('status', 'published').gt('date', new Date().toISOString()).order('date', { ascending: true }).limit(3),
    supabase.from('bars').select('id, name, slug, city, images, avg_rating, price_range, drink_types').eq('status', 'published').order('avg_rating', { ascending: false }).limit(3),
  ])

  const featuredClubs = clubsRes.data
  const featuredEvents = eventsRes.data
  const featuredBars = barsRes.data

  console.log('--- DB ERRORS ---')
  if (clubsRes.error) console.log('Clubs Error:', clubsRes.error)
  if (eventsRes.error) console.log('Events Error:', eventsRes.error)
  if (barsRes.error) console.log('Bars Error:', barsRes.error)

  // Get errors
  const errClubs = featuredClubs === null ? 'Err Clubs' : null
  
  if (errClubs) {
    console.log('ERROR CLUBS FETCH')
  }

  console.log('--- HOMEPAGE RENDER ---')
  console.log('Clubs Found:', featuredClubs?.length)
  console.log('Bars Found:', featuredBars?.length)
  console.log('Events Found:', featuredEvents?.length)

  return (
    <>
      <Navbar user={profile as any} />
      <main>
        <HeroSection />
        <StatsSection />
        
        {/* Debug UI */}
        {(clubsRes.error || eventsRes.error || barsRes.error) && (
           <div style={{ background: 'red', color: 'white', textAlign: 'center', padding: 20 }}>
             <h3>Database Error Detected</h3>
             <pre style={{textAlign: 'left'}}>{JSON.stringify({ clubs: clubsRes.error, events: eventsRes.error, bars: barsRes.error }, null, 2)}</pre>
           </div>
        )}

        {featuredClubs === null && !clubsRes.error && (
           <div style={{ color: 'red', textAlign: 'center', padding: 20 }}>
             CLUBS IS NULL BUT NO ERROR (Should never happen)
           </div>
        )}

        <FeaturedClubsSection clubs={featuredClubs ?? []} />
        <FeaturedBarsSection bars={featuredBars ?? []} />
        <UpcomingEventsSection events={featuredEvents ?? []} />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}

function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 80,
    }}>
      {/* Animated background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} className="animated-gradient" />

      {/* Particle layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#8b5cf6' : '#ec4899',
              opacity: 0.4,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 6 + 8}s`,
            }}
          />
        ))}
      </div>

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px', maxWidth: 800 }}>
        <div className="badge badge-violet animate-fade-in-up" style={{ marginBottom: 24, fontSize: '0.8rem' }}>
          Die Nightlife-Plattform für Österreich & Deutschland
        </div>

        <h1
          className="gradient-text animate-fade-in-up"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, animationDelay: '0.1s', opacity: 0 }}
        >
          Entdecke das<br />Nachtleben
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgb(var(--text-secondary))',
            maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7,
            animation: 'fade-in-up 0.6s 0.2s ease forwards', opacity: 0,
          }}
        >
          Finde die besten Clubs, Bars und Events in deiner Nähe.
          Tickets kaufen, Tische reservieren, QR-Check-in.
        </p>

        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
            animation: 'fade-in-up 0.6s 0.3s ease forwards', opacity: 0,
          }}
        >
          <Link href="/map" className="btn btn-primary btn-lg" id="hero-map-cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Karte öffnen
          </Link>
          <Link href="/events" className="btn btn-secondary btn-lg" id="hero-events-cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Events entdecken
          </Link>
        </div>

        {/* Search Mini */}
        <div style={{ marginTop: 48, animation: 'fade-in-up 0.6s 0.4s ease forwards', opacity: 0 }}>
          <Link
            href="/search"
            className="glass"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '12px 24px', borderRadius: 50, textDecoration: 'none',
              color: 'rgb(var(--text-secondary))', fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Clubs, Bars oder Events suchen...
            <span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>⌘K</span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 2, animation: 'fade-in 1s 1s ease forwards', opacity: 0,
      }}>
        <div style={{
          width: 24, height: 40, border: '2px solid rgba(139,92,246,0.4)',
          borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 6,
        }}>
          <div style={{
            width: 4, height: 8, background: '#8b5cf6', borderRadius: 2,
            animation: 'float-up 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: '500+', label: 'Clubs & Bars', color: '#8b5cf6' },
    { value: '2.000+', label: 'Events pro Monat', color: '#ec4899' },
    { value: '50.000+', label: 'Zufriedene Nutzer', color: '#22d3ee' },
    { value: '98%', label: 'Reibungsloser Check-in', color: '#a3e635' },
  ]

  return (
    <section style={{ padding: '60px 0', background: 'rgb(var(--bg-surface))' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32, textAlign: 'center',
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ animation: `fade-in-up 0.6s ${i * 0.1}s ease forwards`, opacity: 0 }}>
              <div style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
                color: stat.color, marginBottom: 6,
              }}>{stat.value}</div>
              <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedClubsSection({ clubs }: { clubs: any[] }) {
  const mockClubs = clubs.length > 0 ? clubs : []

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 8 }}>
              Featured Clubs
            </h2>
            <p style={{ color: 'rgb(var(--text-secondary))' }}>Die angesagtesten Locations in deiner Stadt</p>
          </div>
          <Link href="/clubs" className="btn btn-secondary btn-sm hide-mobile">Alle anzeigen →</Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {mockClubs.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>Keine Clubs gefunden.</p>
          ) : (
            mockClubs.map((club, i) => (
              <ClubCard key={club.id} club={club} delay={i * 0.1} />
            ))
          )}
        </div>

        {mockClubs.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/clubs" className="btn btn-secondary hide-desktop">Alle Clubs anzeigen →</Link>
          </div>
        )}
      </div>
    </section>
  )
}

function FeaturedBarsSection({ bars }: { bars: any[] }) {
  return (
    <section className="section" style={{ background: 'rgba(59, 130, 246, 0.02)' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 8, background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Featured Bars
            </h2>
            <p style={{ color: 'rgb(var(--text-secondary))' }}>Exklusive Drinks und unvergessliche Vibes</p>
          </div>
          <Link href="/bars" className="btn btn-secondary btn-sm hide-mobile">Alle anzeigen →</Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {(!bars || bars.length === 0) ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>Keine Bars gefunden.</p>
          ) : (
            bars.map((bar, i) => (
              <BarCard key={bar.id} bar={bar} delay={i * 0.1} />
            ))
          )}
        </div>

        {(bars && bars.length > 0) && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/bars" className="btn btn-secondary hide-desktop">Alle Bars anzeigen →</Link>
          </div>
        )}
      </div>
    </section>
  )
}

function ClubCard({ club, delay = 0 }: { club: any; delay?: number }) {
  const priceStr = '€'.repeat(club.price_range ?? 2) + '€'.repeat(4 - (club.price_range ?? 2)).replace(/€/g, '·')
  const fallbackImg = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800'
  const imgUrl = club.images?.[0] || fallbackImg

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="card"
      style={{ animation: `fade-in-up 0.6s ${delay}s ease forwards`, opacity: 0, textDecoration: 'none' }}
      id={`club-card-${club.slug}`}
    >
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <img src={imgUrl} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b 0%, transparent 80%)' }} />
        
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {club.music_genres?.slice(0, 2).map((g: string) => (
            <span key={g} className="badge badge-violet" style={{ fontSize: '0.7rem' }}>{g}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{club.name}</h3>
          <span style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} fill="#eab308" stroke="#eab308" /> {club.avg_rating?.toFixed(1) ?? '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, color: 'rgb(var(--text-muted))', fontSize: '0.85rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {club.city}</span>
          <span className="price-range">
            {[...Array(4)].map((_, j) => (
              <span key={j} style={{ color: j < (club.price_range ?? 2) ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}>€</span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  )
}

function BarCard({ bar, delay = 0 }: { bar: any; delay?: number }) {
  const fallbackImg = 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800'
  const imgUrl = bar.images?.[0] || fallbackImg

  return (
    <Link
      href={`/bars/${bar.slug}`}
      className="card"
      style={{ animation: `fade-in-up 0.6s ${delay}s ease forwards`, opacity: 0, textDecoration: 'none' }}
    >
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <img src={imgUrl} alt={bar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b 0%, transparent 80%)' }} />
        
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {bar.drink_types?.slice(0, 2).map((g: string) => (
            <span key={g} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '4px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600 }}>{g}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{bar.name}</h3>
          <span style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} fill="#eab308" stroke="#eab308" /> {bar.avg_rating?.toFixed(1) ?? '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, color: 'rgb(var(--text-muted))', fontSize: '0.85rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {bar.city}</span>
          <span className="price-range">
            {[...Array(4)].map((_, j) => (
              <span key={j} style={{ color: j < (bar.price_range ?? 2) ? '#10b981' : 'rgba(255,255,255,0.1)' }}>€</span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  )
}

function UpcomingEventsSection({ events }: { events: any[] }) {
  const mockEvents = events.length > 0 ? events : []

  if (mockEvents.length === 0) return null

  return (
    <section className="section" style={{ background: 'rgb(var(--bg-surface))' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 8, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kommende Events
            </h2>
            <p style={{ color: 'rgb(var(--text-secondary))' }}>Sichere dir jetzt dein Ticket</p>
          </div>
          <Link href="/events" className="btn btn-secondary btn-sm hide-mobile">Alle Events →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {mockEvents.map((event, i) => {
            const d = new Date(event.date)
            const fallbackImg = 'https://images.unsplash.com/photo-1540039155732-d68f2c5cb13b?auto=format&fit=crop&q=80&w=800'
            const imgUrl = event.images?.[0] || fallbackImg
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="card hover-translate hover-border-violet"
                style={{ textDecoration: 'none' }}
                id={`event-card-${event.slug}`}
              >
                <div style={{ display: 'flex', padding: 20, gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img src={imgUrl} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                      {d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4, color: 'white' }}>{event.name}</h3>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.85rem' }}>
                      <span style={{ color: 'rgb(var(--text-muted))' }}>{event.lineup?.[0] || 'TBA'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                    {event.ticket_price > 0 ? `${event.ticket_price} ${event.currency || '€'}` : 'Free'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { icon: <Search size={28} style={{ color: '#a78bfa' }} />, title: 'Entdecken', desc: 'Finde Clubs, Bars und Events auf der interaktiven Karte oder per Suche.' },
    { icon: <Ticket size={28} style={{ color: '#f472b6' }} />, title: 'Buchen', desc: 'Kaufe Tickets oder reserviere einen Tisch — sicher per Stripe bezahlen.' },
    { icon: <Smartphone size={28} style={{ color: '#22d3ee' }} />, title: 'Genießen', desc: 'Zeige deinen QR-Code am Eingang und genieße die Nacht.' },
  ]
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 12 }}>So funktioniert Clubify</h2>
        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 60 }}>In 3 einfachen Schritten zu deiner Nacht</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ animation: `fade-in-up 0.6s ${i * 0.15}s ease forwards`, opacity: 0 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, margin: '0 auto 20px',
              }}>{step.icon}</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
                <span style={{ color: 'rgba(139,92,246,0.7)', marginRight: 8, fontSize: '0.85rem' }}>0{i + 1}</span>
                {step.title}
              </div>
              <p style={{ color: 'rgb(var(--text-secondary))', lineHeight: 1.6, fontSize: '0.9rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.08) 100%)',
      }} />
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: 16 }}>
              Bereit für die nächste Nacht?
            </h2>
            <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 32, fontSize: '1.05rem' }}>
              Registriere dich kostenlos und entdecke das beste Nachtleben in deiner Stadt.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/auth/register" className="btn btn-primary btn-lg">
                Jetzt kostenlos starten
              </Link>
              <Link href="/map" className="btn btn-secondary btn-lg">
                Karte öffnen
              </Link>
            </div>
          </div>

          <div className="glass" style={{ 
            padding: 40, borderRadius: 24, background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Besitzt du einen Club?</h3>
            <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 24, fontSize: '0.9rem' }}>
              Werde Partner von Clubify und erreiche tausende Nachtschwärmer.
            </p>
            <Link href="/apply" className="btn btn-outline" style={{ width: '100%', padding: 16, borderRadius: 12, border: '2px solid rgb(var(--color-violet))', color: 'rgb(var(--color-violet))', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Jetzt als Partner bewerben
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
