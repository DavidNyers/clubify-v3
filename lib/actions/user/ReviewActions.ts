'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateReview(reviewId: string, newRating: number, newText: string) {
  const supabase = await createClient()

  // 1. Get current state of the review
  const { data: currentReview, error: fetchError } = await supabase
    .from('reviews')
    .select('rating, text, edit_history, user_id')
    .eq('id', reviewId)
    .single()

  if (fetchError || !currentReview) {
    throw new Error('Bewertung konnte nicht gefunden werden.')
  }

  // 2. Prepare the history entry
  const historyEntry = {
    rating: currentReview.rating,
    text: currentReview.text,
    edited_at: new Date().toISOString()
  }

  // 3. Append to history and update main fields
  const updatedHistory = [...(currentReview.edit_history || []), historyEntry]

  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      rating: newRating,
      text: newText,
      edit_history: updatedHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)

  if (updateError) {
    throw new Error(`Fehler beim Aktualisieren: ${updateError.message}`)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard/admin/content/reviews')
  
  return { success: true }
}

export async function deleteReview(reviewId: string) {
  const user = await getUser()
  if (!user) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/profile')
  revalidatePath('/clubs/[slug]', 'page')
  revalidatePath('/bars/[slug]', 'page')
  
  return { success: true }
}

export async function toggleReviewLike(reviewId: string) {
  const user = await getUser()
  if (!user) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  // Check if liked
  const { data: existingLike } = await supabase
    .from('review_likes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.id)
  } else {
    await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id })
  }

  revalidatePath('/clubs/[slug]', 'page')
  revalidatePath('/bars/[slug]', 'page')

  return { success: true, liked: !existingLike }
}

export async function getReviewStats(targetId: string, targetType: 'club' | 'bar' | 'event') {
  const supabase = await createClient()

  const column = targetType === 'club' ? 'club_id' : targetType === 'bar' ? 'bar_id' : 'event_id'
  
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq(column, targetId)
    .eq('status', 'visible')

  if (error) return { avgRating: 0, reviewCount: 0 }

  if (!reviews || reviews.length === 0) {
    return { avgRating: 0, reviewCount: 0 }
  }

  const reviewCount = reviews.length
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  const avgRating = parseFloat((sum / reviewCount).toFixed(1))

  return { avgRating, reviewCount }
}

export async function submitReview(data: {
  targetId: string,
  targetType: 'club' | 'bar' | 'event',
  rating: number,
  text: string
}) {
  const user = await getUser()
  if (!user) throw new Error('Nicht autorisiert')

  const supabase = await createClient()

  const insertData: any = {
    user_id: user.id,
    rating: data.rating,
    text: data.text,
    status: 'visible'
  }

  if (data.targetType === 'club') insertData.club_id = data.targetId
  else if (data.targetType === 'bar') insertData.bar_id = data.targetId
  else if (data.targetType === 'event') insertData.event_id = data.targetId

  const { error } = await supabase
    .from('reviews')
    .insert(insertData)

  if (error) throw error

  revalidatePath('/clubs/[slug]', 'page')
  revalidatePath('/bars/[slug]', 'page')
  revalidatePath('/events/[slug]', 'page')
  
  return { success: true }
}
