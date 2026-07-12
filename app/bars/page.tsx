import { createClient, getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/Navbar'
import { MapPin, Star, GlassWater } from 'lucide-react'
import { Suspense } from 'react'
import SearchInput from '@/components/public/SearchInput'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800'

export const metadata = {
  title: 'Bars — Clubify'
}

export default async function BarsRootPage({ searchParams }: { searchParams: Promise<{ q?: string, price?: string, genre?: string, openToday?: string, happyHour?: string }> }) {
  const user = await getUser()
  const { q, price, genre, openToday, happyHour } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bars')
    .select(happyHour === 'true' ? '*, happy_hours!inner(*)' : '*, happy_hours(active, day_of_week)')
    .eq('status', 'published')

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  if (price) {
    query = query.eq('price_range', parseInt(price))
  }

  if (genre) {
    query = query.contains('drink_types', [genre])
  }

  if (openToday === 'true') {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    query = query.not(`opening_hours->${today}`, 'is', null)
  }

  if (happyHour === 'true') {
    query = query.eq('happy_hours.active', true)
  }

  // Fetch all published bars
  const { data: bars, error } = await query
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })

  return (
    <>
      <Navbar user={user} />
      
      <main className="listings-main" style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div className="listings-header">
            <h1 className="listings-title bars-color">
              Entdecke die besten Bars
            </h1>
            <p className="listings-desc">
              Von versteckten Speakeasys bis hin zu luxuriösen Rooftop-Bars. Finde die perfekten Drinks für deinen Abend.
            </p>
          </div>

          {/* Search Input */}
          <div className="listings-search-container">
            <Suspense fallback={<div style={{ height: 60 }} />}>
              <SearchInput placeholder="Suche nach Bars oder Städten..." type="bars" />
            </Suspense>
          </div>

          {/* Grid */}
          {!bars || bars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Bars gefunden.
            </div>
          ) : (
            <div className="listings-grid">
              {bars.map(bar => {
                const coverImage = bar.images && bar.images.length > 0 ? bar.images[0] : FALLBACK_IMAGE
                return (
                  <Link 
                    key={bar.id} 
                    href={`/bars/${bar.slug}`} 
                    className="listing-card-wrap"
                  >
                    <div className="listing-card hover-translate hover-border-violet">
                      
                      {/* Image Area */}
                      <div className="listing-card-img-wrap">
                        <Image src={coverImage} alt={bar.name} fill style={{ objectFit: 'cover' }} />
                        {bar.featured && (
                          <div className="listing-card-badge" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', zIndex: 10 }}>
                            FEATURED
                          </div>
                        )}
                        {(() => {
                          const today = new Date().getDay()
                          const currentHH = (bar.happy_hours as any[])?.find(hh => hh.active && hh.day_of_week.includes(today))
                          if (currentHH) {
                            return (
                              <div className="listing-card-badge" style={{ left: 'auto', right: 6, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', zIndex: 10 }}>
                                HH
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>

                      {/* Content Area */}
                      <div className="listing-card-content">
                        <div className="listing-card-title-row">
                          <h3 className="listing-card-title">{bar.name}</h3>
                          {bar.avg_rating > 0 && (
                            <div className="listing-card-rating">
                              <Star size={10} fill="#f59e0b" style={{ display: 'inline', marginTop: -2 }} /> {bar.avg_rating}
                            </div>
                          )}
                        </div>

                        <div className="listing-card-info-row">
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bar.city}</span>
                          {bar.price_range && <span style={{ color: '#52525b', margin: '0 2px' }}>•</span>}
                          {bar.price_range && <span style={{ color: '#10b981', fontWeight: 800 }}>{'€'.repeat(bar.price_range)}</span>}
                        </div>

                        {/* Drink Types */}
                        <div className="listing-card-tags">
                          {bar.drink_types?.slice(0, 2).map((type: string) => (
                            <span key={type} className="listing-card-tag bars-tag">
                              {type}
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
