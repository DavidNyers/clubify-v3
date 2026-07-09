'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface StarRatingProps {
  rating: number
  setRating: (rating: number) => void
  interactive?: boolean
  size?: number
}

export default function StarRating({ rating, setRating, interactive = true, size = 24 }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileHover={interactive ? { scale: 1.2 } : {}}
          whileTap={interactive ? { scale: 0.9 } : {}}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: interactive ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Star
            size={size}
            fill={(hover || rating) >= star ? '#f59e0b' : 'transparent'}
            stroke={(hover || rating) >= star ? '#f59e0b' : '#52525b'}
            style={{ transition: 'all 0.15s ease' }}
          />
        </motion.button>
      ))}
    </div>
  )
}
