import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EventForm from '../../EventForm'

interface EditEventPageProps {
  params: { id: string }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const user = await getUser()
  if (!user || user.role === 'user') redirect('/dashboard/user')

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) redirect('/dashboard/club-owner/events')

  // Security check: must be manager or club owner
  if (event.manager_id !== user.id) redirect('/dashboard/club-owner/events')

  // Get user's clubs for context
  const { data: clubs } = await supabase.from('clubs').select('id, name').eq('owner_id', user.id)
  const { data: bars } = await supabase.from('bars').select('id, name').eq('owner_id', user.id)
  
  const allVenues = [
    ...(clubs || []),
    ...(bars || [])
  ]

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
          Event bearbeiten
        </h1>
        <p style={{ color: '#64748b' }}>Ändere die Details für {event.name}.</p>
      </div>

      <EventForm venues={allVenues} event={event} mode="edit" />
    </div>
  )
}
