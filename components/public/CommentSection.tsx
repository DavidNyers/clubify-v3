'use client'

import { useState } from 'react'
import { submitComment, toggleCommentLike, updateComment } from '@/lib/actions/user/ContentActions'
import { Send, CornerDownRight, Heart, Flag, Edit2, Check, X, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReportModal from './ReportModal'

interface CommentSectionProps {
  reviewId: string
  comments: any[]
  targetType: string
  currentUserId?: string
}

export default function CommentSection({ reviewId, comments = [], targetType, currentUserId }: CommentSectionProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    try {
      await submitComment(reviewId, text, targetType)
      setText('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {/* Reply Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Antwort schreiben..."
          style={{
            flex: 1, background: '#09090b', border: '1px solid #27272a', borderRadius: 12,
            padding: '10px 16px', color: 'white', fontSize: '0.85rem', outline: 'none'
          }}
        />
        <button
          disabled={!text.trim() || loading}
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#fb923c', color: 'white',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!text.trim() || loading) ? 0.5 : 1
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

function CommentItem({ comment, currentUserId }: { comment: any; currentUserId?: string }) {
  const [likes, setLikes] = useState(comment.likes || 0)
  const [isLiked, setIsLiked] = useState(false)
  const isAuthor = currentUserId === comment.user_id

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [isSaving, setIsSaving] = useState(false)

  const handleLike = async () => {
    try {
      const result = await toggleCommentLike(comment.id)
      setLikes((prev: number) => result.liked ? prev + 1 : prev - 1)
      setIsLiked(result.liked)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      await updateComment(comment.id, editText)
      comment.text = editText // Local update
      if (!comment.edit_history) comment.edit_history = [{}]
      setIsEditing(false)
    } catch (err) {
      alert('Fehler beim Speichern des Kommentars')
    } finally {
      setIsSaving(false)
    }
  }

  const hasHistory = comment.edit_history && comment.edit_history.length > 0

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ paddingRight: 4, display: 'flex', alignItems: 'flex-start' }}>
        <CornerDownRight size={16} style={{ color: '#3f3f46', marginTop: 4 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{comment.user?.full_name || 'User'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{new Date(comment.created_at).toLocaleDateString('de-DE')}</span>
            {hasHistory && <span style={{ color: '#8b5cf6', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 2 }}><History size={10} /> (bearbeitet)</span>}
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <textarea 
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{ width: '100%', background: '#09090b', border: '1px solid #3f3f46', borderRadius: 10, padding: 8, color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> Abbrechen</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ background: 'transparent', border: 'none', color: '#22c55e', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={12} /> {isSaving ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5, marginBottom: 8 }}>
            {comment.text}
          </p>
        )}
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              color: isLiked ? '#ef4444' : '#52525b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
            }}
          >
            <Heart size={14} fill={isLiked ? '#ef4444' : 'transparent'} />
            {likes}
          </motion.button>

          <ReportModal 
            targetId={comment.id} 
            targetType="comment" 
            trigger={
              <button style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer' }}>
                <Flag size={14} />
              </button>
            }
          />
          
          {isAuthor && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
