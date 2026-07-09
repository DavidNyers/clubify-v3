import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EventForm from '../EventForm'

export default async function NewEventPage() {
  const user = await getUser()
  if (!user || user.role === 'user') redirect('/dashboard/user')

  const supabase = await createClient()

  // Get user's clubs to link the event to one
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('owner_id', user.id)

  const { data: bars } = await supabase
    .from('bars')
    .select('id, name')
    .eq('owner_id', user.id)

  const allVenues = [
    ...(clubs || []),
    ...(bars || [])
  ]

  if (allVenues.length === 0) {
    redirect('/dashboard/club-owner/clubs')
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <Link 
        href="/dashboard/club-owner/events" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} /> Zurück zur Liste
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Neues Event planen
        </h1>
        <p style={{ color: '#64748b' }}>Fülle die Details aus, um dein Event zu veröffentlichen.</p>
      </div>

      <EventForm venues={allVenues} />
    </div>
  )
}
