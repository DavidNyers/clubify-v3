'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates the user's last known location and activity timestamp.
 * This is called from the client-side tracker.
 */
export async function updateUserLocation(lat: number, lng: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({
      last_lat: lat,
      last_lng: lng,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating user location:', error)
    return { success: false, error: error.message }
  }

  // No revalidatePath needed for background tracking usually, 
  // but if we have a live map open, it might help.
  return { success: true }
}

/**
 * Updates just the last active timestamp if location is not available.
 */
export async function updateLastActive() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('users')
    .update({
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  return { success: !error }
}
