import { createClient } from '@/lib/supabase/server'
import { Star, Eye, EyeOff, ShieldAlert, Calendar } from 'lucide-react'
import { updateReviewStatus } from '@/lib/actions/admin/ModerationActions'
import ReviewHistoryButton from './ReviewHistoryButton'
import ModerationNav from '../ModerationNav'

export default async function AdminReviewsModerationPage() {
  const supabase = await createClient()

  // Fetch reviews with related club/bar/event info
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users!reviews_user_id_fkey(full_name, email, avatar_url),
      clubs(name),
      bars(name),
      events(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 32 }}>
      <ModerationNav />
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Review-Moderation</h2>
        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>Behalte die Qualität der Nutzerbewertungen im Auge.</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {!reviews || reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(var(--text-muted))' }}>
            Noch keine Reviews vorhanden.
          </div>
        ) : (
          reviews.map((review: any) => {
            const targetName = review.clubs?.name || review.bars?.name || review.events?.name || 'Unbekannt'
            return (
              <div key={review.id} className="glass" style={{ 
                background: 'rgba(var(--bg-surface), 0.5)', 
                border: '1px solid rgb(var(--border))', 
                borderRadius: 20, padding: 20,
                display: 'flex', gap: 20, flexWrap: 'wrap',
                opacity: review.status === 'hidden' ? 0.6 : 1
              }}>
                {/* User Info */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                  {review.user?.avatar_url ? <img src={review.user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : (review.user?.full_name?.[0] || 'U')}
                </div>

                {/* Content */}
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {review.user?.full_name || review.user?.email}
                        <ArrowRightIcon />
                        <span style={{ color: '#fb923c' }}>{targetName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < review.rating ? '#f59e0b' : 'transparent'} stroke={i < review.rating ? '#f59e0b' : '#3f3f46'} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {new Date(review.created_at).toLocaleDateString('de-DE')}
                        </span>
                        {review.status !== 'visible' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: review.status === 'hidden' ? '#ef444420' : '#f59e0b20', color: review.status === 'hidden' ? '#ef4444' : '#f59e0b', textTransform: 'uppercase' }}>
                            {review.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <form action={async () => {
                        'use server'
                        await updateReviewStatus(review.id, review.status === 'hidden' ? 'visible' : 'hidden')
                      }}>
                        <button className="hover-translate" style={{ 
                          width: 36, height: 36, borderRadius: 10, 
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white'
                        }} title={review.status === 'hidden' ? 'Sichtbar machen' : 'Verbergen'}>
                          {review.status === 'hidden' ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </form>
                      <form action={async () => {
                        'use server'
                        await updateReviewStatus(review.id, 'flagged')
                      }}>
                        <button className="hover-translate" style={{ 
                          width: 36, height: 36, borderRadius: 10, 
                          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f59e0b'
                        }} title="Markieren">
                          <ShieldAlert size={18} />
                        </button>
                      </form>

                      {/* History Button (Only if edited) */}
                      <ReviewHistoryButton history={review.edit_history} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: 1.6, margin: 0 }}>
                    {review.text || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Kein Text...</span>}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  )
}
