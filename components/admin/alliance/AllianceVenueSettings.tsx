'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Check, X, Zap, Info, ArrowRight } from 'lucide-react'
import { toggleAllianceParticipation, updateVenueBenefits } from '@/lib/actions/alliance/AllianceActions'

interface BenefitType {
  id: string
  name: string
  description: string
  base_points: number
  category: string
}

interface AllianceVenueSettingsProps {
  targetId: string
  targetType: 'club' | 'bar'
  initialSettings: {
    isActive: boolean
    benefitIds: string[]
  }
  allBenefitTypes: BenefitType[]
}

export default function AllianceVenueSettings({ 
  targetId, targetType, initialSettings, allBenefitTypes 
}: AllianceVenueSettingsProps) {
  const [isActive, setIsActive] = useState(initialSettings.isActive)
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(initialSettings.benefitIds)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleToggleActive = async () => {
    setIsSaving(true)
    const res = await toggleAllianceParticipation(targetId, targetType, !isActive)
    if (res.success) {
      setIsActive(!isActive)
      setMessage({ type: 'success', text: `Alliance wurde ${!isActive ? 'aktiviert' : 'deaktiviert'}.` })
    } else {
      setMessage({ type: 'error', text: 'Fehler beim Speichern.' })
    }
    setIsSaving(false)
  }

  const handleToggleBenefit = (id: string) => {
    setSelectedBenefits(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const handleSaveBenefits = async () => {
    setIsSaving(true)
    // Create objects with tier info
    const benefitsData = selectedBenefits.map(id => {
      const el = document.getElementById(`tier-select-${id}`) as HTMLSelectElement
      return { benefit_type_id: id, required_tier: parseInt(el?.value || '1', 10) }
    })
    
    // We'll update the action to accept this structure
    const res = await updateVenueBenefits(targetId, targetType, benefitsData as any)
    if (res.success) {
      setMessage({ type: 'success', text: 'Vorteile wurden aktualisiert.' })
    } else {
      setMessage({ type: 'error', text: 'Fehler beim Speichern der Vorteile.' })
    }
    setIsSaving(false)
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="glass" style={{ 
      background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.06)', 
      borderRadius: 24, padding: '32px', position: 'relative', overflow: 'hidden'
    }} id="alliance-settings">
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: '#8b5cf6', opacity: 0.05, filter: 'blur(40px)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Shield size={28} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', marginBottom: 2 }}>Clubify Alliance Partner</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Erhöhe deinen Umsatz durch exklusive Clubify Alliance Abonnenten.</p>
          </div>
        </div>
        
        <button 
          onClick={handleToggleActive}
          disabled={isSaving}
          style={{ 
            padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
            background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: isActive ? '#f87171' : '#22c55e',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
          className="hover-scale"
        >
          {isActive ? <X size={16} /> : <Check size={16} />}
          {isActive ? 'Mitgliedschaft beenden' : 'Jetzt Partner werden'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Angebotene Vorteile auswählen
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {allBenefitTypes.map(benefit => (
              <div 
                key={benefit.id}
                onClick={() => handleToggleBenefit(benefit.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                  borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedBenefits.includes(benefit.id) ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: selectedBenefits.includes(benefit.id) ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ 
                  width: 20, height: 20, borderRadius: 6, border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selectedBenefits.includes(benefit.id) ? '#8b5cf6' : 'transparent',
                  borderColor: selectedBenefits.includes(benefit.id) ? '#8b5cf6' : 'rgba(255,255,255,0.2)'
                }}>
                  {selectedBenefits.includes(benefit.id) && <Check size={14} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedBenefits.includes(benefit.id) ? 'white' : '#94a3b8' }}>{benefit.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{benefit.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Wert</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b' }}>{benefit.base_points} Pkt</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSaveBenefits}
            disabled={isSaving || !isActive}
            style={{ 
              marginTop: 24, width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: '#8b5cf6', color: 'white', fontWeight: 800, cursor: 'pointer',
              opacity: !isActive ? 0.5 : 1
            }}
            className="hover-scale"
          >
            Einstellungen speichern
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a78bfa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} /> Wie funktioniert es?
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: '80% Umsatz-Pool', text: '80% der Abo-Einnahmen fließen in einen Pool für alle Partner.' },
                { title: 'Punktesystem', text: 'Jeder eingelöste Vorteil bringt dir Punkte ein.' },
                { title: 'Auszahlung', text: 'Am Monatsende wird dein Anteil berechnet und überwiesen.' }
              ].map((item, i) => (
                <li key={i}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'white', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{item.text}</div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: 20, padding: '24px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', marginBottom: 8 }}>
              <Info size={16} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Echtzeit-Statistik</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 16 }}>Du hast in diesem Monat bereits durch Allianz-User gesammelt:</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>0 <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>PUNKTE</span></div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ 
          position: 'absolute', bottom: 20, right: 20, padding: '12px 20px', borderRadius: 12,
          background: message.type === 'success' ? '#065f46' : '#991b1b',
          color: 'white', fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
