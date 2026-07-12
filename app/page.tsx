import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HeroSearch from '@/components/public/HeroSearch'
import HeroFomoStats from '@/components/public/HeroFomoStats'
import type { Metadata } from 'next'
const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000',
]
import { MapPin, Star, ArrowRight, Music, GlassWater, Calendar, Map } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clubify — Dein Nachtleben',
  description: 'Entdecke die besten Clubs, Bars und Events in deiner Nähe. Tickets kaufen, Tische reservieren, QR-Check-in.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, role, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const [clubsRes, eventsRes, barsRes] = await Promise.all([
    supabase.from('clubs')
      .select('id, name, slug, city, images, avg_rating, price_range, music_genres')
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .limit(4),
    supabase.from('events')
      .select('id, name, slug, date, ticket_price, currency, images, lineup')
      .eq('status', 'published')
      .gt('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(4),
    supabase.from('bars')
      .select('id, name, slug, city, images, avg_rating, price_range, drink_types')
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .limit(4),
  ])

  const clubs = clubsRes.data ?? []
  const events = eventsRes.data ?? []
  const bars = barsRes.data ?? []

  const now = new Date()
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Fetch actual counts for the whole platform
  const [
    totalClubsCountRes,
    totalBarsCountRes,
    weekEventsCountRes,
    wienClubsRes,
    wienBarsRes,
  ] = await Promise.all([
    supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('bars').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('date', now.toISOString()).lte('date', weekEnd.toISOString()),
    supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('city', 'Wien').eq('status', 'published'),
    supabase.from('bars').select('id', { count: 'exact', head: true }).eq('city', 'Wien').eq('status', 'published'),
  ])

  const totalVenuesCount = (totalClubsCountRes.count ?? 0) + (totalBarsCountRes.count ?? 0)
  const weekEventsCount = weekEventsCountRes.count ?? 0
  const wienVenueCount = (wienClubsRes.count ?? 0) + (wienBarsRes.count ?? 0)

  // Fetch wien events count for guest fallback
  const wienClubIds = await supabase.from('clubs').select('id').eq('city', 'Wien').eq('status', 'published')
  const wienBarIds = await supabase.from('bars').select('id').eq('city', 'Wien').eq('status', 'published')
  const wcIds = wienClubIds.data?.map(c => c.id) ?? []
  const wbIds = wienBarIds.data?.map(b => b.id) ?? []
  let wienEventCount = 0
  if (wcIds.length > 0 || wbIds.length > 0) {
    const [e1, e2] = await Promise.all([
      wcIds.length > 0
        ? supabase.from('events').select('id', { count: 'exact', head: true }).in('club_id', wcIds).eq('status', 'published').gte('date', now.toISOString()).lte('date', weekEnd.toISOString())
        : Promise.resolve({ count: 0 }),
      wbIds.length > 0
        ? supabase.from('events').select('id', { count: 'exact', head: true }).in('bar_id', wbIds).eq('status', 'published').gte('date', now.toISOString()).lte('date', weekEnd.toISOString())
        : Promise.resolve({ count: 0 }),
    ])
    wienEventCount = ((e1 as any).count ?? 0) + ((e2 as any).count ?? 0)
  }

  // Personalization info
  let favCount = 0
  let favEventCount = 0
  let preferredCity = 'Wien'

  if (user) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('club_id, bar_id, clubs(city), bars(city)')
      .eq('user_id', user.id)

    favCount = favorites?.length ?? 0

    const cityCounts: Record<string, number> = {}
    favorites?.forEach((f: any) => {
      const c = f.clubs?.city || f.bars?.city
      if (c) cityCounts[c] = (cityCounts[c] ?? 0) + 1
    })
    preferredCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Wien'

    const favClubIds = favorites?.map((f: any) => f.club_id).filter(Boolean) ?? []
    const favBarIds  = favorites?.map((f: any) => f.bar_id).filter(Boolean) ?? []

    if (favClubIds.length > 0 || favBarIds.length > 0) {
      const [r1, r2] = await Promise.all([
        favClubIds.length > 0
          ? supabase.from('events').select('id', { count: 'exact', head: true }).in('club_id', favClubIds).eq('status', 'published').gte('date', now.toISOString()).lte('date', weekEnd.toISOString())
          : Promise.resolve({ count: 0 }),
        favBarIds.length > 0
          ? supabase.from('events').select('id', { count: 'exact', head: true }).in('bar_id', favBarIds).eq('status', 'published').gte('date', now.toISOString()).lte('date', weekEnd.toISOString())
          : Promise.resolve({ count: 0 }),
      ])
      favEventCount = ((r1 as any).count ?? 0) + ((r2 as any).count ?? 0)
    }
  }

  // Get next event label for the mobile FOMO chip
  const nextEvent = events[0] ?? null
  let nextEventLabel = ''
  if (nextEvent) {
    const dateObj = new Date(nextEvent.date)
    const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short' })
    nextEventLabel = `${nextEvent.name.slice(0, 10)}${nextEvent.name.length > 10 ? '..' : ''} (${dayName})`
  }

  // Interleave clubs & bars for the venue showcase
  const venues: Array<{ type: 'club' | 'bar'; data: any }> = []
  const max = Math.max(clubs.length, bars.length)
  for (let i = 0; i < max; i++) {
    if (clubs[i]) venues.push({ type: 'club', data: clubs[i] })
    if (bars[i]) venues.push({ type: 'bar', data: bars[i] })
  }
  const showcase = venues.slice(0, 6)

  // Hero images: pull from clubs + bars, fallback to Unsplash
  const dbHeroImages = [
    ...clubs.flatMap(c => c.images ?? []),
    ...bars.flatMap(b => b.images ?? []),
  ].filter(Boolean)
  const heroImages = [...dbHeroImages, ...HERO_FALLBACKS].slice(0, 3)

  return (
    <>
      <Navbar user={profile as any} />
      <main>
        <HeroSection
          images={heroImages}
          totalVenues={totalVenuesCount}
          wienVenueCount={wienVenueCount}
          wienEventCount={wienEventCount}
          isLoggedIn={!!user}
          favCount={favCount}
          favEventCount={favEventCount}
          preferredCity={preferredCity}
          nextEventLabel={nextEventLabel}
        />
        <MarqueeSection />
        <VenueShowcase venues={showcase} />
        {events.length > 0 && <EventsSection events={events} />}
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */

interface HeroSectionProps {
  images: string[]
  totalVenues: number
  wienVenueCount: number
  wienEventCount: number
  isLoggedIn: boolean
  favCount: number
  favEventCount: number
  preferredCity: string
  nextEventLabel: string
}

function HeroSection({
  images,
  totalVenues,
  wienVenueCount,
  wienEventCount,
  isLoggedIn,
  favCount,
  favEventCount,
  preferredCity,
  nextEventLabel,
}: HeroSectionProps) {
  return (
    <section className="hero-v2">
      {/* Layered background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 100% 70% at 50% -5%, rgba(139,92,246,0.26) 0%, transparent 60%)',
          'radial-gradient(ellipse 60% 50% at 95% 100%, rgba(236,72,153,0.1) 0%, transparent 60%)',
          'radial-gradient(ellipse 40% 40% at 5% 80%, rgba(34,211,238,0.06) 0%, transparent 60%)',
          '#08080f',
        ].join(', '),
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div className="hero-v2-layout">

          {/* ── TEXT SIDE ─────────────────────── */}
          <div className="hero-v2-inner">
            <div className="live-badge" style={{ animation: 'fade-in-up 0.45s ease forwards' }}>
              <span className="live-dot" />
              {totalVenues}+ Venues live in AT &amp; DE
            </div>

            <h1
              className="hero-v2-h1"
              style={{ animation: 'fade-in-up 0.45s 0.1s ease forwards', opacity: 0 }}
            >
              Deine<br />
              <span className="gradient-text">Nacht.</span>
            </h1>

            <p
              className="hero-v2-desc"
              style={{ animation: 'fade-in-up 0.45s 0.2s ease forwards', opacity: 0 }}
            >
              Clubs, Bars &amp; Events — finde alles in deiner Stadt.
              Tickets buchen, Tisch reservieren, QR-Check-in.
            </p>

            <div style={{ animation: 'fade-in-up 0.45s 0.3s ease forwards', opacity: 0, marginBottom: 22, width: '100%' }}>
              <HeroSearch />
            </div>

             <div
              className="quick-links"
              style={{ animation: 'fade-in-up 0.45s 0.4s ease forwards', opacity: 0, marginBottom: 40 }}
            >
              <Link href="/clubs" className="quick-link" id="ql-clubs">
                <Music size={13} style={{ opacity: 0.8 }} />
                <span>Clubs</span>
              </Link>
              <Link href="/bars" className="quick-link" id="ql-bars">
                <GlassWater size={13} style={{ opacity: 0.8 }} />
                <span>Bars</span>
              </Link>
              <Link href="/events" className="quick-link" id="ql-events">
                <Calendar size={13} style={{ opacity: 0.8 }} />
                <span>Events</span>
              </Link>
              <Link href="/map" className="quick-link quick-link-accent" id="ql-map">
                <Map size={13} style={{ opacity: 0.8 }} />
                <span>Karte</span>
              </Link>
            </div>

            {/* Dynamic FOMO Stats Grid */}
            <div
              className="hero-stats-strip"
              style={{ animation: 'fade-in-up 0.45s 0.5s ease forwards', opacity: 0 }}
            >
              <HeroFomoStats
                initialCity={preferredCity}
                initialEventCount={wienEventCount}
                initialVenueCount={wienVenueCount}
                isLoggedIn={isLoggedIn}
                favCount={favCount}
                favEventCount={favEventCount}
                nextEventLabel={nextEventLabel}
              />
            </div>
          </div>

          {/* ── VISUAL SIDE (desktop only) ────── */}
          <div className="hero-v2-visual">
            <div className="hero-mosaic">
              {/* Left: tall image */}
              <div className="mosaic-tall">
                <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,15,0.55) 0%, transparent 60%)' }} />
              </div>
              {/* Right: 2 stacked */}
              <div className="mosaic-stack">
                {images.slice(1, 3).map((img, i) => (
                  <div key={i} className="mosaic-half">
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,15,0.5) 0%, transparent 60%)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating: venues count */}
            <div style={{
              position: 'absolute', bottom: -16, left: -20,
              background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 16, padding: '14px 22px',
              boxShadow: '0 8px 30px rgba(139,92,246,0.15)',
              zIndex: 10,
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa', letterSpacing: '-0.03em' }}>{totalVenues}+</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>Venues live</div>
            </div>

            {/* Floating: status tag */}
            <div style={{
              position: 'absolute', top: 24, right: -16,
              background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(236,72,153,0.3)',
              borderRadius: 16, padding: '14px 22px',
              boxShadow: '0 8px 30px rgba(236,72,153,0.12)',
              zIndex: 10,
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                Live Check-in ⚡
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>in Sekunden</div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-scroll-cue" style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 3, animation: 'fade-in 1s 1.2s ease forwards', opacity: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: 22, height: 36, border: '1.5px solid rgba(139,92,246,0.35)', borderRadius: 11, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
          <div style={{ width: 3, height: 7, background: 'rgba(139,92,246,0.8)', borderRadius: 2, animation: 'float-up 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   MARQUEE
───────────────────────────────────────────── */

const MARQUEE_ITEMS = [
  'Wien', 'Berlin', 'München', 'Graz', 'Salzburg', 'Linz',
  'Clubs', 'Bars', 'Events', 'Tickets', 'QR Check-in', 'Nightlife',
  'Wien', 'Berlin', 'München', 'Graz', 'Salzburg', 'Linz',
  'Clubs', 'Bars', 'Events', 'Tickets', 'QR Check-in', 'Nightlife',
]

function MarqueeSection() {
  return (
    <div style={{
      background: 'rgba(139,92,246,0.07)',
      borderTop: '1px solid rgba(139,92,246,0.14)',
      borderBottom: '1px solid rgba(139,92,246,0.14)',
      padding: '12px 0',
      overflow: 'hidden',
    }}>
      <div className="ticker-inner">
        {MARQUEE_ITEMS.map((item, i) => (
          <span
            key={i}
            style={{
              padding: '0 18px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: i % 6 === 0 ? '#a78bfa' : 'rgba(255,255,255,0.28)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 18,
              whiteSpace: 'nowrap',
            }}
          >
            {item}
            <span style={{ color: 'rgba(139,92,246,0.35)' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   VENUE SHOWCASE
───────────────────────────────────────────── */

const CLUB_FALLBACKS = [
  'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
]
const BAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800',
]

function VenueShowcase({ venues }: { venues: Array<{ type: 'club' | 'bar'; data: any }> }) {
  if (venues.length === 0) return null

  return (
    <section style={{ padding: '80px 0 60px' }}>
      {/* Section header */}
      <div className="container" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Top Locations
            </p>
            <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Clubs &amp; Bars
            </h2>
          </div>
          <Link href="/map" className="btn btn-secondary btn-sm hide-mobile">
            Alle ansehen <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Card scroll / grid */}
      <div className="venue-showcase-wrap">
        {venues.map(({ type, data }, i) => {
          const fallbacks = type === 'club' ? CLUB_FALLBACKS : BAR_FALLBACKS
          const img = data.images?.[0] || fallbacks[i % fallbacks.length]
          const href = `/${type === 'club' ? 'clubs' : 'bars'}/${data.slug}`
          const tags = (type === 'club' ? data.music_genres : data.drink_types) ?? []
          const accentColor = type === 'club' ? '#a78bfa' : '#34d399'
          const accentBg = type === 'club' ? 'rgba(139,92,246,0.25)' : 'rgba(16,185,129,0.2)'

          return (
            <Link
              key={data.id}
              href={href}
              id={`venue-${data.slug}`}
              className="venue-card-v2"
              style={{ textDecoration: 'none', animationDelay: `${i * 0.07}s` }}
            >
              {/* Full-bleed image */}
              <img
                src={img}
                alt={data.name}
                className="venue-card-img"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              />

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(8,8,15,1) 0%, rgba(8,8,15,0.55) 40%, rgba(8,8,15,0.08) 100%)',
              }} />

              {/* Top row: type badge + rating */}
              <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  background: 'rgba(8,8,15,0.7)', backdropFilter: 'blur(10px)',
                  border: `1px solid ${accentColor}35`,
                  color: accentColor, fontSize: '0.65rem', fontWeight: 800,
                  padding: '4px 9px', borderRadius: 7, textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  {type === 'club' ? 'Club' : 'Bar'}
                </span>
                {(data.avg_rating > 0) && (
                  <span style={{
                    background: 'rgba(8,8,15,0.7)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(234,179,8,0.25)',
                    padding: '4px 9px', borderRadius: 7,
                    fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={11} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                    {data.avg_rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Bottom: name + city + tags */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 18px 20px' }}>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {tags.slice(0, 2).map((t: string) => (
                      <span key={t} style={{ background: accentBg, color: accentColor, fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 5 }}>
                  {data.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                  <MapPin size={12} />
                  <span>{data.city}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', marginTop: 24 }} className="hide-desktop">
          <Link href="/map" className="btn btn-secondary">Alle Locations →</Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   EVENTS
───────────────────────────────────────────── */

function EventsSection({ events }: { events: any[] }) {
  return (
    <section style={{ padding: '80px 0', background: 'rgba(15,15,20,0.6)' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, gap: 16 }}>
          <div>
            <p style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Upcoming
            </p>
            <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Kommende Events
            </h2>
          </div>
          <Link href="/events" className="btn btn-secondary btn-sm hide-mobile">
            Alle Events <ArrowRight size={14} />
          </Link>
        </div>

        <div className="events-list">
          {events.map((event, i) => {
            const d = new Date(event.date)
            const img = event.images?.[0]
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                id={`event-row-${event.slug}`}
                className="event-row-v2"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Date block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'white', lineHeight: 1.05 }}>
                    {d.getDate()}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                    {d.toLocaleDateString('de-DE', { month: 'short' })}
                  </span>
                </div>

                {/* Thin divider */}
                <div style={{ width: 1, height: 42, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

                {/* Thumbnail */}
                {img && (
                  <div style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.97rem', fontWeight: 800, color: 'white', marginBottom: 3, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.lineup?.slice(0, 2).join(' · ') || 'TBA'}
                  </p>
                </div>

                {/* Price + arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.88rem' }}>
                    {event.ticket_price > 0 ? `${event.ticket_price}${event.currency || '€'}` : 'Free'}
                  </span>
                  <ArrowRight size={15} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }} className="hide-desktop">
          <Link href="/events" className="btn btn-secondary">Alle Events →</Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    { num: '01', color: '#a78bfa', title: 'Entdecken', desc: 'Clubs, Bars & Events auf der Karte oder per Suche finden.' },
    { num: '02', color: '#f472b6', title: 'Buchen',    desc: 'Ticket kaufen oder Tisch reservieren — sicher via Stripe.' },
    { num: '03', color: '#22d3ee', title: 'Genießen',  desc: 'QR-Code zeigen, Einlass bekommen, die Nacht genießen.' },
  ]

  return (
    <section style={{ padding: '100px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
            So einfach
          </p>
          <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.025em' }}>
            In 3 Schritten zur Nacht
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48 }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                animation: `fade-in-up 0.5s ${i * 0.12}s ease forwards`,
                opacity: 0,
              }}
            >
              <div style={{
                fontSize: 'clamp(3.5rem, 7vw, 5rem)',
                fontWeight: 900,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: step.color,
                lineHeight: 1,
                marginBottom: 20,
                letterSpacing: '-0.05em',
                opacity: 0.85,
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.015em' }}>
                {step.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 220, margin: '0 auto' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */

function CTASection() {
  return (
    <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden', background: '#08080f' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(139,92,246,0.13) 0%, transparent 70%)',
      }} />
      <div style={{ position: 'absolute', top: -150, left: '25%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(139,92,246,0.07)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>

        <div className="live-badge" style={{ display: 'inline-flex', marginBottom: 32 }}>
          <span className="live-dot" />
          Kostenlos registrieren
        </div>

        <h2 style={{
          fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.045em',
          lineHeight: 0.95,
          marginBottom: 22,
        }}>
          Bereit für<br />
          <span className="gradient-text">heute Nacht?</span>
        </h2>

        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 'clamp(0.92rem, 2vw, 1.05rem)',
          maxWidth: 400,
          margin: '0 auto 48px',
          lineHeight: 1.75,
        }}>
          Über 50.000 Nutzer finden mit Clubify jede Woche ihre perfekte Nacht.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
          <Link
            href="/auth/register"
            className="btn btn-primary btn-lg"
            id="cta-register"
            style={{ borderRadius: 14, minWidth: 200 }}
          >
            Kostenlos starten →
          </Link>
          <Link
            href="/map"
            className="btn btn-secondary btn-lg"
            id="cta-map"
            style={{ borderRadius: 14 }}
          >
            <MapPin size={18} /> Karte öffnen
          </Link>
        </div>

        {/* Venue owner strip */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 'clamp(24px, 4vw, 40px)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap',
          textAlign: 'left',
        }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f472b6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Für Clubs &amp; Bars
            </p>
            <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 800, marginBottom: 8 }}>
              Venue auf Clubify listen?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.87rem', lineHeight: 1.65, maxWidth: 440 }}>
              Erreiche tausende Nachtschwärmer in AT &amp; DE — kostenlos starten.
            </p>
          </div>
          <Link
            href="/apply"
            id="cta-apply"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12,
              background: 'rgba(244,114,182,0.1)',
              border: '1px solid rgba(244,114,182,0.3)',
              color: '#f9a8d4', fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none', flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            Partner werden <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
