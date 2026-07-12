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
      
      <main className="listings-main" style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div className="listings-header">
            <h1 className="listings-title clubs-color">
              Entdecke die besten Clubs
            </h1>
            <p className="listings-desc">
              Finde deinen neuen Lieblingsclub. Egal ob Underground Techno oder edler Champagner-Club – wir haben die Top-Adressen der Stadt.
            </p>
          </div>

          {/* Search Input */}
          <div className="listings-search-container">
            <Suspense fallback={<div style={{ height: 60 }} />}>
              <SearchInput placeholder="Suche nach Clubs oder Städten..." type="clubs" />
            </Suspense>
          </div>

          {/* Grid */}
          {!clubs || clubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Clubs gefunden.
            </div>
          ) : (
            <div className="listings-grid">
              {clubs.map(club => {
                const coverImage = club.images && club.images.length > 0 ? club.images[0] : FALLBACK_IMAGE
                return (
                  <Link 
                    key={club.id} 
                    href={`/clubs/${club.slug}`} 
                    className="listing-card-wrap"
                  >
                    <div className="listing-card hover-translate hover-border-violet">
                      
                      {/* Image Area */}
                      <div className="listing-card-img-wrap">
                        <Image src={coverImage} alt={club.name} fill style={{ objectFit: 'cover' }} />
                        {club.featured && (
                          <div className="listing-card-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
                            FEATURED
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="listing-card-content">
                        <div className="listing-card-title-row">
                          <h3 className="listing-card-title">{club.name}</h3>
                          {club.avg_rating > 0 && (
                            <div className="listing-card-rating">
                              <Star size={10} fill="#f59e0b" style={{ display: 'inline', marginTop: -2 }} /> {club.avg_rating}
                            </div>
                          )}
                        </div>

                        <div className="listing-card-info-row">
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.city}</span>
                          {club.price_range && <span style={{ color: '#52525b', margin: '0 2px' }}>•</span>}
                          {club.price_range && <span style={{ color: '#10b981', fontWeight: 800 }}>{'€'.repeat(club.price_range)}</span>}
                        </div>

                        {/* Genres */}
                        <div className="listing-card-tags">
                          {club.music_genres?.slice(0, 2).map((genre: string) => (
                            <span key={genre} className="listing-card-tag clubs-tag">
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
