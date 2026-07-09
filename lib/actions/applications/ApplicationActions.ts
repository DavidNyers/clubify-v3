'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@/lib/auth/rbac'
import { sendApplicationStatusEmail } from '@/lib/mail/EmailLib'

export type ApplicationType = 'club' | 'bar' | 'organizer'

export interface ApplicationPayload {
  venueName: string
  venueType: ApplicationType
  websiteUrl?: string
  socialMediaUrl?: string
  address?: string
  city?: string
  capacityInfo?: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

/**
 * Submits a new partner application.
 */
export async function submitApplication(payload: ApplicationPayload) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Nicht authentifiziert')

    const { error } = await supabase
      .from('venue_applications')
      .insert({
        user_id: user.id,
        venue_name: payload.venueName,
        venue_type: payload.venueType,
        website_url: payload.websiteUrl,
        social_media_url: payload.socialMediaUrl,
        location_address: payload.address,
        location_city: payload.city,
        capacity_info: payload.capacityInfo,
        contact_name: payload.contactName,
        contact_email: payload.contactEmail,
        contact_phone: payload.contactPhone,
        status: 'pending'
      })

    if (error) throw error

    revalidatePath('/dashboard/admin/applications')
    return { success: true }
  } catch (error: any) {
    console.error('Submit Application Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Moderates an application (Approve/Reject) with verification logging.
 */
export async function moderateApplication(
  applicationId: string, 
  status: 'approved' | 'rejected', 
  notes?: string,
  checklist: any = {}
) {
  try {
    const supabase = await createClient()
    
    // Check if current user is admin
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) throw new Error('Nicht authentifiziert')
    
    const { data: adminProfile } = await supabase.from('users').select('role').eq('id', adminUser.id).single()
    if (adminProfile?.role !== 'admin') throw new Error('Nicht autorisiert')

    // 1. Get application details
    const { data: app, error: appError } = await supabase
      .from('venue_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError) throw appError

    // 2. Create Verification Log Entry
    const { error: logError } = await supabase
      .from('application_verification_logs')
      .insert({
        application_id: applicationId,
        admin_id: adminUser.id,
        checklist,
        notes,
        decision: status
      })

    if (logError) {
      console.warn('Logging error (non-fatal):', logError.message)
    }

    // 3. Update Application Status
    const { error: updateError } = await supabase
      .from('venue_applications')
      .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (updateError) throw updateError

    if (status === 'approved') {
      // 4. Promote User Role (SKIP if user is already an admin)
      const { data: targetUser } = await supabase.from('users').select('role').eq('id', app.user_id).single()
      
      if (targetUser?.role !== 'admin') {
        let targetRole: UserRole = 'club_owner'
        if (app.venue_type === 'bar') targetRole = 'bar_owner'
        if (app.venue_type === 'organizer') targetRole = 'event_manager'

        const { error: roleError } = await supabase
          .from('users')
          .update({ role: targetRole })
          .eq('id', app.user_id)

        if (roleError) throw roleError
      }

      // 5. Create Venue Stub
      if (app.venue_type === 'club' || app.venue_type === 'bar') {
        const tableName = app.venue_type === 'club' ? 'clubs' : 'bars'
        const slug = app.venue_name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

        const { error: venueError } = await supabase
          .from(tableName)
          .insert({
            owner_id: app.user_id,
            name: app.venue_name,
            slug: `${slug}-${Math.random().toString(36).slice(-4)}`,
            address: app.location_address,
            city: app.location_city,
            status: 'draft'
          })

        if (venueError) throw venueError
      }
    }

    // 6. Send Notification Email (Non-fatal if email fails)
    try {
      await sendApplicationStatusEmail({
        to: app.contact_email,
        venueName: app.venue_name,
        status,
        notes
      })
    } catch (mailErr) {
      console.warn('Notification email failed to send:', mailErr)
    }

    revalidatePath('/dashboard/admin/applications')
    revalidatePath(`/dashboard/admin/applications/${applicationId}`)
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (error: any) {
    console.error('Moderate Application Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetches a single application with its verification logs.
 * ROBUST: Separates main fetch from logs fetch to prevent crashes if table doesn't exist.
 */
export async function getApplication(id: string) {
  try {
    const supabase = await createClient()
    
    // 1. Fetch main application
    const { data: app, error } = await supabase
      .from('venue_applications')
      .select('*, users(full_name, email)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Fetch Application Error:', error.message)
      return { success: false, error: 'Bewerbung konnte nicht geladen werden.' }
    }

    // 2. Fetch logs (try-catch because table might not exist yet)
    let logs = []
    try {
      const { data: logData } = await supabase
        .from('application_verification_logs')
        .select('*, admin:users(full_name)')
        .eq('application_id', id)
        .order('created_at', { ascending: false })
      
      if (logData) logs = logData
    } catch (e) {
      console.warn('Logging table might be missing:', e)
    }

    return { success: true, data: { ...app, application_verification_logs: logs } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Fetches applications for the admin view with server-side pagination.
 */
export async function getApplications(statusFilter?: string, page: number = 1, pageSize: number = 10) {
  try {
    const supabase = await createClient()
    
    // Calculate range
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('venue_applications')
      .select('*, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    
    return { 
      success: true, 
      data,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page
    }
  } catch (error: any) {
    console.error('Get Applications Error:', error)
    return { success: false, error: error.message }
  }
}
