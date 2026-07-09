'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/supabase/server'

export type ContentStatus = 'visible' | 'hidden' | 'flagged'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'

/**
 * Updates the visibility status of a review
 */
export async function updateReviewStatus(id: string, status: ContentStatus) {
  const user = await getUser()
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', id)

  if (error) throw error
  
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/admin/content/reviews')
  return { success: true }
}

/**
 * Updates the visibility status of a comment
 */
export async function updateCommentStatus(id: string, status: ContentStatus) {
  const user = await getUser()
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', id)

  if (error) throw error
  
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/admin/content/comments')
  return { success: true }
}

/**
 * Resolves or dismisses a report
 */
export async function resolveReport(id: string, status: ReportStatus) {
  const user = await getUser()
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reports')
    .update({ 
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
  
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/admin/content/reports')
  return { success: true }
}

/**
 * Simple action to hide content AND resolve report in one go
 */
export async function hideAndResolve(reportId: string, targetType: string, targetId: string) {
  const user = await getUser()
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // 1. Hide the content
  const table = targetType === 'review' ? 'reviews' : 
                targetType === 'comment' ? 'comments' : null
  
  if (table) {
    await supabase.from(table).update({ status: 'hidden' }).eq('id', targetId)
  }

  // 2. Resolve the report
  const { error } = await supabase
    .from('reports')
    .update({ 
      status: 'resolved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (error) throw error
  
  revalidatePath('/dashboard/admin/content')
  revalidatePath('/dashboard/admin/content/reports')
  return { success: true }
}
