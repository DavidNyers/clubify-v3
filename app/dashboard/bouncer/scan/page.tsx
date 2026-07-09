'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const QRScanner = dynamic(() => import('@/components/tickets/QRScanner'), { ssr: false })

function ScanPageInner() {
  const params = useSearchParams()
  const eventId = params.get('event') ?? undefined
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [scanLog, setScanLog] = useState<any[]>([])
  const [eventName, setEventName] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!eventId) return
    supabase.from('events').select('name').eq('id', eventId).single().then(({ data }) => {
      if (data) setEventName(data.name)
    })
  }, [eventId])

  const handleScanResult = (result: any) => {
    setScanLog(prev => [{ ...result, scanned_at: new Date() }, ...prev.slice(0, 19)])
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>QR Scanner</h1>
        {eventName && <p style={{ color: '#a78bfa', fontSize: '0.875rem' }}>📍 {eventName}</p>}
        {!eventName && <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Kein Event ausgewählt — alle Tickets werden überprüft</p>}
      </div>

      <QRScanner
        eventId={eventId}
        bouncerId={user?.id}
        onScanResult={handleScanResult}
      />

      {/* Scan Log */}
      {scanLog.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
            Scan-Verlauf ({scanLog.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scanLog.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                background: entry.valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${entry.valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <span style={{ fontSize: '1rem' }}>{entry.valid ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#f1f5f9' }}>{entry.ticket?.event ?? entry.message}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(entry.scanned_at).toLocaleTimeString('de-AT')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BouncerScanPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#64748b' }}>Wird geladen...</div>}>
      <ScanPageInner />
    </Suspense>
  )
}
