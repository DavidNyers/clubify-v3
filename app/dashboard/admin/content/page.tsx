import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import ModerationNav from './ModerationNav'

export default async function ModerationOverviewPage() {
  const supabase = await createClient()

  // Fetch Stats
  const [
    { count: openReports },
    { count: flaggedReviews },
    { data: recentReports }
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('reports')
      .select('*, reporter:users!reports_reporter_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  return (
    <div style={{ padding: 32 }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgb(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offene Meldungen</span>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgb(var(--text-primary))' }}>{openReports ?? 0}</div>
          <Link href="/dashboard/admin/content/reports" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: '0.8rem', color: '#fb923c', textDecoration: 'none', fontWeight: 600 }}>
            Alle ansehen <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass" style={{ padding: 24, borderRadius: 20, background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgb(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Markierte Reviews</span>
            <ShieldAlert size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgb(var(--text-primary))' }}>{flaggedReviews ?? 0}</div>
          <Link href="/dashboard/admin/content/reviews" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: '0.8rem', color: '#fb923c', textDecoration: 'none', fontWeight: 600 }}>
            Detailprüfung <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <ModerationNav />

      {/* Recent Reports Section */}
      <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', border: '1px solid rgb(var(--border))', borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(var(--text-primary))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} style={{ color: '#94a3b8' }} />
            Aktuelle Meldungen
          </h2>
          <Link href="/dashboard/admin/content/reports" style={{ color: '#fb923c', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Gesamte Liste →</Link>
        </div>

        <div style={{ padding: '8px 0' }}>
          {!recentReports || recentReports.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>
              Keine neuen Meldungen vorhanden. Super Job! 🎉
            </div>
          ) : (
            recentReports.map((report: any) => (
              <div key={report.id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 12, 
                  background: report.status === 'open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {report.status === 'open' ? <AlertCircle size={22} style={{ color: '#ef4444' }} /> : <CheckCircle2 size={22} style={{ color: '#22c55e' }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgb(var(--text-primary))' }}>{report.target_type === 'user' ? 'Benutzer' : report.target_type === 'review' ? 'Rezension' : 'Kommentar'} gemeldet</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'rgb(var(--text-muted))', fontWeight: 700 }}>
                      {report.reason}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Gemeldet von: <span style={{ fontWeight: 600 }}>{(report.reporter as any)?.full_name || (report.reporter as any)?.email || 'Anonym'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginBottom: 4 }}>
                    {new Date(report.created_at).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Link href="/dashboard/admin/content/reports" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c', textDecoration: 'none' }}>Details ansehen</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
