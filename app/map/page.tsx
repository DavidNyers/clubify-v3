import { createClient, getUser } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import MapLoader from '@/components/public/MapLoader'

export const metadata = {
  title: 'Clubify Map — Entdecke Venues in deiner Nähe',
}

export default async function MapPage() {
  const user = await getUser()
  const supabase = await createClient()

  const [
    { data: clubs },
    { data: bars },
    { data: events }
  ] = await Promise.all([
    supabase.from('clubs').select('id, name, slug, address, lat, lng, capacity, price_range, avg_rating, music_genres, images').eq('status', 'published'),
    supabase.from('bars').select('id, name, slug, address, lat, lng, capacity, price_range, avg_rating, images').eq('status', 'published'),
    supabase.from('events').select('id, name, slug, date, club_id, images, clubs(lat, lng, address)').eq('status', 'published').gte('date', new Date().toISOString())
  ])

  return (
    <>
      <Navbar user={user} />
      <main className="map-main" style={{ paddingTop: 64, height: '100dvh', boxSizing: 'border-box', width: '100vw', overflow: 'hidden', position: 'relative' }}>
        <MapLoader 
          clubs={clubs ?? []} 
          bars={bars ?? []} 
          events={events ?? []} 
        />
      </main>
    </>
  )
}
