import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Star, MessageSquare, FileText, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default async function ModeratorDashboard() {
  const user = await getUser()
  if (!user || !['moderator', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()
  const [
    { data: pendingReviews, count: reviewCount },
    { data: openReports, count: reportCount },
    { data: flaggedComments, count: commentCount },
  ] = await Promise.all([
    supabase.from('reviews').select('id, rating, text, status, created_at, users(full_name)').eq('status', 'flagged').limit(5),
    supabase.from('reports').select('id, target_type, reason, status, created_at, users!reporter_id(full_name)').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
    supabase.from('comments').select('id, text, status, created_at').eq('status', 'flagged').limit(5),
  ])

  return (
    <div style={{ padding: 32, flex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Moderator Dashboard</h1>
        <p style={{ color: '#64748b' }}>Inhalte moderieren und Meldungen bearbeiten</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Bewertungen prüfen', value: reviewCount ?? 0, icon: Star, color: '#fbbf24', href: '/dashboard/moderator/reviews' },
          { label: 'Offene Meldungen', value: reportCount ?? 0, icon: AlertTriangle, color: '#f87171', href: '/dashboard/moderator/reports' },
          { label: 'Kommentare', value: commentCount ?? 0, icon: MessageSquare, color: '#fb923c', href: '/dashboard/moderator/comments' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Open Reports */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Offene Meldungen</h2>
          <Link href="/dashboard/moderator/reports" style={{ color: '#f87171', fontSize: '0.8rem', textDecoration: 'none' }}>Alle →</Link>
        </div>
        {!openReports?.length ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>✅ Keine offenen Meldungen</div>
        ) : (
          openReports.map((report: any) => (
            <div key={report.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#f1f5f9' }}>{report.reason}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {report.target_type} • {report.users?.full_name ?? 'Anonym'} • {new Date(report.created_at).toLocaleDateString('de-AT')}
                </div>
              </div>
              <Link href={`/dashboard/moderator/reports/${report.id}`} style={{ fontSize: '0.75rem', color: '#fb923c', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', whiteSpace: 'nowrap' }}>
                Bearbeiten
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Flagged Reviews */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Gemeldete Bewertungen</h2>
          <Link href="/dashboard/moderator/reviews" style={{ color: '#fbbf24', fontSize: '0.8rem', textDecoration: 'none' }}>Alle →</Link>
        </div>
        {!pendingReviews?.length ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>✅ Keine gemeldeten Bewertungen</div>
        ) : (
          pendingReviews.map((review: any) => (
            <div key={review.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < review.rating ? '#fbbf24' : '#334155', fontSize: '0.8rem' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{review.users?.full_name}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {review.text}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: '0.75rem', color: '#22c55e', padding: '4px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> Freigeben
                </button>
                <button style={{ fontSize: '0.75rem', color: '#f87171', padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EyeOff size={12} /> Verbergen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
