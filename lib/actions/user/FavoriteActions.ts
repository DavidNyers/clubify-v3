'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FavoriteType = 'club' | 'bar' | 'event'

/**
 * Toggles a favorite entry for a specific target.
 * Returns the new state (isFavorited).
 */
export async function toggleFavorite(targetId: string, type: FavoriteType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Unauthorized', redirectToLogin: true }
    }

    const column = type === 'club' ? 'club_id' : type === 'bar' ? 'bar_id' : 'event_id'
    
    // Check if exists
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq(column, targetId)
      .single()

    if (existing) {
      // Remove
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id)
      
      if (error) throw error
      
      revalidatePath('/', 'layout') 
      return { success: true, isFavorited: false }
    } else {
      // Add
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          [column]: targetId
        })
      
      if (error) throw error
      
      revalidatePath('/', 'layout')
      return { success: true, isFavorited: true }
    }
  } catch (error: any) {
    console.error('Toggle Favorite Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Checks if a specific target is favorited by the current user.
 */
export async function isFavorited(targetId: string, type: FavoriteType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const column = type === 'club' ? 'club_id' : type === 'bar' ? 'bar_id' : 'event_id'
    
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq(column, targetId)
      .single()

    return !!data
  } catch (error) {
    return false
  }
}
