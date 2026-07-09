'use client'

import React, { useState } from 'react'
import { 
  BarChart3, Settings2, History, LayoutDashboard, 
  ArrowRight, ShieldCheck, Zap, CreditCard, ChevronRight, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface AllianceDashboardTabsProps {
  settlementHistory: React.ReactNode
  benefitManagement: React.ReactNode
  partnerQuickView: React.ReactNode
  tierManagement: React.ReactNode
  currentPoints: number
}

export default function AllianceDashboardTabs({ 
  settlementHistory, 
  benefitManagement, 
  partnerQuickView,
  tierManagement,
  currentPoints
}: AllianceDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settlements' | 'config'>('overview')

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'settlements', label: 'Abrechnungen', icon: History },
    { id: 'config', label: 'Konfiguration', icon: Settings2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 2 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: '14px 14px 0 0',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === tab.id ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
              color: activeTab === tab.id ? '#a78bfa' : '#64748b',
              fontWeight: 700, fontSize: '0.9rem', position: 'relative'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeTab === tab.id && (
              <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#a78bfa', boxShadow: '0 0 10px rgba(167,139,250,0.5)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-container animate-fade-in">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Latest Settlement Card */}
              <div className="glass" style={{ padding: '32px', borderRadius: 32, background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(0,0,0,0))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(135deg, white 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>Aktueller Status</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Zusammenfassung der laufenden Periode</p>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Eingelöst (Monat)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{currentPoints.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Pkt</span></div>
                    <div style={{ fontSize: '0.6rem', color: '#22c55e', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={10} /> Live-Daten
                    </div>
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Auszahlung</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#a78bfa' }}>80.0<span style={{ fontSize: '0.8rem', fontWeight: 500 }}>%</span></div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 10 }}>Alliance Standard</div>
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Audit Status</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22c55e' }}>Gesichert</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 10 }}>Punkte verifiziert ✓</div>
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <button 
                    onClick={() => setActiveTab('settlements')}
                    style={{ background: 'transparent', border: 'none', color: '#a78bfa', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    Alle vergangenen Abrechnungen ansehen <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Actions / Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="glass" style={{ padding: '24px', borderRadius: 24, border: '1px solid rgba(167,139,250,0.1)' }}>
                  <Zap size={24} style={{ color: '#a78bfa', marginBottom: 16 }} />
                  <h4 style={{ color: 'white', fontWeight: 800, marginBottom: 8 }}>Benefit Library</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                    Verwalte die globalen Benefit-Vorlagen, die Partner für ihre Locations wählen können.
                  </p>
                </div>
                <Link href="/dashboard/admin/alliance/partners" style={{ textDecoration: 'none' }} className="hover-translate">
                  <div className="glass" style={{ padding: '24px', borderRadius: 24, border: '1px solid rgba(236,72,153,0.1)', height: '100%' }}>
                    <Settings2 size={24} style={{ color: '#ec4899', marginBottom: 16 }} />
                    <h4 style={{ color: 'white', fontWeight: 800, marginBottom: 8 }}>Partner Konfig</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                      Aktiviere Partner, setze Multiplikatoren und weise individuelle Benefits zu.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {partnerQuickView}
              {tierManagement}
            </div>
          </div>
        )}

        {/* SETTLEMENTS TAB */}
        {activeTab === 'settlements' && (
          <div className="animate-slide-up">
            {settlementHistory}
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
            <div>
              {benefitManagement}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="glass" style={{ padding: '32px', borderRadius: 28, background: 'rgba(255,225,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <h4 style={{ fontWeight: 800, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={18} /> Globaler Preis-Mix
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                  Die Alliance-Einnahmen generieren sich aus den drei Abo-Stufen. 80% dieser Einnahmen fließen direkt in den Auszahlungs-Pool.
                </p>
                {tierManagement}
                
                <Link href="/alliance" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', marginTop: 24 }}>
                   Landing Page ansehen <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
