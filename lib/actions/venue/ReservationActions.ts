'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Internal helper to find the best available table for a reservation.
 */
export async function findBestTable(venueId: string, date: string, time: string, duration: number, guests: number) {
    const supabase = await createClient()
    console.log(`findBestTable DIAGNOSTIC: venueId=${venueId}, date=${date}, time=${time}, guests=${guests}`)

    // 0. Resolve venueId if it's a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(venueId)
    let searchVenueId = venueId
    if (!isUUID) {
        // Try bars first
        const { data: bars } = await supabase.from('bars').select('id').eq('slug', venueId)
        if (bars && bars.length > 0) {
            searchVenueId = bars[0].id
            console.log(`findBestTable: Resolved SLUG "${venueId}" -> UUID "${searchVenueId}" from bars`)
        } else {
            // Try clubs
            const { data: clubs } = await supabase.from('clubs').select('id').eq('slug', venueId)
            if (clubs && clubs.length > 0) {
                searchVenueId = clubs[0].id
                console.log(`findBestTable: Resolved SLUG "${venueId}" -> UUID "${searchVenueId}" from clubs`)
            } else {
                console.error(`findBestTable ERROR: Could not resolve slug "${venueId}" in bars OR clubs. Using slug as fallback id.`)
            }
        }
    } else {
        console.log(`findBestTable: venueId "${venueId}" is already a UUID.`)
    }

    // 1. Get all active tables that can fit the group
    const { data: tables, error: tableError } = await supabase
        .from('venue_tables')
        .select('id, capacity')
        .eq('venue_id', searchVenueId)
        .eq('is_active', true)
        .gte('capacity', guests)
        .order('capacity', { ascending: true })

    if (tableError || !tables?.length) {
        console.log(`findBestTable: No suitable tables found for venue ${searchVenueId} with capacity >= ${guests}`)
        return null
    }

    // 2. Get overlapping reservations for this date
    // Note: To be 100% correct, we should also check reservations from the previous night 
    // that might overlap into the first hour of today, but for 20:00 slots this is rarely an issue.
    const { data: existing, error: reserveError } = await supabase
        .from('reservations')
        .select('table_id, reserved_time, duration_minutes')
        .eq('venue_id', searchVenueId)
        .eq('reserved_date', date)
        .in('status', ['confirmed', 'seated', 'pending']) // Include pending to avoid overbooking
        .is('table_id', 'not.null' as any)

    if (reserveError) {
        console.error(`findBestTable ERROR: Fetching reservations failed:`, reserveError.message)
        return null
    }

    console.log(`findBestTable: Found ${tables.length} tables and ${existing?.length || 0} existing reservations to check.`)

    // Helper to convert "HH:mm:ss" or "HH:mm" to minutes from midnight
    const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }

    const reqStart = toMin(time)
    const reqEnd = reqStart + duration

    const occupiedTableIds = new Set(
        (existing || [])
            .filter(res => {
                const resStart = toMin(res.reserved_time)
                const resEnd = resStart + (res.duration_minutes || 120)
                // Overlap: Start1 < End2 AND End1 > Start2
                return reqStart < resEnd && reqEnd > resStart
            })
            .map(res => res.table_id)
    )

    // 3. Find the first table that isn't occupied
    const bestTable = tables.find(t => !occupiedTableIds.has(t.id))
    
    if (!bestTable) {
        console.log(`findBestTable: ALL ${tables.length} suitable tables are blocked for ${time} (Guests: ${guests})`)
    } else {
        console.log(`findBestTable: Found available table: ${bestTable.id}`)
    }

    return bestTable?.id || null
}

/**
 * Public action to check if any tables are available for a given slot.
 */
export async function checkAvailability(venueId: string, date: string, time: string, guests: number) {
    // Basic validation to prevent NaN or invalid data
    if (!venueId || !date || !time || !guests) return { available: false }

    const tableId = await findBestTable(venueId, date, time, 120, guests)
    return { available: !!tableId }
}

/**
 * Confirms a pending reservation and optionally assigns a table.
 */
export async function confirmReservation(reservationId: string, tableId?: string, duration?: number) {
    const supabase = await createClient()
    
    // Fetch reservation details to run auto-assign if tableId is missing
    const { data: res } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

    let finalTableId = tableId

    if (!finalTableId && res) {
        finalTableId = await findBestTable(
            res.venue_id, 
            res.reserved_date, 
            res.reserved_time, 
            duration || res.duration_minutes || 120,
            res.guest_count
        )
    }
    
    const { data, error } = await supabase
        .from('reservations')
        .update({ 
            status: 'confirmed', 
            table_id: finalTableId || null,
            duration_minutes: duration || 120
        })
        .eq('id', reservationId)
        .select()

    if (error) {
        console.error('Error confirming reservation:', error)
        return { success: false, error }
    }

    revalidatePath('/dashboard/reservations')
    return { success: true, data }
}

