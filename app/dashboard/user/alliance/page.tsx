import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UserAlliancePage() {
  const user = await getUser()
  if (!user) redirect('/login')
  
  // Redirect to the new unified profile alliance tab
  redirect('/profile?tab=alliance')
}
