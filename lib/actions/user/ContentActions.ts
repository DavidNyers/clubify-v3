'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Submits a new comment on a review
 */
export async function submitComment(reviewId: string, text: string, targetType: string) {
  const user = await getUser()
  if (!user) throw new Error('You must be logged in to comment')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      review_id: reviewId,
      user_id: user.id,
      text: text,
      status: 'visible'
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/${targetType}s/[slug]`, 'page')
  return { success: true, data }
}

/**
 * Submits a report for a piece of content
 */
export async function submitReport(formData: {
  targetId: string,
  targetType: 'review' | 'comment' | 'club' | 'bar' | 'event' | 'user',
  reason: string,
  description?: string
}) {
  const user = await getUser()
  if (!user) throw new Error('You must be logged in to submit a report')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: formData.targetType,
      target_id: formData.targetId,
      reason: formData.reason,
      description: formData.description,
      status: 'open'
    })
    .select()
    .single()

  return { success: true, data }
}

/**
 * Toggles a like on a comment
 */
export async function toggleCommentLike(commentId: string) {
  const user = await getUser()
  if (!user) throw new Error('You must be logged in to like a comment')

  const supabase = await createClient()

  // 1. Check if already liked
  const { data: existingLike } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
    // Decrement counter
    await supabase.rpc('decrement_comment_likes', { cid: commentId })
  } else {
    // Like
    await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
    // Increment counter
    await supabase.rpc('increment_comment_likes', { cid: commentId })
  }

  return { success: true, liked: !existingLike }
}

/**
 * Updates an existing comment and pushes the old version to history
 */
export async function updateComment(commentId: string, newText: string) {
  const user = await getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const supabase = await createClient()

  // 1. Get current state
  const { data: current, error: fetchError } = await supabase
    .from('comments')
    .select('text, edit_history, user_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !current) throw new Error('Kommentar nicht gefunden')
  if (current.user_id !== user.id) throw new Error('Nicht autorisiert')

  // 2. Prepare history
  const historyEntry = {
    text: current.text,
    edited_at: new Date().toISOString()
  }
  const updatedHistory = [...(current.edit_history || []), historyEntry]

  // 3. Update
  const { error: updateError } = await supabase
    .from('comments')
    .update({
      text: newText,
      edit_history: updatedHistory
    })
    .eq('id', commentId)

  if (updateError) throw updateError

  return { success: true }
}
