import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApplyForm from './ApplyForm'

export default async function ApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Enforce login for partner applications
  if (!user) {
    redirect('/auth/login?next=/apply')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '100px 20px', background: '#09090b', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)' }}>
      <ApplyForm />
    </div>
  )
}
