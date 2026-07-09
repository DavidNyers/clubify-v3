'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, Plus, Trash2, Check, Settings2, 
  TrendingUp, Star, Wine, Ticket, Info, X, AlertTriangle, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  getPartnerBenefitsExtended, 
  getAllianceBenefitTypes,
  upsertAlliancePartnerConfig
} from '@/lib/actions/alliance/AllianceActions'

interface Benefit {
  id: string
  benefit_type_id: string
  required_tier: number
  is_active: boolean
  benefit_types: {
    id: string
    name: string
    base_points: number
    category: string
  }
}

interface PartnerBenefitEditorProps {
  partner: {
    id: string
    name: string
    type: 'club' | 'bar' | 'event'
    isActive: boolean
    multiplier: number
  }
}

export default function PartnerBenefitEditor({ partner }: PartnerBenefitEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Local state for batch saving
  const [localActive, setLocalActive] = useState<Benefit[]>([])
  const [localTypes, setLocalTypes] = useState<any[]>([])
  const [localMultiplier, setLocalMultiplier] = useState(partner.multiplier)
  const [localIsActive, setLocalIsActive] = useState(partner.isActive)
  
  const [error, setError] = useState<string | null>(null)

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [benefits, types] = await Promise.all([
        getPartnerBenefitsExtended(partner.id, partner.type),
        getAllianceBenefitTypes()
      ])
      setLocalActive(benefits)
      setLocalTypes(types)
      setLocalMultiplier(partner.multiplier)
      setLocalIsActive(partner.isActive)
    } catch (err: any) {
      setError("Daten konnten nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadInitialData()
  }, [isOpen])

  // --- Handlers (Local Only) ---

  const handleToggleActive = () => {
    setLocalIsActive(!localIsActive)
  }

  const handleAddBenefit = (type: any) => {
    // Check if already in localActive
    if (localActive.some(b => b.benefit_type_id === type.id)) return

    const newBenefit: Benefit = {
      id: `temp-${Math.random()}`,
      benefit_type_id: type.id,
      required_tier: 1,
      is_active: true,
      benefit_types: type
    }
    setLocalActive([...localActive, newBenefit])
  }

  const handleDeleteBenefit = (id: string) => {
    setLocalActive(localActive.filter(b => b.id !== id))
  }

  const handleUpdateTier = (id: string, tier: number) => {
    setLocalActive(localActive.map(b => 
      b.id === id ? { ...b, required_tier: tier } : b
    ))
  }

  // --- Final Save ---

  const handleFinalSave = async () => {
    setSaving(true)
    setError(null)
    
    const res = await upsertAlliancePartnerConfig({
      targetId: partner.id,
      targetType: partner.type,
      isActive: localIsActive,
      multiplier: localMultiplier,
      benefits: localActive.map(b => ({
        benefit_type_id: b.benefit_type_id,
        required_tier: b.required_tier
      }))
    })

    if (res.success) {
      setIsOpen(false)
      // Optional: window.location.reload() or router.refresh() if needed, 
      // but revalidatePath should handle most cases.
    } else {
      setError(res.error)
    }
    setSaving(false)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-glass"
        style={{ padding: '8px 16px', borderRadius: 12, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <Settings2 size={14} /> Verwalten
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <div 
        onClick={() => !saving && setIsOpen(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
      />
      
      {/* Modal */}
      <div className="glass" style={{ 
        width: '100%', maxWidth: 800, maxHeight: '90vh', background: '#0f172a', 
        borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{partner.name}</h2>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#64748b', textTransform: 'uppercase' }}>
                {partner.type}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Batch-Konfiguration — Speichern erst beim Fertigstellen</p>
          </div>
          <button 
            disabled={saving}
            onClick={() => setIsOpen(false)}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ margin: '20px 40px 0', padding: '16px 24px', borderRadius: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 16, color: '#f87171' }}>
                <AlertTriangle size={18} />
                <div style={{ flex: 1, fontSize: '0.75rem' }}>{error}</div>
                <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ overflowY: 'auto', padding: '40px', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#a78bfa' }} /></div>
          ) : (
            <>
              {/* Settings Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 48 }}>
                <div className="glass" style={{ padding: '24px', borderRadius: 24, background: localIsActive ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)', border: `1px solid ${localIsActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'white', marginBottom: 4 }}>Alliance Teilnahme</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{localIsActive ? 'Aktiviert' : 'Deaktiviert (Beinhaltet keine Vorteile)'}</div>
                    </div>
                    <button onClick={handleToggleActive} className={`btn ${localIsActive ? 'btn-danger' : 'btn-success'}`} style={{ borderRadius: 14 }}>
                      {localIsActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </div>
                </div>

                <div className="glass" style={{ padding: '24px', borderRadius: 24, background: 'rgba(167, 139, 250, 0.03)', border: '1px solid rgba(167, 139, 250, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, color: 'white' }}>Punkte-Multiplier</div>
                    <div style={{ color: '#a78bfa', fontWeight: 900, fontSize: '1.2rem' }}>x{localMultiplier.toFixed(1)}</div>
                  </div>
                  <input type="range" min="0.5" max="3.0" step="0.1" value={localMultiplier} onChange={(e) => setLocalMultiplier(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#a78bfa' }} />
                </div>
              </div>

              {/* Active Benefits */}
              <div style={{ marginBottom: 48 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20 }}>Geplante Benefits ({localActive.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {localActive.map(b => (
                    <div key={b.id} className="glass" style={{ padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                        {b.benefit_types.category === 'drink' ? <Wine size={18} /> : <Ticket size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{b.benefit_types.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Basis {b.benefit_types.base_points} Pkt → <span style={{ color: '#a78bfa' }}>{Math.round(b.benefit_types.base_points * localMultiplier)} Pkt</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
                        {[1, 2, 3].map(t => (
                          <button key={t} onClick={() => handleUpdateTier(b.id, t)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 800, border: 'none', background: b.required_tier === t ? '#a78bfa' : 'transparent', color: b.required_tier === t ? 'white' : '#64748b' }}>
                            {t === 1 ? 'EXP' : t === 2 ? 'PRE' : 'ELI'}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => handleDeleteBenefit(b.id)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {localActive.length === 0 && <div style={{ padding: '32px', textAlign: 'center', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20 }}>Bisher keine Benefits für die Alliance geplant.</div>}
                </div>
              </div>

              {/* Add More */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20 }}>Weitere hinzufügen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {localTypes.filter(t => !localActive.some(la => la.benefit_type_id === t.id)).map(type => (
                    <button key={type.id} onClick={() => handleAddBenefit(type)} className="hover-translate" style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: 'white' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>{type.name}<Plus size={12} style={{ color: '#a78bfa' }} /></div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{type.base_points} Pkt</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: 16, background: 'rgba(0,0,0,0.2)' }}>
          <button disabled={saving} onClick={() => setIsOpen(false)} style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem', background: 'none', border: 'none' }}>Abbrechen</button>
          <button 
            disabled={saving || loading}
            onClick={handleFinalSave}
            className="btn btn-primary"
            style={{ borderRadius: 14, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {saving ? <><Loader2 className="animate-spin" size={18} /> Speichere...</> : 'Fertigstellen'}
          </button>
        </div>

      </div>
    </div>
  )
}
