'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackUserLogin } from '@/lib/actions/auth/TrackingActions'
import { startUserSession, pingUserSession } from '@/lib/actions/admin/AnalyticsActions'

/**
 * Silent Background Tracker & Heartbeat
 * This component handles:
 * 1. Initial login tracking (IP, OS, etc.)
 * 2. Session creation (for duration measurement)
 * 3. Periodic heartbeat (to measure activity)
 */
export default function ActivityTracker({ userId }: { userId: string }) {
  const sessionIdRef = useRef<string | null>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    async function initTracking() {
      if (!userId) return
      
      try {
        // 1. Check if we already have an active session in this browser tab
        const cachedSessionId = sessionStorage.getItem('clubify_active_session')
        
        if (cachedSessionId) {
          console.log('Using cached session:', cachedSessionId)
          sessionIdRef.current = cachedSessionId
          startHeartbeat(cachedSessionId, userId)
        } else {
          // 2. No cached session - start a new one
          // Fire and forget login tracking (IP etc.)
          trackUserLogin(userId).catch(() => {})

          const sId = await startUserSession(userId, {})
          if (sId) {
            sessionIdRef.current = sId
            sessionStorage.setItem('clubify_active_session', sId)
            console.log('New session started:', sId)
            startHeartbeat(sId, userId)
          }
        }
      } catch (err) {
        console.warn('Tracking initialization failed:', err)
      }
    }
    
    // 3. Heartbeat Intervals
    let heartbeatInterval: NodeJS.Timeout
    let initialPingTimer: NodeJS.Timeout

    async function startHeartbeat(sId: string, uId: string) {
      // Step A: First "Quick Ping" after 30 seconds (increased from 10s to reduce noise)
      initialPingTimer = setTimeout(async () => {
        console.log('Sending initial 30s ping...')
        await pingUserSession(sId, uId, 30).catch(() => {})
        
        // Step B: Regular throttled pings every 300 seconds (5 minutes)
        heartbeatInterval = setInterval(() => {
          console.log('Sending throttled 300s heartbeat...')
          pingUserSession(sId, uId, 300).catch(() => {})
        }, 300000)
      }, 30000)
    }

    // Initial delay to prioritize page load
    const timer = setTimeout(initTracking, 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(initialPingTimer)
      if (heartbeatInterval) clearInterval(heartbeatInterval)
    }
  }, [userId])

  return null
}
