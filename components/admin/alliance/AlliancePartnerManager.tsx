'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  Building2, Wine, Zap, Search, Filter, 
  MapPin, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import PartnerBenefitEditor from './PartnerBenefitEditor'

interface Partner {
  id: string
  name: string
  type: 'club' | 'bar' | 'event'
  city?: string
  date?: string
  status: string
  isActive: boolean
  multiplier: number
}

interface AlliancePartnerManagerProps {
  initialPartners: Partner[]
}

export default function AlliancePartnerManager({ initialPartners }: AlliancePartnerManagerProps) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as 'club' | 'bar' | 'event'
  
  const [activeTab, setActiveTab] = useState<'club' | 'bar' | 'event'>(initialTab || 'club')
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && (tab === 'club' || tab === 'bar' || tab === 'event')) {
      setActiveTab(tab as any)
    }
  }, [searchParams])
  const filteredPartners = useMemo(() => {
    return initialPartners.filter(p => {
      const matchesTab = p.type === activeTab
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filterActive === null || p.isActive === filterActive
      return matchesTab && matchesSearch && matchesFilter
    })
  }, [initialPartners, activeTab, search, filterActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Search & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'club', label: 'Clubs', icon: Building2 },
            { id: 'bar', label: 'Bars', icon: Wine },
            { id: 'event', label: 'Events', icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === tab.id ? '#a78bfa' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontWeight: 700, fontSize: '0.9rem'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Partner suchen..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem'
              }} 
            />
          </div>
          <select 
            onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'active')}
            style={{ padding: '0 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="all">Alle Status</option>
            <option value="active">Nur Aktive</option>
            <option value="inactive">Nur Inaktive</option>
          </select>
        </div>
      </div>

      {/* Partners List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        {filteredPartners.map(partner => (
          <div key={partner.id} className="glass hover-translate" style={{ 
            padding: '24px', borderRadius: 24, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, background: partner.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: partner.isActive ? '#22c55e' : '#64748b' 
                }}>
                  {partner.type === 'club' && <Building2 size={24} />}
                  {partner.type === 'bar' && <Wine size={24} />}
                  {partner.type === 'event' && <Zap size={24} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem', marginBottom: 4 }}>{partner.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748b' }}>
                    <MapPin size={12} /> {partner.city || 'Event-Datum: ' + new Date(partner.date || '').toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ 
                padding: '6px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                background: partner.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: partner.isActive ? '#22c55e' : '#f87171'
              }}>
                {partner.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Multiplier: <span style={{ color: '#a78bfa', fontWeight: 800 }}>x{partner.multiplier.toFixed(1)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {partner.isActive ? (
                  <><CheckCircle2 size={14} style={{ color: '#22c55e' }} /> <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>Abrechnung aktiv</span></>
                ) : (
                  <><AlertCircle size={14} style={{ color: '#64748b' }} /> <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Pausiert</span></>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <PartnerBenefitEditor partner={partner} />
            </div>
          </div>
        ))}

        {filteredPartners.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 32, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 700 }}>Keine Partner gefunden</div>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>Versuche es mit einem anderen Suchbegriff oder Filter.</p>
          </div>
        )}
      </div>

    </div>
  )
}
