import { createClient, getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/Navbar'
import { Calendar, MapPin, Music, Ticket } from 'lucide-react'
import { Suspense } from 'react'
import SearchInput from '@/components/public/SearchInput'

// Dummy Stockbild für Events
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540039155732-d68f2c5cb13b?auto=format&fit=crop&q=80&w=800'

export const metadata = {
  title: 'Events — Clubify'
}

export default async function EventsRootPage({ searchParams }: { searchParams: Promise<{ q?: string, price?: string, genre?: string, openToday?: string }> }) {
  const user = await getUser()
  const { q, price, genre, openToday } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, clubs(name, city), bars(name, city)')
    .eq('status', 'published')

  if (q) {
    query = query.or(`name.ilike.%${q}%`)
  }

  if (price) {
    if (price === '1') query = query.eq('ticket_price', 0)
    else if (price === '2') query = query.gt('ticket_price', 0).lte('ticket_price', 15)
    else if (price === '3') query = query.gt('ticket_price', 15).lte('ticket_price', 30)
    else if (price === '4') query = query.gt('ticket_price', 30)
  }

  if (genre) {
    query = query.contains('genre', [genre])
  }

  if (openToday === 'true') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    query = query.gte('date', today.toISOString()).lt('date', tomorrow.toISOString())
  }

  // Hole Events inklusive der verknüpften Clubs und Bars für die Ortsangabe
  const { data: events, error } = await query
    .order('date', { ascending: true })

  return (
    <>
      <Navbar user={user} />
      
      <main className="listings-main" style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div className="listings-header">
            <h1 className="listings-title events-color">
              Die besten Events der Stadt
            </h1>
            <p className="listings-desc">
              Sichere dir Tickets für exklusive Partys, Konzerte und geheime Raves in deiner Nähe.
            </p>
          </div>

          {/* Search Input */}
          <div className="listings-search-container">
            <Suspense fallback={<div style={{ height: 60 }} />}>
              <SearchInput placeholder="Suche nach Events..." type="events" />
            </Suspense>
          </div>

          {/* Grid */}
          {!events || events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Aktuell keine anstehenden Events gefunden.
            </div>
          ) : (
            <div className="listings-grid">
              {events.map(event => {
                const coverImage = event.images && event.images.length > 0 ? event.images[0] : FALLBACK_IMAGE
                const locationName = event.clubs?.name || event.bars?.name || 'Unbekannte Location'
                const locationCity = event.clubs?.city || event.bars?.city || ''
                const dateRaw = new Date(event.date)
                
                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.slug}`} 
                    className="listing-card-wrap"
                  >
                    <div className="listing-card hover-translate hover-border-violet">
                      
                      {/* Image Area */}
                      <div className="listing-card-img-wrap">
                        <Image src={coverImage} alt={event.name} fill style={{ objectFit: 'cover' }} />
                        <div className="listing-card-date-badge">
                          <span className="listing-card-date-badge-month">{dateRaw.toLocaleDateString('de-DE', { month: 'short' })}</span>
                          <span className="listing-card-date-badge-day">{dateRaw.getDate()}</span>
                        </div>
                        {event.featured && (
                          <div className="listing-card-badge" style={{ left: 'auto', right: 6, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', zIndex: 10 }}>
                            FEATURED
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="listing-card-content">
                        <div className="listing-card-title-row">
                          <h3 className="listing-card-title">{event.name}</h3>
                        </div>

                        <div className="listing-card-info-row">
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {locationName} {locationCity && `• ${locationCity}`}
                          </span>
                        </div>

                        {/* Genres */}
                        <div className="listing-card-tags">
                          {event.genre?.slice(0, 1).map((g: string) => (
                            <span key={g} className="listing-card-tag events-tag">
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Ticket Info */}
                        <div className="listing-card-ticket-row">
                          <Ticket size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          <span>{event.ticket_price > 0 ? `${event.ticket_price} ${event.currency}` : 'Free Entry'}</span>
                        </div>
                      </div>

                    </div>
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </main>
    </>
  )
}