/**
 * Rejects a reservation.
 */
export async function cancelReservation(reservationId: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)

    if (error) return { success: false, error }
    revalidatePath('/dashboard/reservations')
    return { success: true }
}

/**
 * Marks a guest as arrived and seats them at a table.
 */
export async function seatGuest(reservationId: string, tableId: string, duration?: number) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('reservations')
        .update({ 
            status: 'seated',
            table_id: tableId,
            duration_minutes: duration || 120
        })
        .eq('id', reservationId)

    if (error) return { success: false, error }
    revalidatePath('/dashboard/reservations')
    return { success: true }
}

/**
 * Completes a reservation (guest leaves).
 */
export async function completeReservation(reservationId: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId)

    if (error) return { success: false, error }
    revalidatePath('/dashboard/reservations')
    return { success: true }
}

/**
 * Creates a walk-in reservation directly.
 */
export async function createWalkIn(venueId: string, venueType: string, tableId: string, guestCount: number, duration?: number) {
    const supabase = await createClient()
    
    // Manually format time to avoid locale-specific weirdness in DB
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const timeStr = `${hh}:${mm}:${ss}`

    const { data, error } = await supabase
        .from('reservations')
        .insert([{
            venue_id: venueId,
            venue_type: venueType,
            table_id: tableId,
            guest_count: guestCount,
            status: 'seated',
            source: 'walk-in',
            duration_minutes: duration || 120,
            reserved_date: new Date().toISOString().split('T')[0],
            reserved_time: timeStr,
            contact_name: 'Walk-In'
        }])
        .select()

    if (error) {
        console.error('SERVER: createWalkIn error Details:', JSON.stringify(error, null, 2))
        return { success: false, error: error.message || 'Database error occurred' }
    }
    revalidatePath('/dashboard/reservations')
    return { success: true, data }
}

/**
 * Fetches reservations for a specific date and venue.
 */
export async function getReservationsByDate(venueId: string, reservedDate: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('venue_id', venueId)
        .eq('reserved_date', reservedDate)
        .order('reserved_time', { ascending: true })

    if (error) {
        console.error('Error fetching reservations for date:', error)
        return { success: false, error }
    }

    return { success: true, data }
}
/**
 * Public action for guests to request a reservation.
 */
export async function requestPublicReservation(data: {
    venueId: string,
    venueType: 'bar' | 'club',
    date: string,
    time: string,
    guests: number,
    name: string,
    email?: string,
    phone?: string,
    notes?: string,
    source?: string,
    isWaitlist?: boolean
}) {
    console.log('SERVER: requestPublicReservation Payload:', data)
    const supabase = await createClient()

    const duration = Math.min(Math.max(data.isWaitlist ? 0 : 30, 120), 480) // 2h default, max 8h
    
    // Resolve venueId to UUID for consistent DB storage
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.venueId)
    let finalVenueId = data.venueId
    if (!isUUID) {
        const { data: v } = await supabase.from('venues').select('id').eq('slug', data.venueId).single()
        if (v) finalVenueId = v.id
    }
    
    // Get user id if logged in
    const { data: { user } } = await supabase.auth.getUser()

    const { data: res, error } = await supabase
        .from('reservations')
        .insert([{
            venue_id: finalVenueId,
            venue_type: data.venueType,
            user_id: user?.id || null,
            reserved_date: data.date,
            reserved_time: data.time,
            guest_count: data.guests,
            contact_name: data.name,
            contact_email: data.email,
            contact_phone: data.phone,
            notes: data.notes,
            status: 'pending', // Public requests always start as pending for owner approval
            is_waitlist: data.isWaitlist || false,
            source: data.source || 'app',
            duration_minutes: duration
        }])
        .select()

    if (error) {
        console.error('Error requesting reservation:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/reserve/${data.venueId}`) // Future proof
    revalidatePath('/dashboard/reservations')
    
    return { success: true, data: res[0] }
}

/**
 * Reschedules or moves a reservation to a different time/table.
 */
export async function rescheduleReservation(data: {
    id: string,
    reserved_date: string,
    reserved_time: string,
    table_id?: string,
    duration_minutes?: number
}) {
    const supabase = await createClient()
    
    // Convert duration to number to be safe
    const finalDuration = data.duration_minutes ? Number(data.duration_minutes) : 120

    const { error } = await supabase
        .from('reservations')
        .update({
            reserved_date: data.reserved_date,
            reserved_time: data.reserved_time,
            table_id: data.table_id || null,
            duration_minutes: finalDuration
        })
        .eq('id', data.id)

    if (error) {
        console.error('SERVER: rescheduleReservation Error:', error)
        return { success: false, error: error.message }
    }
    
    revalidatePath('/dashboard/reservations')
    return { success: true }
}
