import { createClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'
import ReviewItem from './ReviewItem'
import { MessageSquare } from 'lucide-react'

interface ReviewSectionProps {
  targetId: string
  targetType: 'club' | 'bar' | 'event'
  user: any
}

export default async function ReviewSection({ targetId, targetType, user }: ReviewSectionProps) {
  const supabase = await createClient()

  // Fetch reviews with user and comments
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, full_name, avatar_url),
      comments(
        *,
        user:users!comments_user_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq(targetType === 'club' ? 'club_id' : targetType === 'bar' ? 'bar_id' : 'event_id', targetId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })

  return (
    <div id="reviews" style={{ marginTop: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(251, 146, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={24} style={{ color: '#fb923c' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Community & Reviews</h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Was andere über diesen Ort sagen</p>
        </div>
      </div>

      {/* Write Review Form */}
      {user ? (
        <div style={{ marginBottom: 48 }}>
          <ReviewForm targetId={targetId} targetType={targetType} userName={user.full_name} />
        </div>
      ) : (
        <div className="glass" style={{ padding: 32, borderRadius: 24, textAlign: 'center', marginBottom: 48, border: '1px dashed #27272a' }}>
          <p style={{ color: '#a1a1aa', marginBottom: 0 }}>Melde dich an, um eine Review zu schreiben.</p>
        </div>
      )}

      {/* Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {!reviews || reviews.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#52525b' }}>
            Noch keine Reviews vorhanden. Sei der Erste!
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewItem 
              key={review.id} 
              review={review} 
              currentUserId={user?.id} 
              targetType={targetType}
            />
          ))
        )}
      </div>
    </div>
  )
}
