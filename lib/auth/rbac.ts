export type UserRole =
  | 'admin'
  | 'moderator'
  | 'club_owner'
  | 'bar_owner'
  | 'event_manager'
  | 'bouncer'
  | 'user'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  preferred_language: string
  theme: string
  is_banned: boolean
  created_at: string
}

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  moderator: '/dashboard/moderator',
  club_owner: '/dashboard/club-owner',
  bar_owner: '/dashboard/bar-owner',
  event_manager: '/dashboard/event-manager',
  bouncer: '/dashboard/bouncer',
  user: '/dashboard/user',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  moderator: 'Moderator',
  club_owner: 'Club Besitzer',
  bar_owner: 'Bar Besitzer',
  event_manager: 'Event Manager',
  bouncer: 'Türsteher',
  user: 'Benutzer',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'text-red-400 bg-red-400/10',
  moderator: 'text-orange-400 bg-orange-400/10',
  club_owner: 'text-violet-400 bg-violet-400/10',
  bar_owner: 'text-pink-400 bg-pink-400/10',
  event_manager: 'text-blue-400 bg-blue-400/10',
  bouncer: 'text-yellow-400 bg-yellow-400/10',
  user: 'text-gray-400 bg-gray-400/10',
}

export type Permission =
  | '*'
  | 'manage_users'
  | 'manage_clubs'
  | 'manage_bars'
  | 'manage_events'
  | 'manage_own_clubs'
  | 'manage_own_bars'
  | 'manage_own_events'
  | 'manage_happy_hours'
  | 'assign_bouncers'
  | 'view_own_analytics'
  | 'view_system_analytics'
  | 'moderate_reviews'
  | 'moderate_comments'
  | 'handle_reports'
  | 'scan_tickets'
  | 'manage_bookings'
  | 'manage_own_bookings'
  | 'process_refunds'
  | 'view_fraud_logs'
  | 'manage_waitlist'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['*'],
  moderator: ['moderate_reviews', 'moderate_comments', 'handle_reports'],
  club_owner: [
    'manage_own_clubs', 'manage_own_events', 'manage_bookings',
    'view_own_analytics', 'moderate_reviews', 'assign_bouncers',
    'manage_waitlist',
  ],
  bar_owner: [
    'manage_own_bars', 'manage_happy_hours', 'manage_bookings',
    'view_own_analytics', 'moderate_reviews', 'manage_waitlist',
  ],
  event_manager: [
    'manage_own_events', 'manage_bookings', 'assign_bouncers',
    'view_own_analytics', 'manage_waitlist',
  ],
  bouncer: ['scan_tickets'],
  user: ['manage_own_bookings'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return perms.includes('*') || perms.includes(permission)
}

export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role] ?? '/dashboard/user'
}

export function canAccessRoute(role: UserRole, routePrefix: string): boolean {
  const allowed = DASHBOARD_ROUTES[role]
  return routePrefix.startsWith(allowed) || role === 'admin'
}
