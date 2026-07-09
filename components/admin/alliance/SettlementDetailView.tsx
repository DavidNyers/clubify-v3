'use client'

import React, { useState } from 'react'
import { Eye, X, Building2, Ticket, CreditCard, ChevronRight, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PayoutDetail {
  id: string
  target_id: string
  target_type: string
  points_redeemed: number
  amount_eur: number
}

export default function SettlementDetailView({ settlement }: { settlement: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [payouts, setPayouts] = useState<PayoutDetail[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadDetails = async () => {
    setLoading(true)
    setIsOpen(true)
    
    // In a real scenario, we'd fetch from alliance_venue_payouts table
    // For now, we'll fetch from alliance_redemptions and group them to show REAL data
    const { data } = await supabase
      .from('alliance_redemptions')
      .select('target_id, target_type, points_awarded')
      .gte('redeemed_at', settlement.month_start)
      .lte('redeemed_at', new Date(new Date(settlement.month_start).setMonth(new Date(settlement.month_start).getMonth() + 1)).toISOString())

    if (data) {
      const grouped: Record<string, PayoutDetail> = {}
      data.forEach(r => {
        const key = `${r.target_type}-${r.target_id}`
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            target_id: r.target_id,
            target_type: r.target_type,
            points_redeemed: 0,
            amount_eur: 0
          }
        }
        grouped[key].points_redeemed += r.points_awarded
      })

      // Convert to EUR based on settlement price_per_point
      Object.values(grouped).forEach(g => {
        g.amount_eur = g.points_redeemed * settlement.price_per_point
      })

      setPayouts(Object.values(grouped))
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={loadDetails}
        style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}
      >
        <Eye size={14} /> Details
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={() => setIsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
          
          <div className="glass" style={{ width: '100%', maxWidth: 700, maxHeight: '80vh', position: 'relative', background: '#0f172a', borderRadius: 32, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>Auszahlungs-Details</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{new Date(settlement.month_start).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })} • Pool: €{settlement.alliance_pool.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8 }}>Punktwert</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>€{settlement.price_per_point.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                </div>
                <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Auszahlungsschutz</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Shield size={18} /> Aktiviert
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} /> Partner Aufschlüsselung
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {payouts.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} style={{ color: '#94a3b8' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{p.target_type === 'club' ? 'Club Partner' : 'Bar Partner'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {p.target_id.slice(0,8)}...</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>€{p.amount_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.points_redeemed} Punkte</div>
                    </div>
                  </div>
                ))}
                
                {payouts.length === 0 && !loading && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Keine Payout-Details über diesen Zeitraum verfügbar.</div>
                )}
                {loading && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Details werden geladen...</div>
                )}
              </div>
            </div>

            <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gesamtauszahlung Summe</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>€{payouts.reduce((sum, p) => sum + p.amount_eur, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
