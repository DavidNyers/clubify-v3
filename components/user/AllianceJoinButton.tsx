'use client'

import React, { useState } from 'react'
import { Shield, Zap, QrCode, Loader2 } from 'lucide-react'

interface AllianceJoinButtonProps {
  isSubscriber: boolean
  userName: string
  userId: string
  expirationDate?: string
  tier?: 'explorer' | 'premium' | 'elite'
}

export default function AllianceJoinButton({ 
  isSubscriber, userName, userId, expirationDate, tier = 'premium' 
}: AllianceJoinButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'alliance_subscription', tier: tier })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Fehler beim Starten des Checkouts')
      }
    } catch (err) {
      console.error(err)
      alert('Server-Fehler')
    }
    setLoading(false)
  }

  if (!isSubscriber) {
    return (
      <button 
        onClick={handleSubscribe}
        disabled={loading}
        className="btn btn-primary lg"
        style={{ 
          padding: '16px 40px', borderRadius: 16, fontSize: '1.1rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer'
        }}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
        Jetzt beitreten für 29,99€/mtl.
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Mitgliedschaft</div>
        <div style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
           <Shield size={14} /> Aktiv bis {expirationDate ? new Date(expirationDate).toLocaleDateString('de-DE') : '—'}
        </div>
      </div>
    </div>
  )
}
