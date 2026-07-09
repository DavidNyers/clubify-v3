'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface EventPayload {
  club_id: string
  name: string
  description?: string
  date: string
  doors_open?: string
  max_guests?: number
  ticket_price?: number
  currency?: string
  lineup?: string[]
  genre?: string[]
  status?: 'draft' | 'published' | 'cancelled'
}

/**
 * Creates a new event for a club.
 * Verifies that the current user owns the target club.
 */
export async function createEvent(payload: EventPayload) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht authentifiziert')

    // Verify club ownership
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('owner_id')
      .eq('id', payload.club_id)
      .single()

    if (clubError || !club) throw new Error('Club nicht gefunden')
    if (club.owner_id !== user.id) throw new Error('Nicht autorisiert: Du besitzt diesen Club nicht')

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...payload,
        manager_id: user.id, // Current owner is the manager by default
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/club-owner/events')
    revalidatePath('/dashboard/club-owner')
    return { success: true, data }
  } catch (error: any) {
    console.error('Create Event Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Updates an existing event.
 */
export async function updateEvent(eventId: string, payload: Partial<EventPayload>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht authentifiziert')

    // Verify event ownership (via manager_id or club ownership)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('manager_id, id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) throw new Error('Event nicht gefunden')
    if (event.manager_id !== user.id) throw new Error('Nicht autorisiert')

    const { error } = await supabase
      .from('events')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (error) throw error

    revalidatePath('/dashboard/club-owner/events')
    return { success: true }
  } catch (error: any) {
    console.error('Update Event Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes an event.
 */
export async function deleteEvent(eventId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht authentifiziert')

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('manager_id', user.id) // Security check

    if (error) throw error

    revalidatePath('/dashboard/club-owner/events')
    return { success: true }
  } catch (error: any) {
    console.error('Delete Event Error:', error)
    return { success: false, error: error.message }
  }
}
