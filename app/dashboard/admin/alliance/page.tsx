import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, Zap, Users, CreditCard, TrendingUp, 
  Settings, RefreshCw, Plus, Building2, ChevronRight, CheckCircle2,
  PieChart, ArrowRight, Wallet
} from 'lucide-react'
import { getAllianceBenefitTypes } from '@/lib/actions/alliance/AllianceActions'
import AllianceBenefitManager from '@/components/admin/alliance/AllianceBenefitManager'
import SettlementDetailView from '@/components/admin/alliance/SettlementDetailView'
import AllianceDashboardTabs from '@/components/admin/alliance/AllianceDashboardTabs'

export const dynamic = 'force-dynamic'

export default async function AdminAlliancePage() {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/dashboard/user')

  const supabase = await createClient()

  const [
    { data: settlements },
    { data: venues },
    { count: explorerCount },
    { count: premiumCount },
    { count: eliteCount },
    { data: activeRedemptions },
    benefitTypesRaw
  ] = await Promise.all([
    supabase.from('alliance_monthly_settlements').select('*').order('month_start', { ascending: false }),
    supabase.from('alliance_venue_settings').select('*'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'explorer').eq('is_alliance_gifted', false),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'premium').eq('is_alliance_gifted', false),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('alliance_status', 'active').eq('alliance_tier', 'elite').eq('is_alliance_gifted', false),
    supabase.from('alliance_redemptions').select('points_awarded').gte('redeemed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    getAllianceBenefitTypes()
  ])

  // Get total active subscribers for display (including gifted)
  const { count: totalSubscribers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('alliance_status', 'active')

  const currentMonthPoints = activeRedemptions?.reduce((acc, r) => acc + r.points_awarded, 0) || 0
 
  // Calculate LIVE Pool (80% of current paid active subscriptions)
  const revenue = 
    ((explorerCount || 0) * 9.99) + 
    ((premiumCount || 0) * 29.99) + 
    ((eliteCount || 0) * 59.99)
  
  const livePool = revenue * 0.80

  // De-duplicate benefit types by name if DB cleanup hasn't run yet
  const benefitTypes = Array.from(new Map(benefitTypesRaw.map((item: any) => [item.name, item])).values())

  const activeSettlement = settlements?.[0]

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 8 }}>Alliance Management</h1>
          <p style={{ color: '#64748b' }}>Globale Steuerung der Clubify Alliance & Umsatzbeteiligung.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12 }}>
            <RefreshCw size={18} /> Abrechnung anstoßen
          </button>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
        {[
          { label: 'Aktiver Pool', value: `€${livePool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: '#a78bfa', sub: 'Echtzeit-Schätzung (80%)' },
          { label: 'Abonnenten', value: totalSubscribers ?? 0, icon: Users, color: '#ec4899', sub: 'Gesamt aktiv' },
          { label: 'Punktwert', value: `€${activeSettlement?.price_per_point.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) || '0,0000'}`, icon: TrendingUp, color: '#f59e0b', sub: 'Letzte Abrechnung' },
          { label: 'Partner', value: venues?.length ?? 0, icon: Building2, color: '#22d3ee', sub: 'Aktive Venues' }
        ].map((stat, i) => (
          <div key={i} className="glass" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content with Tabs */}
      <AllianceDashboardTabs 
        currentPoints={currentMonthPoints}
        settlementHistory={
          <div key="history" className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderRadius: 24, border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Abrechnungshistorie</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Transparente Aufschlüsselung der monatlichen 80/20 Umsatzbeteiligung.</p>
              </div>
              <div className="glass" style={{ padding: '8px 16px', borderRadius: 12, fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, background: 'rgba(167, 139, 250, 0.05)' }}>
                Auszahlungsschutz Aktiv ✓
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    {['Zeitraum', 'Umsatz (100%)', 'Clubify (20%)', 'Pool (80%)', 'Gesamtpunkte', '€ / Punkt', 'Aktion'].map(h => (
                      <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settlements?.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover-highlight">
                      <td style={{ padding: '20px 24px', color: 'white', fontWeight: 700 }}>{new Date(s.month_start).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</td>
                      <td style={{ padding: '20px 24px', color: '#94a3b8' }}>€{s.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '20px 24px', color: '#fb7185' }}>€{s.clubify_share.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '20px 24px', color: '#a78bfa', fontWeight: 700 }}>€{s.alliance_pool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '20px 24px', color: 'white' }}>{s.total_points_redeemed}</td>
                      <td style={{ padding: '20px 24px', color: '#f59e0b', fontWeight: 700 }}>€{s.price_per_point.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <SettlementDetailView settlement={s} />
                      </td>
                    </tr>
                  ))}
                  {(settlements?.length === 0 || !settlements) && (
                    <tr key="empty"><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Keine Abrechnungsdaten verfügbar. Führe eine Simulation durch.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
        benefitManagement={
          <AllianceBenefitManager key="benefits" benefitTypes={benefitTypes} />
        }
        partnerQuickView={
          <div key="partners" className="glass hover-translate" style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(0,0,0,0))', border: '1px solid rgba(34, 211, 238, 0.2)', transition: 'all 0.3s' }}>
            <Link href="/dashboard/admin/alliance/partners" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>Aktive Partner ({venues?.length || 0})</h4>
              <ArrowRight size={16} style={{ color: '#22d3ee' }} />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {venues?.slice(0, 5).map(v => (
                <Link 
                  key={v.target_id} 
                  href={`/dashboard/admin/alliance/partners?tab=${v.target_type}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                  className="hover-translate"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.is_alliance_active ? '#22c55e' : '#64748b' }} />
                    <span style={{ fontWeight: 600, color: 'white', fontSize: '0.8rem' }}>{v.target_type === 'club' ? 'Club' : v.target_type === 'bar' ? 'Bar' : 'Event'} Partner</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#475569' }} />
                </Link>
              ))}
              <div style={{ marginTop: 8 }}>
                <Link href="/dashboard/admin/alliance/partners" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s' }}>
                  Vollständige Liste anzeigen <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        }
        tierManagement={
          <div key="tiers" className="glass" style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(0,0,0,0))', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>Abo-Konfiguration</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Explorer', price: '9,99€', color: '#94a3b8' },
                { name: 'Premium', price: '29,99€', color: '#a78bfa' },
                { name: 'Elite', price: '59,99€', color: '#f59e0b' }
              ].map(tier => (
                <div key={tier.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>{tier.name}</span>
                  <span style={{ fontWeight: 800, color: tier.color, fontSize: '0.9rem' }}>{tier.price}</span>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  )
}
