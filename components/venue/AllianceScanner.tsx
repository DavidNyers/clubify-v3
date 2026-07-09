'use client'

import React, { useState, useEffect } from 'react'
import { QrCode, Shield, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { redeemAllianceBenefit } from '@/lib/actions/alliance/AllianceActions'

interface AllianceScannerProps {
  venueId: string
  venueType: 'club' | 'bar'
  activeBenefits: any[]
}

export default function AllianceScanner({ venueId, venueType, activeBenefits }: AllianceScannerProps) {
  const [userIdInput, setUserIdInput] = useState('')
  const [selectedBenefit, setSelectedBenefit] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pointsAwarded, setPointsAwarded] = useState(0)

  const handleRedeem = async () => {
    if (!userIdInput || !selectedBenefit) return
    
    setStatus('loading')
    const res = await redeemAllianceBenefit(userIdInput, selectedBenefit, venueId, venueType)
    
    if (res.success) {
      setStatus('success')
      setPointsAwarded(res.points!)
      setUserIdInput('')
    } else {
      setStatus('error')
      setErrorMsg(res.error || 'Einlösung fehlgeschlagen')
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/dashboard/club-owner" style={{ color: '#94a3b8' }}><ArrowLeft size={20} /></Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Alliance Scanner</h1>
      </div>

      <div className="glass" style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <QrCode size={32} style={{ color: '#a78bfa' }} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Scanne die Member ID oder gib sie manuell ein.</p>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 800, color: 'white', marginBottom: 4 }}>Erfolgreich eingelöst!</div>
            <div style={{ color: '#22c55e', fontSize: '0.85rem' }}>Partner-Punkte erhalten: +{pointsAwarded}</div>
            <button onClick={() => setStatus('idle')} style={{ marginTop: 16, background: 'white', color: '#111827', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Nächster Gast</button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <AlertCircle size={40} color="#f87171" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 800, color: 'white', marginBottom: 4 }}>Abgelehnt</div>
            <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{errorMsg}</div>
            <button onClick={() => setStatus('idle')} style={{ marginTop: 16, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Erneut versuchen</button>
          </div>
        )}

        {status === 'idle' || status === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Member ID / User ID</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input 
                  type="text" 
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="ID eingeben..."
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Vorteil auswählen</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeBenefits.map((b) => (
                  <div 
                    key={b.id}
                    onClick={() => setSelectedBenefit(b.id)}
                    style={{ 
                      padding: '14px', borderRadius: 12, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedBenefit === b.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                      borderColor: selectedBenefit === b.id ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                      color: selectedBenefit === b.id ? 'white' : '#94a3b8'
                    }}
                  >
                    <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{b.benefit_types.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleRedeem}
              disabled={status === 'loading' || !userIdInput || !selectedBenefit}
              style={{ padding: '16px', borderRadius: 14, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {status === 'loading' ? <Loader2 className="animate-spin" /> : <Shield size={18} />}
              Vorteil jetzt entwerten
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
