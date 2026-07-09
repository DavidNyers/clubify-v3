'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function respondToVenueRequest(eventId: string, status: 'approved' | 'rejected') {
  const user = await getUser()
  if (!user || (user.role !== 'club_owner' && user.role !== 'bar_owner')) {
    throw new Error('Unbefugter Zugriff - Nur Location-Besitzer dürfen Anfragen bestätigen.')
  }

  const supabase = await createClient()

  // 1. Hole Event und finde heraus, auf welchen Club/Bar es sich bezieht
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('club_id, bar_id')
    .eq('id', eventId)
    .single()

  if (eventErr || !event) throw new Error('Event nicht gefunden.')

  // 2. Sicherheits-Check: Gehört der referenzierte Club/Bar wirklich dem aktuellen User?
  if (event.club_id) {
    const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', event.club_id).single()
    if (!club || club.owner_id !== user.id) throw new Error('Nicht dein Club.')
  } else if (event.bar_id) {
    const { data: bar } = await supabase.from('bars').select('owner_id').eq('id', event.bar_id).single()
    if (!bar || bar.owner_id !== user.id) throw new Error('Nicht deine Bar.')
  } else {
    throw new Error('Event ist nicht an eine Plattform-Location gebunden.')
  }

  // 3. Status updaten
  const { error } = await supabase
    .from('events')
    .update({ venue_verification_status: status })
    .eq('id', eventId)

  if (error) throw error

  // Path invalidation to refresh dashboard and public lists
  revalidatePath('/dashboard/club-owner/event-requests')
  revalidatePath('/dashboard/bar-owner/event-requests')
  
  if (event.club_id) {
    const { data: cData } = await supabase.from('clubs').select('slug').eq('id', event.club_id).single()
    if (cData) revalidatePath(`/clubs/${cData.slug}`)
  } else if (event.bar_id) {
    const { data: bData } = await supabase.from('bars').select('slug').eq('id', event.bar_id).single()
    if (bData) revalidatePath(`/bars/${bData.slug}`)
  }
  
  return { success: true }
}
