import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GeoFomo from './GeoFomo'
import { ArrowRight } from 'lucide-react'

interface FomoSectionProps {
  user: any | null
  profile: any | null
}

export default async function FomoSection({ user, profile }: FomoSectionProps) {
  const supabase = await createClient()

  const now = new Date()
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Always fetch upcoming events count + 2 previews for both paths
  const [{ count: weekEventCount }, { data: upcomingEvents }] = await Promise.all([
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('date', now.toISOString())
      .lte('date', weekEnd.toISOString()),
    supabase
      .from('events')
      .select('id, name, slug, date, ticket_price, currency, images')
      .eq('status', 'published')
      .gte('date', now.toISOString())
      .order('date', { ascending: true })
      .limit(3),
  ])

  /* ─── NOT LOGGED IN: geolocation client component ─── */
  if (!user || !profile) {
    return (
      <GeoFomo
        weekEventCount={weekEventCount ?? 0}
        upcomingEvents={upcomingEvents ?? []}
      />
    )
  }

  /* ─── LOGGED IN: server-side personalization ─── */
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const firstName = profile.full_name?.split(' ')[0] || 'du'

  // Fetch favorites for this user
  const { data: favorites } = await supabase
    .from('favorites')
    .select('club_id, bar_id, clubs(city, music_genres), bars(city)')
    .eq('user_id', user.id)

  const favCount = favorites?.length ?? 0

  // Derive preferred city from most-favorited city
  const cityCounts: Record<string, number> = {}
  favorites?.forEach((f: any) => {
    const c = f.clubs?.city || f.bars?.city
    if (c) cityCounts[c] = (cityCounts[c] ?? 0) + 1
  })
  const preferredCity =
    Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Derive preferred genres from favorited clubs
  const genreSet = new Set<string>()
  favorites?.forEach((f: any) => {
    f.clubs?.music_genres?.forEach((g: string) => genreSet.add(g))
  })
  const userGenres = Array.from(genreSet).slice(0, 5)

  // Count events this week at favorited venues
  const favClubIds = favorites?.map((f: any) => f.club_id).filter(Boolean) ?? []
  const favBarIds  = favorites?.map((f: any) => f.bar_id).filter(Boolean) ?? []

  let favEventCount = 0
  if (favClubIds.length > 0 || favBarIds.length > 0) {
    const [r1, r2] = await Promise.all([
      favClubIds.length > 0
        ? supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .in('club_id', favClubIds)
            .eq('status', 'published')
            .gte('date', now.toISOString())
            .lte('date', weekEnd.toISOString())
        : Promise.resolve({ count: 0 }),
      favBarIds.length > 0
        ? supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .in('bar_id', favBarIds)
            .eq('status', 'published')
            .gte('date', now.toISOString())
            .lte('date', weekEnd.toISOString())
        : Promise.resolve({ count: 0 }),
    ])
    favEventCount = ((r1 as any).count ?? 0) + ((r2 as any).count ?? 0)
  }

  // Genre-matched events preview (max 2)
  let genreEvents: any[] = []
  if (userGenres.length > 0) {
    // Supabase JS doesn't support array-overlap natively, filter from general results
    const { data: allUpcoming } = await supabase
      .from('events')
      .select('id, name, slug, date, ticket_price, currency, genre')
      .eq('status', 'published')
      .gte('date', now.toISOString())
      .order('date', { ascending: true })
      .limit(20)
    genreEvents = (allUpcoming ?? [])
      .filter(e => e.genre?.some((g: string) => userGenres.includes(g)))
      .slice(0, 2)
  }

  const displayEvents = genreEvents.length > 0
    ? genreEvents
    : (upcomingEvents ?? []).slice(0, 2)

  return (
    <section className="fomo-section">
      <div className="container">
        <div className="fomo-inner">

          {/* Left: personalized greeting + chips */}
          <div className="fomo-left">
            <p className="fomo-greeting">
              {greeting}, {firstName} 👋
            </p>

            <div className="fomo-chips">
              {/* This-week events */}
              <div className="fomo-chip fomo-chip-fire">
                <span>🔥</span>
                <span>
                  {weekEventCount
                    ? `${weekEventCount} Events diese Woche${preferredCity ? ` in ${preferredCity}` : ''}`
                    : 'Bald neue Events'}
                </span>
              </div>

              {/* Favoriten count */}
              {favCount > 0 && (
                <div className="fomo-chip fomo-chip-heart">
                  <span>💜</span>
                  <span>{favCount} gespeicherte Venues</span>
                </div>
              )}

              {/* Events bei Favoriten */}
              {favEventCount > 0 && (
                <div className="fomo-chip fomo-chip-star">
                  <span>⭐</span>
                  <span>{favEventCount} Events deiner Favoriten</span>
                </div>
              )}

              {/* Genre hint */}
              {userGenres.length > 0 && genreEvents.length > 0 && (
                <div className="fomo-chip fomo-chip-genre">
                  <span>🎵</span>
                  <span>{userGenres[0]} Events für dich</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: event previews */}
          <div className="fomo-events">
            {displayEvents.map((ev: any) => {
              const d = new Date(ev.date)
              return (
                <Link key={ev.id} href={`/events/${ev.slug}`} className="fomo-event-pill">
                  <div className="fomo-event-date">
                    <span>{d.getDate()}</span>
                    <span>{d.toLocaleDateString('de-DE', { month: 'short' })}</span>
                  </div>
                  <div className="fomo-event-info">
                    <span className="fomo-event-name">{ev.name}</span>
                    <span className="fomo-event-price">
                      {ev.ticket_price > 0
                        ? `${ev.ticket_price}${ev.currency || '€'}`
                        : 'Free Entry'}
                    </span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                </Link>
              )
            })}

            <Link href="/events" className="fomo-see-all">
              Alle Events ansehen <ArrowRight size={13} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
