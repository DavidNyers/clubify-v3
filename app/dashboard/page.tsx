import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'

export default async function DashboardIndexPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const routes: Record<string, string> = {
    admin: '/dashboard/admin',
    moderator: '/dashboard/moderator',
    club_owner: '/dashboard/club-owner',
    bar_owner: '/dashboard/bar-owner',
    event_manager: '/dashboard/event-manager',
    bouncer: '/dashboard/bouncer',
    user: '/profile',
  }

  redirect(routes[user.role] ?? '/profile')
}
