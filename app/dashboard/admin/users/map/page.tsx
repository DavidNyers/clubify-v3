import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import UserMapClient from '@/components/admin/UserMapClient'

export const dynamic = 'force-dynamic'

export default async function AdminUserMapPage() {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/dashboard/user')

  const supabase = await createClient()

  // Fetch users who have location data
  const { data: usersData, error } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, last_lat, last_lng, last_active_at, role, username, last_location')
    .not('last_lat', 'is', null)
    .not('last_lng', 'is', null)
    .order('last_active_at', { ascending: false })

  if (error) {
    console.error('Error fetching user location data:', error)
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      {!mapboxToken && (
        <div style={{ padding: 20, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', margin: 20, borderRadius: 12 }}>
          <strong>Fehler:</strong> Kein Mapbox Token gefunden. Bitte NEXT_PUBLIC_MAPBOX_TOKEN in .env.local konfigurieren.
        </div>
      )}
      <UserMapClient initialUsers={usersData || []} mapboxToken={mapboxToken} />
    </div>
  )
}
