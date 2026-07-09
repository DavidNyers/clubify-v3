'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, XCircle, Clock, Camera, CameraOff, Wifi, WifiOff } from 'lucide-react'

interface ScanResult {
  valid: boolean
  message: string
  ticket?: { id: string; event: string; event_date?: string }
  checkin?: { id: string; checked_in_at: string }
  reason?: string
}

interface QRScannerProps {
  eventId?: string
  bouncerId?: string
  onScanResult?: (result: ScanResult) => void
}

export default function QRScanner({ eventId, bouncerId, onScanResult }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const cooldownRef = useRef(false)
  const offlineQueueRef = useRef<string[]>([])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      flushOfflineQueue()
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const flushOfflineQueue = async () => {
    const queue = [...offlineQueueRef.current]
    offlineQueueRef.current = []
    for (const payload of queue) {
      await validateTicket(payload)
    }
  }

  const validateTicket = useCallback(async (payload: string): Promise<ScanResult> => {
    const result: ScanResult = await fetch('/api/tickets/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bouncerId ? { 'x-bouncer-id': bouncerId } : {}),
      },
      body: JSON.stringify({ qr_payload: payload, event_id: eventId }),
    }).then(r => r.json()).catch(() => ({
      valid: false,
      message: '⚠️ Netzwerkfehler',
      reason: 'network_error',
    }))

    setLastResult(result)
    onScanResult?.(result)

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(result.valid ? [100, 50, 100] : [500])
    }

    return result
  }, [eventId, bouncerId, onScanResult])

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (cooldownRef.current) return
    cooldownRef.current = true
    setLoading(true)
    setScanCount(p => p + 1)

    if (!isOnline) {
      offlineQueueRef.current.push(decodedText)
      setLastResult({ valid: false, message: '⚠️ Offline — Scan in Warteschlange gespeichert', reason: 'offline' })
      setLoading(false)
      setTimeout(() => { cooldownRef.current = false }, 3000)
      return
    }

    await validateTicket(decodedText)
    setLoading(false)
    setTimeout(() => { cooldownRef.current = false }, 2500)
  }, [isOnline, validateTicket])

  const startScanner = async () => {
    setCameraError(null)
    try {
      const scanner = new Html5Qrcode('qr-scanner-region')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        handleScanSuccess,
        () => {} // onError — ignore
      )
      setScanning(true)
    } catch (err: any) {
      setCameraError(err.message ?? 'Kamera nicht verfügbar')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => { return () => { stopScanner() } }, [])

  const resultColor = lastResult?.valid ? '#22c55e' : lastResult?.reason === 'offline' ? '#fbbf24' : '#ef4444'
  const ResultIcon = lastResult?.valid ? CheckCircle : lastResult?.reason === 'offline' ? Clock : XCircle

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 16, maxWidth: 480, margin: '0 auto' }}>
      {/* Status Bar */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: isOnline ? '#22c55e' : '#f87171' }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'Online' : `Offline (${offlineQueueRef.current.length} in Queue)`}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Scans: {scanCount}</div>
      </div>

      {/* Camera Region */}
      <div style={{
        width: '100%', maxWidth: 340,
        borderRadius: 16, overflow: 'hidden',
        border: `3px solid ${lastResult ? resultColor : '#334155'}`,
        position: 'relative',
        background: '#0f172a',
        transition: 'border-color 0.3s',
        boxShadow: lastResult ? `0 0 30px ${resultColor}44` : 'none',
      }}>
        <div id="qr-scanner-region" style={{ width: '100%', aspectRatio: '1' }} />

        {/* Scanning overlay */}
        {scanning && !lastResult && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 240, height: 240, border: '3px solid #8b5cf6', borderRadius: 12, position: 'relative' }}>
              {/* Corner markers */}
              {[{ top: -2, left: -2 }, { top: -2, right: -2 }, { bottom: -2, left: -2 }, { bottom: -2, right: -2 }].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 24, height: 24,
                  borderColor: '#a78bfa', borderStyle: 'solid',
                  borderTopWidth: i < 2 ? 4 : 0, borderBottomWidth: i >= 2 ? 4 : 0,
                  borderLeftWidth: i % 2 === 0 ? 4 : 0, borderRightWidth: i % 2 === 1 ? 4 : 0,
                  borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                  ...pos,
                }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: 'absolute', left: 4, right: 4, height: 2,
                background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)',
                animation: 'scan-line 2s linear infinite',
              }} />
            </div>
          </div>
        )}

        {!scanning && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
            <CameraOff size={40} style={{ color: '#334155' }} />
          </div>
        )}

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: '0.875rem', color: '#f87171', textAlign: 'center' }}>
          {cameraError}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        <button
          id="scanner-toggle"
          onClick={scanning ? stopScanner : startScanner}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 12, fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: scanning ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            color: scanning ? '#f87171' : 'white',
          }}
        >
          {scanning ? <CameraOff size={18} /> : <Camera size={18} />}
          {scanning ? 'Scanner stoppen' : 'Scanner starten'}
        </button>
        {lastResult && (
          <button
            onClick={() => setLastResult(null)}
            style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Result Card */}
      {lastResult && (
        <div style={{
          width: '100%', padding: '20px', borderRadius: 14,
          background: `${resultColor}15`,
          border: `2px solid ${resultColor}44`,
          animation: 'fade-in-up 0.3s ease',
          transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: lastResult.ticket ? 12 : 0 }}>
            <ResultIcon size={28} style={{ color: resultColor, flexShrink: 0 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: resultColor }}>{lastResult.message}</div>
          </div>
          {lastResult.ticket && (
            <div style={{ paddingLeft: 40, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.8 }}>
              <div>🎟 {lastResult.ticket.event}</div>
              {lastResult.ticket.event_date && <div>📅 {new Date(lastResult.ticket.event_date).toLocaleDateString('de-AT')}</div>}
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>ID: {lastResult.ticket.id?.substring(0, 8)}...</div>
            </div>
          )}
          {lastResult.checkin && (
            <div style={{ paddingLeft: 40, fontSize: '0.8rem', color: '#22c55e', marginTop: 4 }}>
              ✅ Check-in: {new Date(lastResult.checkin.checked_in_at).toLocaleTimeString('de-AT')}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 4px; }
          50% { top: calc(100% - 6px); }
          100% { top: 4px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
