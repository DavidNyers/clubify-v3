'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * ORGANIZER ACTIONS
 */

export async function createTablePackage(clubId: string, data: any) {
  const user = await getUser()
  if (!user || !['club_owner', 'admin'].includes(user.role)) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  const { error } = await supabase
    .from('table_packages')
    .insert({
      club_id: clubId,
      name: data.name,
      description: data.description,
      price: data.price,
      min_guests: data.min_guests,
      max_guests: data.max_guests,
      items: data.items,
      status: 'active'
    })

  if (error) throw error
  revalidatePath('/dashboard/club-owner/tables')
  return { success: true }
}

export async function updateTablePackage(packageId: string, data: any) {
  const user = await getUser()
  if (!user) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  const { error } = await supabase
    .from('table_packages')
    .update({
      name: data.name,
      description: data.description,
      price: data.price,
      min_guests: data.min_guests,
      max_guests: data.max_guests,
      items: data.items,
      status: data.status
    })
    .eq('id', packageId)

  if (error) throw error
  revalidatePath('/dashboard/club-owner/tables')
  return { success: true }
}

export async function updateReservationStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'rejected') {
  const user = await getUser()
  if (!user) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)

  if (error) throw error

  // Notify user (Optional: integrate notification system)
  
  revalidatePath('/dashboard/club-owner/tables')
  return { success: true }
}

/**
 * USER ACTIONS
 */

export async function requestTableReservation(data: {
  clubId: string,
  packageId?: string,
  date: string,
  guests: number,
  notes?: string
}) {
  const user = await getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      club_id: data.clubId,
      package_id: data.packageId,
      reservation_date: data.date,
      guests: data.guests,
      notes: data.notes,
      booking_type: data.packageId ? 'vip' : 'table',
      status: 'pending'
    })

  if (error) throw error

  revalidatePath('/clubs/[slug]')
  return { success: true }
}
