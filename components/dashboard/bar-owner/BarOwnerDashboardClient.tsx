'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Beer, Plus, Clock, Star, Shield, LayoutDashboard, 
  CalendarDays, Megaphone, MapPin, ChevronRight, 
  Settings, Users, Info
} from 'lucide-react'
import AllianceVenueSettings from '@/components/admin/alliance/AllianceVenueSettings'
import ReservationCommandCenter from '@/components/dashboard/reservations/ReservationCommandCenter'
import SimpleTableList from '@/components/dashboard/reservations/SimpleTableList'
import ReservationTimeline from '@/components/dashboard/reservations/ReservationTimeline'
import IntegrationManager from '@/components/dashboard/reservations/IntegrationManager'
import { useState } from 'react'

interface Props {
  bars: any[]
  happyHours: any[]
  allianceData: any
  benefitTypes: any
  initialTables: any[]
  reservations: any[]
}

export default function BarOwnerDashboardClient({ bars, happyHours, allianceData, benefitTypes, initialTables, reservations }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [subTab, setSubTab] = useState<'board' | 'timeline' | 'inventory' | 'integrations'>('board')
  
  // Sync state with URL parameter 'tab'
  const currentTab = searchParams.get('tab') || 'overview'
  const activeTab = ['overview', 'reservations', 'marketing'].includes(currentTab) 
    ? (currentTab as 'overview' | 'reservations' | 'marketing') 
    : 'overview'

  const firstBar = bars?.[0]

  return (
    <div className="dashboard-container">
      
      {/* ── HEADER ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {activeTab === 'overview' ? 'Dashboard Übersicht' : activeTab === 'reservations' ? 'Reservierungs-Zentrale' : 'Alliance Marketing'}
          </h1>
          <p className="dashboard-subtitle">
            {activeTab === 'overview' ? 'Dein Business auf einen Blick.' : activeTab === 'reservations' ? 'Anfragen verwalten und Tische zuweisen.' : 'Konfiguriere exklusive Vorteile für deine Bar.'}
          </p>
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
            {[
              { label: 'Aktive Bars', value: bars?.length ?? 0, icon: Beer, color: '#ec4899' },
              { label: 'Happy Hours', value: happyHours?.length ?? 0, icon: Clock, color: '#fbbf24' },
              { label: 'Besucher', value: bars?.reduce((a, b) => a + (b.view_count ?? 0), 0) ?? 0, icon: Star, color: '#22d3ee' },
              { label: 'Alliance Pool', value: allianceData ? 'Aktiv' : 'Inaktiv', icon: Shield, color: '#22c55e' },
            ].map((stat, i) => (
              <div key={i} className="glass" style={{ background: 'rgba(24,24,27,0.4)', borderRadius: 28, padding: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={24} style={{ color: stat.color }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stat.value}</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 40, alignItems: 'start' }}>
            <div className="glass" style={{ background: 'rgba(24,24,27,0.4)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Meine Venues</h3>
                <Link href="/dashboard/bar-owner/bars/new" style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>Venue hinzufügen</Link>
              </div>
              <div style={{ padding: 12 }}>
                {!bars?.length && <div style={{ padding: 60, textAlign: 'center', color: '#52525b' }}>Noch keine Venues registriert.</div>}
                {bars?.map(bar => (
                  <div key={bar.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 24, transition: 'background 0.2s' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🍻</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{bar.name}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px', borderRadius: 8, background: bar.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: bar.status === 'published' ? '#22c55e' : '#71717a', textTransform: 'uppercase' }}>{bar.status === 'published' ? 'Live' : 'Entwurf'}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#52525b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <MapPin size={14} /> {bar.city}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24' }}>★ {bar.avg_rating?.toFixed(1) ?? '—'}</div>
                      <Link href={`/dashboard/bar-owner/bars/${bar.id}/edit`} style={{ fontSize: '0.85rem', color: '#ec4899', textDecoration: 'none', fontWeight: 800 }}>Manage →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))', borderRadius: 32, padding: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                   Member Insights
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  Aktiviere Alliance Marketing, um Clubify Member gezielt in deine Bar zu lenken.
                </p>
                <Link href="/dashboard/bar-owner?tab=marketing" style={{ marginTop: 24, display: 'block', width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: 'white', color: '#09090b', fontWeight: 900, fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none' }}>Alliance Suite</Link>
              </div>

              <div className="glass" style={{ background: 'rgba(24,24,27,0.4)', borderRadius: 32, padding: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 20 }}>Nächste Happy Hours</h3>
                {happyHours?.slice(0, 3).map(hh => (
                  <div key={hh.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} color="#fbbf24" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{hh.start_time} - {hh.end_time}</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>-{hh.discount_percent}% auf alles</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESERVATIONS TAB ── */}
      {activeTab === 'reservations' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out', height: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Navigation Bar (Desktop top, Mobile bottom) */}
          <div className="navigation-shell">
              <div className="tab-bar-container">
              {[
                { id: 'board', label: 'Dashboard' },
                { id: 'timeline', label: 'Kalender' },
                { id: 'inventory', label: 'Tisch-Inventar' },
                { id: 'integrations', label: 'Integrationen' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setSubTab(tab.id as any)}
                  style={{ 
                    padding: '10px 24px', borderRadius: 12, border: 'none', 
                    background: subTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent', 
                    color: subTab === tab.id ? 'white' : '#52525b', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                >
                    {tab.label}
                </button>
              ))}
              </div>
          </div>

          {firstBar ? (
            <>
              {subTab === 'board' && (
                <ReservationCommandCenter 
                  venueId={firstBar.id}
                  venueType="bar"
                  tables={initialTables}
                  reservations={reservations}
                />
              )}
              {subTab === 'timeline' && (
                <ReservationTimeline 
                  venueId={firstBar.id}
                  venueName={firstBar.name}
                  tables={initialTables}
                  reservations={reservations}
                  openingHours={firstBar.opening_hours}
                />
              )}
              {subTab === 'inventory' && (
                <SimpleTableList 
                  venueId={firstBar.id}
                  venueType="bar"
                  initialTables={initialTables}
                />
              )}
              {subTab === 'integrations' && (
                <IntegrationManager 
                  venueId={firstBar.id}
                  venueSlug={firstBar.slug}
                  venueType="bar"
                  reservations={reservations}
                  initialShowZones={firstBar.show_zones}
                />
              )}
            </>
          ) : (
             <div className="glass" style={{ padding: 80, textAlign: 'center', borderRadius: 32, background: 'rgba(24,24,27,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Info size={48} style={{ color: '#3f3f46', marginBottom: 20 }} />
                <p style={{ color: '#71717a', fontSize: '1.2rem' }}>Bitte erstelle zuerst eine Bar, um Reservierungen zu verwalten.</p>
             </div>
          )}
        </div>
      )}

      {/* ── MARKETING TAB ── */}
      {activeTab === 'marketing' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="glass" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))', borderRadius: 40, padding: 48, border: '1px solid rgba(34,197,94,0.15)', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: 'full', background: 'rgba(34,197,94,0.2)', filter: 'blur(50px)' }} />
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(34,197,94,0.3)' }}>
                <Megaphone size={40} color="#22c55e" />
              </div>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>Alliance Suite</h2>
                <p style={{ color: '#71717a', fontSize: '1.1rem', marginTop: 4 }}>Konfiguriere exklusive Vorteile für Member.</p>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 1100, background: 'rgba(24,24,27,0.3)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', padding: 40 }}>
             {firstBar ? (
                <AllianceVenueSettings 
                  targetId={firstBar.id}
                  targetType="bar"
                  initialSettings={allianceData!}
                  allBenefitTypes={benefitTypes as any}
                />
             ) : (
                <div style={{ padding: 80, textAlign: 'center' }}>
                  <Info size={48} style={{ color: '#3f3f46', marginBottom: 20 }} />
                  <p style={{ color: '#71717a', fontSize: '1.1rem' }}>Venue registrieren, um Alliance Features zu nutzen.</p>
                </div>
             )}
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
            padding: 32px 40px;
            max-width: 1400px;
            margin: 0 auto;
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 48px;
            flex-wrap: wrap;
            gap: 24px;
        }
        .dashboard-title {
            font-size: 2.2rem;
            font-weight: 950;
            color: white;
            margin: 0;
            letter-spacing: -0.02em;
            text-transform: capitalize;
        }
        .dashboard-subtitle {
            color: #71717a;
            font-size: 1.05rem;
            margin-top: 6px;
        }
        .navigation-shell {
            margin-bottom: 32px;
        }
        .tab-bar-container {
            display: flex;
            background: rgba(24,24,27,0.4);
            padding: 6px;
            border-radius: 16px;
            width: fit-content;
            border: 1px solid rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glass {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        @media (max-width: 768px) {
            .dashboard-container {
                padding: 16px 16px 100px 16px;
            }
            .dashboard-header {
                margin-bottom: 24px;
            }
            .dashboard-title {
                font-size: 1.5rem;
            }
            .dashboard-subtitle {
                font-size: 0.9rem;
            }
            .navigation-shell {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(12, 12, 14, 0.95);
                backdrop-filter: blur(30px);
                border-top: 1px solid rgba(255,255,255,0.1);
                padding: 12px 16px;
                padding-bottom: env(safe-area-inset-bottom, 24px);
                z-index: 1000;
                margin-bottom: 0;
            }
            .tab-bar-container {
                width: 100%;
                background: transparent;
                border: none;
                padding: 0;
                justify-content: space-between;
                gap: 8px;
            }
            :global(.tab-bar-container button) {
                flex: 1;
                padding: 12px 4px !important;
                font-size: 0.65rem !important;
                flex-direction: column;
                gap: 4px;
                height: auto !important;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
      `}</style>
    </div>
  )
}
