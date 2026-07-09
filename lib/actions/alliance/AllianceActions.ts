'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggles Alliance participation for a venue.
 */
export async function toggleAllianceParticipation(targetId: string, targetType: 'club' | 'bar', active: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht authentifiziert')

    // Upsert settings
    const { error } = await supabase
      .from('alliance_venue_settings')
      .upsert({
        target_id: targetId,
        target_type: targetType,
        is_alliance_active: active,
        updated_at: new Date().toISOString()
      }, { onConflict: 'target_type,target_id' })

    if (error) throw error
revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle Alliance Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Updates the benefits offered by a venue.
 */
export async function updateVenueBenefits(targetId: string, targetType: 'club' | 'bar', benefitTypeIds: string[]) {
  try {
    const supabase = await createClient()
    
    // 1. Remove old benefits (simplest sync approach)
    await supabase
      .from('alliance_venue_benefits')
      .delete()
      .eq('target_id', targetId)
      .eq('target_type', targetType)

    // 2. Insert new selections
    if (benefitTypeIds.length > 0) {
      const inserts = benefitTypeIds.map(id => ({
        target_id: targetId,
        target_type: targetType,
        benefit_type_id: id,
        is_active: true
      }))

      console.log('Attempting to insert benefits:', inserts)
      const { error } = await supabase
        .from('alliance_venue_benefits')
        .insert(inserts)

      if (error) {
        console.error('Supabase Insert Error:', error)
        throw error
      }
    }

    revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    console.error('Update Benefits Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetches all available benefit types.
 */
export async function getAllianceBenefitTypes() {
  const supabase = await createClient()
  const { data } = await supabase.from('alliance_benefit_types').select('*').order('base_points', { ascending: true })
  return data || []
}

/**
 * Fetches venue specific alliance settings.
 */
export async function getVenueAllianceSettings(targetId: string, targetType: 'club' | 'bar') {
  const supabase = await createClient()
  
  const [
    { data: settings },
    { data: activeBenefits }
  ] = await Promise.all([
    supabase.from('alliance_venue_settings').select('*').eq('target_id', targetId).eq('target_type', targetType).single(),
    supabase.from('alliance_venue_benefits').select('benefit_type_id').eq('target_id', targetId).eq('target_type', targetType)
  ])

  return {
    isActive: settings?.is_alliance_active || false,
    benefitIds: activeBenefits?.map(b => b.benefit_type_id) || []
  }
}

/**
 * Redeems a benefit for a user (called by Scanner).
 */
export async function redeemAllianceBenefit(userId: string, benefitId: string, targetId: string, targetType: 'club' | 'bar') {
  try {
    const supabase = await createClient()
    const { data: { user: staffUser } } = await supabase.auth.getUser()
    if (!staffUser) throw new Error('Nicht authentifiziert')

    // 1. Verify User has active subscription
    const { data: userProfile } = await supabase.from('users').select('alliance_status, alliance_tier, alliance_expiration').eq('id', userId).single()
    if (userProfile?.alliance_status !== 'active') throw new Error('Kein aktives Alliance-Abonnement')
    if (userProfile.alliance_expiration && new Date(userProfile.alliance_expiration) < new Date()) throw new Error('Abonnement abgelaufen')
    
    // 2. Tier Verification Logic
    const tierMap: Record<string, number> = { 'none': 0, 'explorer': 1, 'premium': 2, 'elite': 3 }
    const userTierLevel = tierMap[userProfile.alliance_tier || 'none'] || 0

    // 3. Load benefit details including required_tier AND venue settings
    const { data: benefit } = await supabase
      .from('alliance_venue_benefits')
      .select('*, benefit_types(base_points)')
      .eq('id', benefitId)
      .single()
    
    if (!benefit) throw new Error('Vorteil nicht gefunden')
    if (userTierLevel < (benefit.required_tier || 1)) {
      throw new Error(`Dieser Vorteil erfordert das ${benefit.required_tier === 3 ? 'Elite' : 'Premium'} Paket.`)
    }

    // 3.5 Get multiplier
    const { data: settings } = await supabase
      .from('alliance_venue_settings')
      .select('custom_point_multiplier')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single()

    const multiplier = settings?.custom_point_multiplier || 1.0
    const pointsToAward = Math.round(benefit.benefit_types.base_points * multiplier)

    // 4. Log Redemption
    const { error } = await supabase
      .from('alliance_redemptions')
      .insert({
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        benefit_id: benefitId,
        points_awarded: pointsToAward
      })

    if (error) throw error

    revalidatePath('/dashboard/[role]')
    return { success: true, points: pointsToAward }
  } catch (error: any) {
    console.error('Redeem Benefit Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculates the monthly settlement (The 80/20 logic).
 * Usually called by a Cron job at the start of a new month.
 * 
 * @param totalRevenue - The total generated revenue for the period. 
 * IMPORTANT: This must EXCLUDE gifted/free subscriptions as they do not contribute to the pool.
 */
export async function generateMonthlySettlement(monthStart: string, totalRevenue: number) {
  try {
    const supabase = await createClient()
    
    // 1. Calculate shares
    const alliancePool = totalRevenue * 0.80
    const clubifyShare = totalRevenue * 0.20

    // 2. Count total points redeemed this month
    const { data: redemptions } = await supabase
      .from('alliance_redemptions')
      .select('points_awarded')
      .gte('redeemed_at', monthStart)
    
    const totalPoints = redemptions?.reduce((acc, r) => acc + r.points_awarded, 0) || 0
    const pricePerPoint = totalPoints > 0 ? alliancePool / totalPoints : 0

    // 3. Create Settlement Record
    const { data: settlement, error } = await supabase
      .from('alliance_monthly_settlements')
      .insert({
        month_start: monthStart,
        total_revenue: totalRevenue,
        alliance_pool: alliancePool,
        clubify_share: clubifyShare,
        total_points_redeemed: totalPoints,
        price_per_point: pricePerPoint,
        status: 'calculated'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, settlement }
  } catch (error: any) {
    console.error('Settlement Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Creates or updates a global benefit type (Admin only).
 */
export async function upsertAllianceBenefitType(data: { id?: string, name: string, description: string, base_points: number, category: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.role !== 'admin') throw new Error('Nicht autorisiert')

    const { error } = await supabase
      .from('alliance_benefit_types')
      .upsert({
        id: data.id || undefined,
        name: data.name,
        description: data.description,
        base_points: data.base_points,
        category: data.category,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    revalidatePath('/dashboard/admin/alliance')
    return { success: true }
  } catch (error: any) {
    console.error('Upsert Benefit Type Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes a global benefit type.
 */
export async function deleteAllianceBenefitType(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.role !== 'admin') throw new Error('Nicht autorisiert')

    const { error } = await supabase
      .from('alliance_benefit_types')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/admin/alliance')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
/**
 * Fetches unified partner directory.
 */
export async function getPartnerDirectory() {
  const supabase = await createClient()

  // Parallel fetch of all potential partners
  const [
    { data: clubs },
    { data: bars },
    { data: events },
    { data: settings }
  ] = await Promise.all([
    supabase.from('clubs').select('id, name, city, status'),
    supabase.from('bars').select('id, name, city, status'),
    supabase.from('events').select('id, name, date, status, club_id, bar_id'),
    supabase.from('alliance_venue_settings').select('*')
  ])

  const partners = [
    ...(clubs || []).map(c => ({ ...c, type: 'club' as const })),
    ...(bars || []).map(b => ({ ...b, type: 'bar' as const })),
    ...(events || []).map(e => ({ ...e, type: 'event' as const }))
  ]

  // Merge with settings
  return partners.map(p => {
    const s = settings?.find(set => set.target_id === p.id && set.target_type === p.type)
    return {
      ...p,
      isActive: s?.is_alliance_active || false,
      multiplier: s?.custom_point_multiplier || 1.0
    }
  })
}

/**
 * Updates multiplier only.
 */
export async function updatePartnerMultiplier(targetId: string, targetType: string, multiplier: number) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('alliance_venue_settings')
      .upsert({
        target_id: targetId,
        target_type: targetType,
        custom_point_multiplier: multiplier,
        updated_at: new Date().toISOString()
      }, { onConflict: 'target_type,target_id' })

    if (error) throw error
    revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Advanced benefit upsert for a venue.
 */
export async function upsertVenueBenefit(data: { 
  id?: string, 
  target_id: string, 
  target_type: string, 
  benefit_type_id: string, 
  required_tier: number,
  is_active: boolean
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    if (!user || user.role !== 'admin') throw new Error('Nicht autorisiert')

    const { data: existingRecords } = await supabase
      .from('alliance_venue_benefits')
      .select('id')
      .eq('target_id', data.target_id)
      .eq('target_type', data.target_type)
      .eq('benefit_type_id', data.benefit_type_id)
      .limit(1)

    const existing = existingRecords?.[0]

    let error;
    if (existing && existing.id) {
      // 2a. Update existing record
      const { error: updateError } = await supabase
        .from('alliance_venue_benefits')
        .update({
          required_tier: data.required_tier,
          is_active: data.is_active
        })
        .eq('id', existing.id)
      error = updateError
    } else {
      // 2b. Insert new record
      const { error: insertError } = await supabase
        .from('alliance_venue_benefits')
        .insert({
          target_id: data.target_id,
          target_type: data.target_type,
          benefit_type_id: data.benefit_type_id,
          required_tier: data.required_tier,
          is_active: data.is_active
        })
      error = insertError
    }

    if (error) throw error
    revalidatePath('/dashboard/admin/alliance')
    revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    console.error('Upsert Venue Benefit Debug Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      data
    })
    return { 
      success: false, 
      error: `DB-Fehler: ${error.message}${error.code ? ` (${error.code})` : ''}. Bitte Screenshots der Browser-Konsole senden.` 
    }
  }
}

/**
 * Deletes a venue benefit.
 */
export async function deleteVenueBenefit(id: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    if (!user || user.role !== 'admin') throw new Error('Nicht autorisiert')

    const { error } = await supabase.from('alliance_venue_benefits').delete().eq('id', id)
    if (error) throw error
    
    revalidatePath('/dashboard/admin/alliance')
    revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    console.error('Delete Venue Benefit Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Batch saves the entire alliance configuration for a partner.
 * Synchronizes settings (active, multiplier) and benefits.
 */
export async function upsertAlliancePartnerConfig(data: {
  targetId: string,
  targetType: string,
  isActive: boolean,
  multiplier: number,
  benefits: Array<{ benefit_type_id: string, required_tier: number }>
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    if (!user || user.role !== 'admin') throw new Error('Nicht autorisiert')

    // 1. Sync Settings (Active Status & Multiplier)
    const { error: settingsError } = await supabase
      .from('alliance_venue_settings')
      .upsert({
        target_id: data.targetId,
        target_type: data.targetType,
        is_alliance_active: data.isActive,
        custom_point_multiplier: data.multiplier,
        updated_at: new Date().toISOString()
      }, { onConflict: 'target_type,target_id' })

    if (settingsError) throw settingsError

    // 2. Sync Benefits
    // First, remove existing benefits to ensure a clean sync (Bypass for connectivity issue)
    const { error: deleteError } = await supabase
      .from('alliance_venue_benefits')
      .delete()
      .eq('target_id', data.targetId)
      .eq('target_type', data.targetType)

    if (deleteError) throw deleteError

    // Then, insert new list
    if (data.benefits.length > 0) {
      const inserts = data.benefits.map(b => ({
        target_id: data.targetId,
        target_type: data.targetType,
        benefit_type_id: b.benefit_type_id,
        required_tier: b.required_tier,
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('alliance_venue_benefits')
        .insert(inserts)
      
      if (insertError) throw insertError
    }

    revalidatePath('/dashboard/admin/alliance')
    revalidatePath('/dashboard/admin/alliance/partners')
    return { success: true }
  } catch (error: any) {
    console.error('Batch Save Alliance Config Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Detailed fetch of active benefits for a partner.
 */
export async function getPartnerBenefitsExtended(targetId: string, targetType: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('alliance_venue_benefits')
      .select('*, benefit_types:alliance_benefit_types(*)') // Explicitly naming the relationship if needed
      .eq('target_id', targetId)
      .eq('target_type', targetType)
    
    if (error) {
       console.error('getPartnerBenefitsExtended Error:', error)
       return []
    }
    return data || []
  } catch (err) {
    console.error('getPartnerBenefitsExtended Panic:', err)
    return []
  }
}
