'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackPath: string
  label?: string
}

export default function BackButton({ fallbackPath, label = 'Zurück' }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there is history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackPath)
    }
  }

  return (
    <button
      onClick={handleBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: '#e2e8f0',
        textDecoration: 'none',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 20,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  )
}
