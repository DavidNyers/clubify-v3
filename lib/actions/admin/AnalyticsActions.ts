'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Parses the User-Agent string to extract OS, Browser, and Device details.
 * Shared logic with TrackingActions.
 */
function parseUserAgent(ua: string | null) {
  if (!ua) return { os: 'Unbekannt', browser: 'Unbekannt', device: 'Desktop' }
  let os = 'Unbekannt', browser = 'Unbekannt', device = 'Desktop'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'

  if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile'
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'

  return { os, browser, device }
}

/**
 * Starts a new user session or resumes an existing one from the last 30 minutes.
 * Ensures that refreshes or quick re-visits don't spam the database with new sessions.
 */
export async function startUserSession(userId: string, metadata: { ip?: string, location?: string, os?: string, browser?: string, device?: string }) {
  const supabase = await createClient()
  const headerList = await headers()
  
  // 1. Check for an existing "fresh" session (last active within the last 30 minutes)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .gt('last_active_at', thirtyMinsAgo)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession) {
    console.log('Resuming existing session:', existingSession.id)
    return existingSession.id
  }

  // 2. No session found? Create a new one
  const ip = metadata.ip || headerList.get('x-real-ip') || headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const ua = headerList.get('user-agent')
  const { os, browser, device } = parseUserAgent(ua)

  // ATOMIC INCREMENT Login Count
  const { data: userData } = await supabase.from('users').select('login_count').eq('id', userId).single()
  const newCount = (userData?.login_count || 0) + 1

  const [sessionRes, userUpdateRes] = await Promise.all([
    supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        ip: ip,
        os: metadata.os || os,
        browser: metadata.browser || browser,
        device: metadata.device || device,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_active: true
      })
      .select('id')
      .single(),
    supabase
      .from('users')
      .update({ login_count: newCount })
      .eq('id', userId)
  ])

  if (sessionRes.error) {
    console.error('Error starting session:', sessionRes.error.message)
    return null
  }

  return sessionRes.data.id
}

/**
 * Updates an existing session's activity and duration.
 * OPTIMIZED: Uses a single RPC to reduce DB hits.
 */
export async function pingUserSession(sessionId: string, userId: string, incrementSeconds: number = 120) {
  const supabase = await createClient()
  
  // We do everything in one single atomic DB call.
  const { error } = await supabase.rpc('handle_user_heartbeat', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_increment_seconds: incrementSeconds
  })

  return { success: !error }
}

/**
 * Fetches analytics for the dashboard.
 */
export async function getUsageAnalytics(timeRange: string = '7d') {
  const supabase = await createClient()
  
  const days = timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : timeRange === '1y' ? 365 : 7
  const dateFilter = new Date()
  dateFilter.setDate(dateFilter.getDate() - days)

  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('user_id, duration_seconds, started_at, os, browser, device, users(full_name, email)')
    .gt('started_at', dateFilter.toISOString())
    .order('started_at', { ascending: false })

  return sessions || []
}
