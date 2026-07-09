'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const UserLiveMap = dynamic(() => import('./UserLiveMap'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: 'calc(100vh - 56px)', 
      width: '100%', 
      background: '#09090b', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'column',
      gap: 16,
      color: '#71717a' 
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} className="animate-spin" />
      <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em' }}>LIVE-KARTE WIRD INITIALISIERT...</span>
    </div>
  )
})

interface UserMapClientProps {
  initialUsers: any[]
  mapboxToken: string
}

export default function UserMapClient(props: UserMapClientProps) {
  return <UserLiveMap {...props} />
}
