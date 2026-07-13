import { createClient, getUser } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import { Suspense } from 'react'
import SearchInput from '@/components/public/SearchInput'
import VenueListClient from '@/components/public/VenueListClient'

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

          {!clubs || clubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Keine Clubs gefunden.
            </div>
          ) : (
            <VenueListClient venues={clubs} type="clubs" tagKey="music_genres" tagClass="clubs-tag" />
          )}

        </div>
      </main>
    </>
  )
}
