'use client'

import React, { useState } from 'react'
import { Gift, X, Shield, Star, Crown, Clock, CheckCircle2 } from 'lucide-react'
import { giftAllianceSubscription } from '@/lib/actions/admin/UserActions'

interface GiftAllianceModalProps {
  user: { id: string; full_name: string; email: string }
  onClose: () => void
  onSuccess: (userId: string, tier: string) => void
}

export default function GiftAllianceModal({ user, onClose, onSuccess }: GiftAllianceModalProps) {
  const [tier, setTier] = useState('explorer')
  const [months, setMonths] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGift = async () => {
    setIsSubmitting(true)
    const res = await giftAllianceSubscription(user.id, tier, months)
    if (res.success) {
      onSuccess(user.id, tier)
      onClose()
    } else {
      alert('Fehler: ' + res.error)
    }
    setIsSubmitting(false)
  }

  const tiers = [
    { id: 'explorer', label: 'Explorer', icon: Shield, color: '#a78bfa', desc: 'Basis-Vorteile' },
    { id: 'premium', label: 'Premium', icon: Star, color: '#ec4899', desc: 'Voller Zugang' },
    { id: 'elite', label: 'Elite', icon: Crown, color: '#fbbf24', desc: 'VIP Status' },
  ]

  const durations = [
    { value: 1, label: '1 Monat' },
    { value: 3, label: '3 Monate' },
    { value: 6, label: '6 Monate' },
    { value: 12, label: '1 Jahr' },
    { value: -1, label: 'Lifetime' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
      />
      
      {/* Modal */}
      <div className="glass shadow-2xl animate-scale-up" style={{ 
        position: 'relative', width: '100%', maxWidth: 480, background: 'rgba(15, 23, 42, 0.95)', 
        borderRadius: 32, border: '1px solid rgba(139, 92, 246, 0.3)', overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Gift size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 8 }}>Bündnis verschenken</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Aktiviere sofort eine Mitgliedschaft für <span style={{ color: 'white', fontWeight: 700 }}>{user.full_name}</span></p>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          
          {/* Tier Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Mitgliedschaftsstufe</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {tiers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 16, border: '1px solid',
                    transition: 'all 0.2s', cursor: 'pointer',
                    background: tier === t.id ? `${t.color}15` : 'rgba(255,255,255,0.03)',
                    borderColor: tier === t.id ? t.color : 'rgba(255,255,255,0.05)',
                    color: tier === t.id ? t.color : '#64748b'
                  }}
                >
                  <t.icon size={20} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Laufzeit</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {durations.map(d => (
                <button
                  key={d.value}
                  onClick={() => setMonths(d.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, border: '1px solid',
                    transition: 'all 0.2s', cursor: 'pointer',
                    background: months === d.value ? 'white' : 'transparent',
                    borderColor: months === d.value ? 'white' : 'rgba(255,255,255,0.1)',
                    color: months === d.value ? '#0f172a' : 'white'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={onClose}
              style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              Abbrechen
            </button>
            <button 
              onClick={handleGift}
              disabled={isSubmitting}
              style={{ 
                flex: 1.5, padding: '14px', borderRadius: 16, border: 'none', 
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                color: 'white', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Aktiviert...' : <><Gift size={18} /> Geschenk aktivieren</>}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
