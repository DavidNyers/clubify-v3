'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getVenueTables(venueId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venue_tables')
    .select('*, venue_zones(name)')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching tables:', error)
    return []
  }
  return data
}

export async function getVenueZones(venueId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venue_zones')
    .select('*')
    .eq('venue_id', venueId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching zones:', error)
    return []
  }
  return data
}

/**
 * Synchronizes the entire table map for a venue.
 * Handles upserts (create/update) and deletes in a batch.
 */
export async function syncVenueTables(
  venueId: string, 
  tablesToSave: any[], 
  deletedIds: string[]
) {
  const supabase = await createClient()
  
  // 1. Delete removed tables
  if (deletedIds.length > 0) {
    const { error: delError } = await supabase
      .from('venue_tables')
      .delete()
      .in('id', deletedIds)
    
    if (delError) {
      console.error('Error deleting tables in sync:', delError)
      return { success: false, error: delError }
    }
  }

  // 2. Upsert (Create/Update) remaining tables
  if (tablesToSave.length > 0) {
    // Ensure venue_id is set for everything
    const processedTables = tablesToSave.map(t => ({
      ...t,
      venue_id: venueId,
      // If it's a freshly generated UUID from client, Supabase upsert will insert it
    }))

    const { error: saveError } = await supabase
      .from('venue_tables')
      .upsert(processedTables, { onConflict: 'id' })

    if (saveError) {
      console.error('Error saving tables in sync:', saveError)
      return { success: false, error: saveError }
    }
  }

  revalidatePath('/dashboard/bar-owner')
  return { success: true }
}

// Old actions kept for compatibility if needed, but the UI should use syncVenueTables
export async function saveTableLayout(tables: any[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('venue_tables').upsert(tables)
  if (error) return { success: false, error }
  revalidatePath('/dashboard/bar-owner')
  return { success: true }
}

export async function deleteTable(tableId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('venue_tables').delete().eq('id', tableId)
  if (error) return { success: false, error }
  revalidatePath('/dashboard/bar-owner')
  return { success: true }
}

export async function syncVenueZones(
  venueId: string,
  zones: any[],
  deletedIds: string[]
) {
  const supabase = await createClient()

  if (deletedIds.length > 0) {
    const { error: delError } = await supabase
      .from('venue_zones')
      .delete()
      .in('id', deletedIds)
    if (delError) return { success: false, error: delError }
  }

  if (zones.length > 0) {
    const processedZones = zones.map(z => ({
      ...z,
      venue_id: venueId
    }))
    const { error: saveError } = await supabase
      .from('venue_zones')
      .upsert(processedZones, { onConflict: 'id' })
    if (saveError) return { success: false, error: saveError }
  }

  revalidatePath('/dashboard/bar-owner')
  return { success: true }
}

export async function updateVenueSettings(venueId: string, venueType: 'bar' | 'club', settings: { show_zones?: boolean }) {
  const supabase = await createClient()
  const table = venueType === 'bar' ? 'bars' : 'clubs'
  
  const { error } = await supabase
    .from(table)
    .update(settings)
    .eq('id', venueId)

  if (error) {
    console.error('Error updating venue settings:', error)
    return { success: false, error }
  }

  revalidatePath('/dashboard/bar-owner')
  return { success: true }
}
