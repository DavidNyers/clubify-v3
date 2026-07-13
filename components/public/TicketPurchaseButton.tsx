'use client'

import { useState } from 'react'
import { Ticket, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TicketPurchaseButtonProps {
  eventId: string
  ticketPrice: number
  currency: string
  isLoggedIn: boolean
}

export default function TicketPurchaseButton({
  eventId,
  ticketPrice,
  currency,
  isLoggedIn
}: TicketPurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      // Redirect to login page with callback URL
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: eventId,
          type: 'ticket',
          quantity: 1
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session')
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('Keine Checkout-URL empfangen')
      }
    } catch (err: any) {
      console.error('Ticket checkout error:', err)
      setError(err.message || 'Verbindung fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="sidebar-booking-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          border: 'none',
          background: loading ? '#4b5563' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          color: 'black',
          fontWeight: 900,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(245, 158, 11, 0.3)',
          transition: 'all 0.2s'
        }}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Ticket size={18} />
        )}
        {loading
          ? 'Weiterleitung zu Stripe...'
          : ticketPrice > 0
          ? `Tickets - ${ticketPrice} ${currency}`
          : 'Kostenloses Ticket sichern'}
      </button>
      
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  )
}
