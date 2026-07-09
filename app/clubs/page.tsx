import { createClient, getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/Navbar'
import { MapPin, Star, Music } from 'lucide-react'
import { Suspense } from 'react'
import SearchInput from '@/components/public/SearchInput'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800'

export const metadata = {
  title: 'Clubs — Clubify'
}

export default async function ClubsRootPage({ searchParams }: { searchParams: Promise<{ q?: string, price?: string, genre?: string, openToday?: string }> }) {
  const user = await getUser()
  const { q, price, genre, openToday } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clubs')
    .select('*')
    .eq('status', 'published')

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  if (price) {
    query = query.eq('price_range', parseInt(price))
  }

  if (genre) {
    query = query.contains('music_genres', [genre])
  }

  if (openToday === 'true') {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    query = query.not(`opening_hours->${today}`, 'is', null)
  }

  // Fetch all published clubs with optional search filter
  const { data: clubs, error } = await query
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })

  return (
    <>
      <Navbar user={user} />
      
      <main style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, display: 'inline-block', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Entdecke die besten Clubs
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Finde deinen neuen Lieblingsclub. Egal ob Underground Techno oder edler Champagner-Club – wir haben die Top-Adressen der Stadt.
            </p>
          </div>

          {/* Search Input */}
          <Suspense fallback={<div style={{ height: 120, marginBottom: 40 }} />}>
            <SearchInput placeholder="Suche nach Clubs oder Städten..." type="clubs" />
          </Suspense>

          {/* Grid */}
          {!clubs || clubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Clubs gefunden.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
              {clubs.map(club => {
                const coverImage = club.images && club.images.length > 0 ? club.images[0] : FALLBACK_IMAGE
                return (
                  <Link 
                    key={club.id} 
                    href={`/clubs/${club.slug}`} 
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
                        <Image src={coverImage} alt={club.name} fill style={{ objectFit: 'cover' }} />
                        {club.featured && (
                          <div style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
                            FEATURED
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b 0%, transparent 60%)' }} />
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: 24, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>{club.name}</h3>
                          {club.avg_rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#27272a', padding: '4px 8px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                              <Star size={12} fill="#f59e0b" /> {club.avg_rating}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a1a1aa', fontSize: '0.9rem', marginBottom: 16 }}>
                          <MapPin size={14} /> {club.city} {club.price_range && <span style={{ color: '#52525b', margin: '0 4px' }}>•</span>} {club.price_range && <span style={{ color: '#10b981', fontWeight: 700 }}>{'€'.repeat(club.price_range)}</span>}
                        </div>

                        {/* Genres */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                          {club.music_genres?.slice(0, 3).map((genre: string) => (
                            <span key={genre} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                              {genre}
                            </span>
                          ))}
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
