'use client'

import React, { useState } from 'react'
import { Plus, Settings, X, Loader2, Save, Trash2, Ticket, Wine, Percent, Zap } from 'lucide-react'
import { upsertAllianceBenefitType, deleteAllianceBenefitType } from '@/lib/actions/alliance/AllianceActions'

interface BenefitType {
  id: string
  name: string
  description: string
  base_points: number
  category: string
}

export default function AllianceBenefitManager({ benefitTypes }: { benefitTypes: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<BenefitType | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_points: 10,
    category: 'other'
  })

  const openNew = () => {
    setEditingBenefit(null)
    setForm({ name: '', description: '', base_points: 10, category: 'other' })
    setIsModalOpen(true)
  }

  const openEdit = (benefit: BenefitType) => {
    setEditingBenefit(benefit)
    setForm({ 
      name: benefit.name, 
      description: benefit.description, 
      base_points: benefit.base_points, 
      category: benefit.category 
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const res = await upsertAllianceBenefitType({
      id: editingBenefit?.id,
      ...form
    })
    if (res.success) {
      setIsModalOpen(false)
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Benefit-Typ wirklich löschen?')) return
    setLoading(true)
    const res = await deleteAllianceBenefitType(id)
    if (!res.success) alert(res.error)
    setLoading(false)
  }

  return (
    <>
      <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderRadius: 24, border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>Globale Benefits</h3>
          <button 
            onClick={openNew}
            style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={14} /> Neu
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {benefitTypes.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }} className="hover-translate">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                  {b.category === 'entry' && <Ticket size={20} />}
                  {b.category === 'drink' && <Wine size={20} />}
                  {b.category === 'discount' && <Percent size={20} />}
                  {b.category === 'other' && <Zap size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Basis: <span style={{ color: 'white', fontWeight: 700 }}>{b.base_points} Pkt</span></div>
                </div>
                <button 
                  onClick={() => openEdit(b)}
                  style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Settings size={14} />
                </button>
              </div>
            ))}
          </div>
          {benefitTypes.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Keine Benefit-Typen definiert.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          <div className="glass" style={{ width: '100%', maxWidth: 460, position: 'relative', background: '#1e293b', borderRadius: 32, padding: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{editingBenefit ? 'Benefit bearbeiten' : 'Neuer Benefit'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Name</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="glass-input" 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Basispunkte</label>
                <input 
                  type="number" 
                  value={form.base_points}
                  onChange={e => setForm({...form, base_points: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Kategorie</label>
                <select 
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                >
                  <option value="entry">Eintritt</option>
                  <option value="drink">Drink</option>
                  <option value="discount">Rabatt</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Beschreibung</label>
                <textarea 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {editingBenefit && (
                  <button 
                    onClick={() => handleDelete(editingBenefit.id)}
                    style={{ padding: '14px', borderRadius: 14, border: '1px solid #f87171', background: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  disabled={loading || !form.name}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingBenefit ? 'Änderungen speichern' : 'Benefit erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
