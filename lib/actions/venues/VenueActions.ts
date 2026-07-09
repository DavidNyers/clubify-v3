'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VenueUpdatePayload {
  name?: string
  description?: string
  address?: string
  city?: string
  capacity?: number
  price_range?: number
  music_genres?: string[]
  status?: 'draft' | 'published' | 'closed'
}

/**
 * Updates a club or bar details. 
 * Checks ownership to ensure security.
 */
export async function updateVenue(venueId: string, type: 'clubs' | 'bars', payload: VenueUpdatePayload) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht authentifiziert')

    // Verify ownership
    const { data: venue, error: fetchError } = await supabase
      .from(type)
      .select('owner_id')
      .eq('id', venueId)
      .single()

    if (fetchError || !venue) throw new Error('Location nicht gefunden')
    if (venue.owner_id !== user.id) throw new Error('Nicht autorisiert: Du bist nicht der Besitzer dieser Location')

    // Update
    const { error: updateError } = await supabase
      .from(type)
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', venueId)

    if (updateError) throw updateError

    revalidatePath(`/dashboard/club-owner/clubs/${venueId}/edit`)
    revalidatePath(`/dashboard/club-owner`)
    return { success: true }
  } catch (error: any) {
    console.error(`Update ${type} Error:`, error)
    return { success: false, error: error.message }
  }
}
