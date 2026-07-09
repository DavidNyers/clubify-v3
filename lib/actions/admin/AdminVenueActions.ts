'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Helper um Admin-Aktionen im Log zu speichern
 */
async function logAdminAction(
  supabase: any, 
  adminId: string, 
  targetId: string, 
  targetType: 'club' | 'bar' | 'event' | 'user', 
  action: string, 
  changes: any
) {
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    target_id: targetId,
    target_type: targetType,
    action: action,
    changes: changes
  })
}

/**
 * Helper um Adresse in Koordinaten (Lat/Lng) umzuwandeln via OpenStreetMap Nominatim
 */
async function geocodeAddress(address?: string, city?: string): Promise<{ lat: number, lng: number } | null> {
  if (!address && !city) return null;
  const query = encodeURIComponent(`${address || ''} ${city || ''}`.trim());
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ClubifyApp/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

/**
 * Update Club (Admin)
 */
export async function updateClubAdmin(clubId: string, data: any) {
  const user = await getUser()
  if (!user || user.role !== 'admin') throw new Error('Unbefugter Zugriff')

  const supabase = await createClient()

  // Hole alten Zustand fürs Logging
  const { data: oldData } = await supabase.from('clubs').select('*').eq('id', clubId).single()

  // Geocoding, falls Adresse oder Stadt sich ändert
  const updateData = { ...data }
  if ((updateData.address && updateData.address !== oldData.address) || 
      (updateData.city && updateData.city !== oldData.city)) {
    const coords = await geocodeAddress(updateData.address || oldData.address, updateData.city || oldData.city);
    if (coords) {
      updateData.lat = coords.lat;
      updateData.lng = coords.lng;
    }
  }

  const { error } = await supabase
    .from('clubs')
    .update(updateData)
    .eq('id', clubId)

  if (error) throw error

  await logAdminAction(supabase, user.id, clubId, 'club', 'updated_details', { old: oldData, new: updateData })
  
  revalidatePath('/dashboard/admin/venues')
  revalidatePath(`/dashboard/admin/venues/clubs/${clubId}`)
  return { success: true }
}

/**
 * Update Bar (Admin)
 */
export async function updateBarAdmin(barId: string, data: any) {
  const user = await getUser()
  if (!user || user.role !== 'admin') throw new Error('Unbefugter Zugriff')

  const supabase = await createClient()

  const { data: oldData } = await supabase.from('bars').select('*').eq('id', barId).single()

  // Geocoding
  const updateData = { ...data }
  if ((updateData.address && updateData.address !== oldData.address) || 
      (updateData.city && updateData.city !== oldData.city)) {
    const coords = await geocodeAddress(updateData.address || oldData.address, updateData.city || oldData.city);
    if (coords) {
      updateData.lat = coords.lat;
      updateData.lng = coords.lng;
    }
  }

  const { error } = await supabase
    .from('bars')
    .update(updateData)
    .eq('id', barId)

  if (error) throw error

  await logAdminAction(supabase, user.id, barId, 'bar', 'updated_details', { old: oldData, new: updateData })
  
  revalidatePath('/dashboard/admin/venues')
  revalidatePath(`/dashboard/admin/venues/bars/${barId}`)
  return { success: true }
}

/**
 * Update Event (Admin)
 */
export async function updateEventAdmin(eventId: string, data: any) {
  const user = await getUser()
  if (!user || user.role !== 'admin') throw new Error('Unbefugter Zugriff')

  const supabase = await createClient()

  const { data: oldData } = await supabase.from('events').select('*').eq('id', eventId).single()

  const { error } = await supabase
    .from('events')
    .update(data)
    .eq('id', eventId)

  if (error) throw error

  await logAdminAction(supabase, user.id, eventId, 'event', 'updated_details', { old: oldData, new: data })
  
  revalidatePath('/dashboard/admin/venues')
  revalidatePath(`/dashboard/admin/venues/events/${eventId}`)
  return { success: true }
}
