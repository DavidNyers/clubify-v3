'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Advanced User-Agent Parser
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
 * Tracks the user's login metadata.
 * OPTIMIZED: Uses short timeout for Geo-API to prevent login delays.
 */
export async function trackUserLogin(userId: string) {
  try {
    const headerList = await headers()
    const uaString = headerList.get('user-agent')
    const { os, browser, device } = parseUserAgent(uaString)

    const ip = headerList.get('x-real-ip') || 
               headerList.get('x-forwarded-for')?.split(',')[0] || 
               '127.0.0.1'
    
    let locationStr = 'Lokal (Entwicklung)'

    // Geo-Lookup with 1s TIMEOUT
    if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.')) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000) // 1s Timeout

        const response = await fetch(`https://ipapi.co/${ip}/json/`, { 
          next: { revalidate: 3600 },
          signal: controller.signal 
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const geo = await response.json()
          if (geo.city && geo.country_name) locationStr = `${geo.city}, ${geo.country_name}`
        }
      } catch (e) {
        // Silently continue if timeout or error
      }
    }

    const supabase = await createClient()
    
    // FETCH & UPDATE (Optimized)
    const { data: userRecord } = await supabase.from('users').select('login_count').eq('id', userId).single()
    const currentCount = userRecord?.login_count || 0

    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        last_ip: ip,
        last_location: locationStr,
        last_os: os,
        last_browser: browser,
        last_device: device,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return { success: true }
  } catch (error: any) {
    console.warn('Silent Tracking Error:', error.message)
    return { success: true }
  }
}

export async function trackUserActivity(userId: string) {
  try {
    const supabase = await createClient()
    await supabase.from('users').update({ last_active_at: new Date().toISOString() }).eq('id', userId)
  } catch (e) {}
}
