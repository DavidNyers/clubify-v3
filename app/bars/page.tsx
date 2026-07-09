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
      
      <main style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, display: 'inline-block', background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Entdecke die besten Bars
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Von versteckten Speakeasys bis hin zu luxuriösen Rooftop-Bars. Finde die perfekten Drinks für deinen Abend.
            </p>
          </div>

          {/* Search Input */}
          <Suspense fallback={<div style={{ height: 120, marginBottom: 40 }} />}>
            <SearchInput placeholder="Suche nach Bars oder Städten..." type="bars" />
          </Suspense>

          {/* Grid */}
          {!bars || bars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Bars gefunden.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
              {bars.map(bar => {
                const coverImage = bar.images && bar.images.length > 0 ? bar.images[0] : FALLBACK_IMAGE
                return (
                  <Link 
                    key={bar.id} 
                    href={`/bars/${bar.slug}`} 
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
                        <Image src={coverImage} alt={bar.name} fill style={{ objectFit: 'cover' }} />
                        {bar.featured && (
                          <div style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', zIndex: 10 }}>
                            FEATURED
                          </div>
                        )}
                        {(() => {
                          const today = new Date().getDay()
                          const currentHH = (bar.happy_hours as any[])?.find(hh => hh.active && hh.day_of_week.includes(today))
                          if (currentHH) {
                            return (
                              <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', zIndex: 10 }}>
                                HAPPY HOUR
                              </div>
                            )
                          }
                          return null
                        })()}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b 0%, transparent 60%)' }} />
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: 24, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>{bar.name}</h3>
                          {bar.avg_rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#27272a', padding: '4px 8px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                              <Star size={12} fill="#f59e0b" /> {bar.avg_rating}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a1a1aa', fontSize: '0.9rem', marginBottom: 16 }}>
                          <MapPin size={14} /> {bar.city} {bar.price_range && <span style={{ color: '#52525b', margin: '0 4px' }}>•</span>} {bar.price_range && <span style={{ color: '#10b981', fontWeight: 700 }}>{'€'.repeat(bar.price_range)}</span>}
                        </div>

                        {/* Drink Types */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                          {bar.drink_types?.slice(0, 3).map((type: string) => (
                            <span key={type} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
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
