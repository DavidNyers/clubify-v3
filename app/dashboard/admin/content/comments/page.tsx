import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Eye, EyeOff, User, Calendar, CornerDownRight } from 'lucide-react'
import { updateCommentStatus } from '@/lib/actions/admin/ModerationActions'
import ModerationNav from '../ModerationNav'

export default async function AdminCommentsModerationPage() {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('comments')
    .select('*, user:users!comments_user_id_fkey(full_name, email, avatar_url), review:reviews(text)')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 32 }}>
      <ModerationNav />
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Kommentar-Moderation</h2>
        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>Verwalte Antworten auf Reviews.</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {!comments || comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(var(--text-muted))' }}>
            Noch keine Kommentare vorhanden.
          </div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="glass" style={{ 
              background: 'rgba(var(--bg-surface), 0.5)', 
              border: '1px solid rgb(var(--border))', 
              borderRadius: 20, padding: 20,
              opacity: comment.status === 'hidden' ? 0.6 : 1
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #3b82f6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                  {comment.user?.avatar_url ? <img src={comment.user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : (comment.user?.full_name?.[0] || 'U')}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{comment.user?.full_name || comment.user?.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Calendar size={12} /> {new Date(comment.created_at).toLocaleDateString('de-DE')}
                        {comment.status === 'hidden' && <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>VERSTECKT</span>}
                      </div>
                    </div>

                    <form action={async () => {
                      'use server'
                      await updateCommentStatus(comment.id, comment.status === 'hidden' ? 'visible' : 'hidden')
                    }}>
                      <button className="hover-translate" style={{ 
                        width: 32, height: 32, borderRadius: 8, 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white'
                      }}>
                        {comment.status === 'hidden' ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </form>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <CornerDownRight size={16} style={{ color: 'rgb(var(--text-muted))', flexShrink: 0, marginTop: 4 }} />
                    <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', width: '100%' }}>
                      <span style={{ fontWeight: 700 }}>Kommentar zu:</span> "{comment.review?.text?.substring(0, 80)}..."
                    </div>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: 1.6, margin: 0 }}>
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
