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
      
      <main style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Die besten Events der Stadt
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Sichere dir Tickets für exklusive Partys, Konzerte und geheime Raves in deiner Nähe.
            </p>
          </div>

          {/* Search Input */}
          <Suspense fallback={<div style={{ height: 120, marginBottom: 40 }} />}>
            <SearchInput placeholder="Suche nach Events..." type="events" />
          </Suspense>

          {/* Grid */}
          {!events || events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Aktuell keine anstehenden Events gefunden.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
              {events.map(event => {
                const coverImage = event.images && event.images.length > 0 ? event.images[0] : FALLBACK_IMAGE
                const locationName = event.clubs?.name || event.bars?.name || 'Unbekannte Location'
                const locationCity = event.clubs?.city || event.bars?.city || ''
                const dateRaw = new Date(event.date)
                const dateFormatted = dateRaw.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })
                
                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.slug}`} 
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="hover-translate hover-border-violet" style={{ 
                      background: '#18181b', borderRadius: 24, overflow: 'hidden', 
                      border: '1px solid #27272a', transition: 'all 0.3s', cursor: 'pointer', height: '100%',
                      display: 'flex', flexDirection: 'column'
                    }}
                    >
                      
                      {/* Image Area */}
                      <div style={{ position: 'relative', height: 220, width: '100%' }}>
                        <Image src={coverImage} alt={event.name} fill style={{ objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', color: 'white', padding: '8px 12px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 800 }}>{dateRaw.toLocaleDateString('de-DE', { month: 'short' })}</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{dateRaw.getDate()}</span>
                        </div>
                        {event.featured && (
                          <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}>
                            FEATURED
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b 0%, transparent 60%)' }} />
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: 24, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>{event.name}</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a1a1aa', fontSize: '0.9rem', marginBottom: 16 }}>
                          <MapPin size={14} /> {locationName} {locationCity && <span style={{ color: '#52525b', margin: '0 4px' }}>•</span>} {locationCity}
                        </div>

                        {/* Genres / Infos */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', marginBottom: 20 }}>
                          {event.genre?.slice(0, 3).map((g: string) => (
                            <span key={g} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Ticket Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #27272a', paddingTop: 16, marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
                            <Ticket size={16} style={{ color: '#f59e0b' }} /> {event.ticket_price > 0 ? `${event.ticket_price} ${event.currency}` : 'Free Entry'}
                          </div>
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
