import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getDashboardRoute, canAccessRoute, type UserRole } from '@/lib/auth/rbac'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes — no auth needed
  const publicPaths = ['/', '/map', '/clubs', '/bars', '/events', '/search', '/auth']
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Auth routes
  const isAuthRoute = pathname.startsWith('/auth/')

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthRoute) {
    // Get user role and redirect to correct dashboard
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      return NextResponse.redirect(new URL('/auth/banned', request.url))
    }

    const role = (profile?.role ?? 'user') as UserRole
    return NextResponse.redirect(new URL(getDashboardRoute(role), request.url))
  }

  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/banned', request.url))
    }

    const role = (profile?.role ?? 'user') as UserRole
    const allowedBase = getDashboardRoute(role)

    // Admin can access all dashboards
    if (role !== 'admin' && !pathname.startsWith(allowedBase)) {
      return NextResponse.redirect(new URL(allowedBase, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
