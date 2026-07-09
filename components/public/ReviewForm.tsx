'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import { submitReview } from '@/lib/actions/user/ReviewActions'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'

interface ReviewFormProps {
  targetId: string
  targetType: 'club' | 'bar' | 'event'
  userName?: string
}

export default function ReviewForm({ targetId, targetType, userName }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setLoading(true)
    try {
      await submitReview({ targetId, targetType, rating, text })
      setSuccess(true)
      setText('')
      setRating(0)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))', borderRadius: 24, padding: 32 }}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ textAlign: 'center', padding: '20px 0' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Review gesendet!</h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Danke für dein Feedback, {userName || 'Abenteurer'}!</p>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Deine Erfahrung teilen</h3>
              <StarRating rating={rating} setRating={setRating} size={28} />
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Wie war es dort? Erzähl uns von deinem Abend..."
              style={{
                width: '100%', minHeight: 120, background: '#09090b', border: '1px solid #27272a',
                borderRadius: 20, padding: 20, color: 'white', fontSize: '1rem', outline: 'none', 
                resize: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#fb923c'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
            />

            <button
              disabled={rating === 0 || loading}
              className="hover-translate"
              style={{
                alignSelf: 'flex-end', padding: '14px 32px', borderRadius: 16, 
                background: 'linear-gradient(135deg, #fb923c, #f97316)',
                color: 'white', fontWeight: 800, fontSize: '0.9rem', border: 'none', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                opacity: (rating === 0 || loading) ? 0.5 : 1
              }}
            >
              <Send size={18} />
              {loading ? 'Wird gesendet...' : 'Review posten'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
