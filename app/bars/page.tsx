import { createClient, getUser } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import { Suspense } from 'react'
import SearchInput from '@/components/public/SearchInput'
import VenueListClient from '@/components/public/VenueListClient'

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

          {!bars || bars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Bars gefunden.
            </div>
          ) : (
            <VenueListClient venues={bars} type="bars" tagKey="drink_types" tagClass="bars-tag" />
          )}

        </div>
      </main>
    </>
  )
}
