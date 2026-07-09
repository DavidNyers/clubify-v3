'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toggleFavorite, FavoriteType } from '@/lib/actions/user/FavoriteActions'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  targetId: string
  type: FavoriteType
  initialIsFavorited: boolean
}

export default function FavoriteButton({ targetId, type, initialIsFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update
    const previousState = isFavorited
    setIsFavorited(!previousState)

    startTransition(async () => {
      const res = await toggleFavorite(targetId, type)
      
      if (!res.success) {
        setIsFavorited(previousState)
        if (res.redirectToLogin) {
          router.push('/auth/login?next=' + window.location.pathname)
        } else {
          alert('Fehler beim Speichern des Favoriten')
        }
      }
    })
  }

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isPending}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        color: isFavorited ? '#f87171' : 'white',
        transition: 'color 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
      aria-label="Favorit umschalten"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorited ? 'filled' : 'empty'}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Heart 
            size={22} 
            fill={isFavorited ? '#f87171' : 'none'} 
            strokeWidth={isFavorited ? 0 : 2}
          />
        </motion.div>
      </AnimatePresence>
      
      {isPending && (
        <motion.div
          layoutId="loading"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%'
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.button>
  )
}
