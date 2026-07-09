'use client'

import { useEffect } from 'react'
import { updateUserLocation, updateLastActive } from '@/lib/actions/user/UserTrackingActions'

/**
 * Silent component that tracks user location and activity.
 * To be placed in the main dashboard layout.
 */
export default function UserLocationTracker() {
  useEffect(() => {
    // 1. Update activity timestamp immediately on load
    updateLastActive()

    // 2. Request Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await updateUserLocation(latitude, longitude)
          console.log('User location updated:', latitude, longitude)
        },
        (error) => {
          // If denied or error, we just don't have location, but we still have activity
          console.warn('Geolocation access denied or error:', error.message)
        },
        {
          enableHighAccuracy: false, // Low accuracy is fine and faster
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 mins
        }
      )
    }

    // 3. Optional: Periodic activity heartbeat (every 5 mins)
    const interval = setInterval(() => {
      updateLastActive()
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
