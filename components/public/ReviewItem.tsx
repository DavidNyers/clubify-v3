'use client'

import { useState } from 'react'
import { Heart, MessageSquare, Flag, Trash2, Edit2, Check, X, History } from 'lucide-react'
import StarRating from './StarRating'
import { toggleReviewLike, deleteReview, updateReview } from '@/lib/actions/user/ReviewActions'
import ReportModal from './ReportModal'
import { motion, AnimatePresence } from 'framer-motion'
import CommentSection from './CommentSection'

interface ReviewItemProps {
  review: any
  currentUserId?: string
  targetType: string
}

export default function ReviewItem({ review, currentUserId, targetType }: ReviewItemProps) {
  const [likes, setLikes] = useState(review.likes || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const isAuthor = currentUserId === review.user_id

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editText, setEditText] = useState(review.text || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleLike = async () => {
    try {
      const result = await toggleReviewLike(review.id)
      setLikes((prev: number) => result.liked ? prev + 1 : prev - 1)
      setIsLiked(result.liked)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      await updateReview(review.id, editRating, editText)
      setIsEditing(false)
      // Locally update for immediate feedback (next revalidation will sync)
      review.rating = editRating
      review.text = editText
      if (!review.edit_history) review.edit_history = [{}] 
    } catch (err) {
      alert('Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  const hasHistory = review.edit_history && review.edit_history.length > 0

  return (
    <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.5)', border: '1px solid #27272a', borderRadius: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
            {review.user?.avatar_url ? <img src={review.user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : (review.user?.full_name?.[0] || 'U')}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{review.user?.full_name || 'Abenteurer'}</div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {new Date(review.created_at).toLocaleDateString('de-DE')}
              {hasHistory && <span style={{ color: '#8b5cf6', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 2 }}><History size={10} /> (bearbeitet)</span>}
            </div>
          </div>
        </div>
        
        {isEditing ? (
          <StarRating rating={editRating} setRating={setEditRating} interactive={true} size={18} />
        ) : (
          <StarRating rating={review.rating} setRating={() => {}} interactive={false} size={16} />
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        {isEditing ? (
          <textarea 
            value={editText}
            onChange={e => setEditText(e.target.value)}
            style={{ width: '100%', minHeight: 100, background: '#09090b', border: '1px solid #3f3f46', borderRadius: 12, padding: 12, color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
          />
        ) : (
          <p style={{ color: '#e4e4e7', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            {review.text}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              color: isLiked ? '#ef4444' : '#a1a1aa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}
          >
            <Heart size={18} fill={isLiked ? '#ef4444' : 'transparent'} />
            {likes}
          </motion.button>

          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', 
              border: '1px solid #27272a', padding: '6px 12px', borderRadius: 10,
              color: showComments ? '#fb923c' : '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 0.2s'
            }}
            className="hover-bg-elevated"
          >
            <MessageSquare size={16} />
            {review.comments?.length || 0} {review.comments?.length === 1 ? 'Antwort' : 'Antworten'}
            {showComments ? ' verbergen' : ' anzeigen'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={isSaving} onClick={() => setIsEditing(false)} style={{ background: '#27272a', border: 'none', color: '#f87171', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><X size={14} /> Abbrechen</button>
              <button disabled={isSaving} onClick={handleSaveEdit} style={{ background: '#22c55e20', border: 'none', color: '#22c55e', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isSaving ? <span className="animate-spin">⌛</span> : <Check size={14} />} 
                Speichern
              </button>
            </div>
          ) : (
            <>
              <ReportModal 
                targetId={review.id} 
                targetType="review" 
                trigger={
                  <button style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }} title="Melden">
                    <Flag size={16} />
                  </button>
                }
              />
              {isAuthor && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => setIsEditing(true)}
                    style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }} 
                    title="Bearbeiten"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => { if(confirm('Löschen?')) deleteReview(review.id) }}
                    style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer' }} 
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #27272a' }}>
              <CommentSection reviewId={review.id} comments={review.comments} targetType={targetType} currentUserId={currentUserId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
