import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import VenueEditForm from './VenueEditForm'

interface EditVenuePageProps {
  params: { id: string }
}

export default async function EditVenuePage({ params }: EditVenuePageProps) {
  const user = await getUser()
  if (!user || !['club_owner', 'bar_owner', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()

  // Try to find in clubs first, then bars
  const { data: club } = await supabase.from('clubs').select('*').eq('id', params.id).single()
  const { data: bar } = !club ? await supabase.from('bars').select('*').eq('id', params.id).single() : { data: null }

  const venue = club || bar
  if (!venue) redirect('/dashboard/club-owner/clubs')

  // Security check: must be owner
  if (venue.owner_id !== user.id && user.role !== 'admin') {
    redirect('/dashboard/club-owner/clubs')
  }

  const type = club ? 'clubs' : 'bars'

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link 
        href="/dashboard/club-owner/clubs" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} /> Zurück zur Liste
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
          {venue.name} bearbeiten
        </h1>
        <p style={{ color: '#64748b' }}>Aktualisiere die Informationen deiner {type === 'clubs' ? 'Diskothek' : 'Bar'}.</p>
      </div>

      <VenueEditForm venue={venue} type={type} />
    </div>
  )
}
