'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@/lib/auth/rbac'

/**
 * Ensures the executing user is an admin.
 */
async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht authentifiziert')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Nicht autorisiert: Nur Admins können diese Aktion ausführen.')
  }
}

/**
 * Updates a user's role.
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    await ensureAdmin()
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
    revalidatePath('/dashboard/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Update Role Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Bans or unbans a user.
 */
export async function toggleUserBan(userId: string, isBanned: boolean, reason?: string) {
  try {
    await ensureAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({ 
        is_banned: isBanned, 
        banned_reason: isBanned ? (reason || 'Verstoß gegen die Richtlinien') : null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)

    if (error) throw error
    revalidatePath('/dashboard/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle Ban Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Manually creates a user through the Admin SDK.
 */
export async function adminCreateUser(payload: { email: string; fullName: string; role: UserRole; password?: string }) {
  try {
    await ensureAdmin()
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // 1. Create the Auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password || Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: { full_name: payload.fullName }
    })

    if (authError) throw authError

    // 2. The trigger normally handles public.users insertion, 
    // but we update the role and full_name explicitly to be sure.
    const { error: dbError } = await supabase
      .from('users')
      .update({ 
        full_name: payload.fullName,
        role: payload.role
      })
      .eq('id', authData.user.id)

    if (dbError) throw dbError

    revalidatePath('/dashboard/admin/users')
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error('Admin Create User Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Updates comprehensive user details from the admin detail page.
 */
export async function adminUpdateUserDetail(
  userId: string, 
  data: { 
    fullName?: string; 
    role?: UserRole; 
    phone?: string; 
    bio?: string;
    username?: string;
    gender?: string;
    dateOfBirth?: string;
  }
) {
  try {
    await ensureAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({
        full_name: data.fullName,
        role: data.role,
        phone: data.phone,
        bio: data.bio,
        username: data.username,
        gender: data.gender,
        date_of_birth: data.dateOfBirth || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/dashboard/admin/users')
    revalidatePath(`/dashboard/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Admin Update User Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetches users with pagination and optional search/role filters.
 */
export async function getUsers(page: number = 1, pageSize: number = 10, roleFilter?: string, searchTerm?: string) {
  try {
    const supabase = await createClient()
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
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
    console.error('Get Users Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Gifts an Alliance subscription to a user.
 */
export async function giftAllianceSubscription(userId: string, tier: string, months: number) {
  try {
    await ensureAdmin()
    const supabase = await createClient()

    // Calculate expiration date
    let expirationDate: Date | null = new Date()
    if (months === -1) { // Lifetime
      expirationDate = new Date('2099-12-31T23:59:59Z')
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + months)
    }

    const { error } = await supabase
      .from('users')
      .update({
        alliance_tier: tier,
        alliance_status: 'active',
        alliance_expiration: expirationDate.toISOString(),
        alliance_joined_at: new Date().toISOString(),
        is_alliance_gifted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/dashboard/admin/users')
    revalidatePath(`/dashboard/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Gift Subscription Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cancels or revokes an Alliance subscription for a user.
 */
export async function cancelAllianceSubscription(userId: string) {
  try {
    await ensureAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({
        alliance_tier: 'none',
        alliance_status: 'canceled',
        alliance_expiration: null,
        is_alliance_gifted: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/dashboard/admin/users')
    revalidatePath(`/dashboard/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Cancel Subscription Error:', error)
    return { success: false, error: error.message }
  }
}

