import { createClient } from '@/lib/supabase/server'
import { AlertCircle, CheckCircle2, MoreHorizontal, User, Eye, EyeOff, CheckSquare, Trash2 } from 'lucide-react'
import { hideAndResolve, resolveReport } from '@/lib/actions/admin/ModerationActions'
import ModerationNav from '../ModerationNav'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('*, reporter:users!reports_reporter_id_fkey(full_name, email)')
    .order('status', { ascending: true }) // Open first
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 32 }}>
      <ModerationNav />
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Nutzer-Meldungen</h2>
          <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>Prüfe gemeldete Inhalte und ergreife Maßnahmen.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {!reports || reports.length === 0 ? (
          <div className="glass" style={{ padding: 60, textAlign: 'center', borderRadius: 24, border: '1px solid rgb(var(--border))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Alles erledigt!</h3>
            <p style={{ color: 'rgb(var(--text-secondary))' }}>Es liegen aktuell keine Meldungen zur Bearbeitung vor.</p>
          </div>
        ) : (
          reports.map((report: any) => (
            <div key={report.id} className="glass" style={{ 
              background: 'rgba(var(--bg-surface), 0.5)', 
              border: '1px solid rgb(var(--border))', 
              borderRadius: 20, padding: '24px',
              opacity: report.status === 'resolved' ? 0.7 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: report.status === 'open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {report.status === 'open' ? <AlertCircle size={24} style={{ color: '#ef4444' }} /> : <CheckSquare size={24} style={{ color: '#22c55e' }} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{report.target_type.toUpperCase()} GEMELDET</h3>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>
                        {report.reason}
                      </span>
                      {report.status === 'resolved' && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>ERLEDIGT</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} /> 
                      Von: <span style={{ fontWeight: 600 }}>{(report.reporter as any)?.full_name || (report.reporter as any)?.email}</span>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span>{new Date(report.created_at).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {report.status === 'open' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <form action={async () => {
                      'use server'
                      await hideAndResolve(report.id, report.target_type, report.target_id)
                    }}>
                      <button className="hover-translate" style={{ 
                        padding: '10px 16px', borderRadius: 12, background: '#ef444415', color: '#ef4444', 
                        border: '1px solid #ef444430', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}>
                        <EyeOff size={16} /> Verbergen & Lösen
                      </button>
                    </form>
                    
                    <form action={async () => {
                      'use server'
                      await resolveReport(report.id, 'resolved')
                    }}>
                      <button className="hover-translate" style={{ 
                        padding: '10px 16px', borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', 
                        border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}>
                        <CheckCircle2 size={16} /> Nur Lösen
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {report.description && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgb(var(--text-muted))', marginBottom: 8, textTransform: 'uppercase' }}>Beschreibung des Reporters</div>
                  "{report.description}"
                </div>
              )}

              <div style={{ marginTop: 20, fontSize: '0.8rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>Target ID:</span>
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{report.target_id}</code>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
