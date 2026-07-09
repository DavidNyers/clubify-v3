'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { Download, Eye, Share2 } from 'lucide-react'

interface TicketCardProps {
  ticket: {
    id: string
    ticket_uuid: string
    qr_payload: string
    status: 'valid' | 'used' | 'expired' | 'cancelled'
    created_at: string
    events?: {
      name: string
      date: string
      clubs?: { name: string; address: string } | null
    } | null
  }
}

const STATUS_CONFIG = {
  valid: { label: 'Gültig', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  used: { label: 'Verwendet', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  expired: { label: 'Abgelaufen', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  cancelled: { label: 'Storniert', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false)
  const event = ticket.events
  const status = STATUS_CONFIG[ticket.status]
  const isValid = ticket.status === 'valid'

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${ticket.id}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${ticket.ticket_uuid.substring(0, 8)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Clubify Ticket — ${event?.name}`,
        text: `Mein Ticket für ${event?.name}`,
        url: window.location.href,
      })
    }
  }

  const eventDate = event?.date ? new Date(event.date) : null

  return (
    <div style={{
      background: '#1e293b',
      border: `1px solid ${isValid ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: isValid ? '0 4px 24px rgba(139,92,246,0.1)' : 'none',
      transition: 'all 0.2s',
    }}>
      {/* Ticket Header / Event Info */}
      <div style={{
        padding: '20px 20px 16px',
        background: isValid
          ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))'
          : 'transparent',
        borderBottom: '1px dashed rgba(255,255,255,0.08)',
        position: 'relative',
      }}>
        {/* Status Badge */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🎟 Digitales Ticket
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8, paddingRight: 80 }}>
          {event?.name ?? 'Event'}
        </h3>
        {eventDate && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>📅 {eventDate.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span>🕐 {eventDate.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
          </div>
        )}
        {event?.clubs?.name && (
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            📍 {event.clubs.name} {event.clubs.address && `• ${event.clubs.address}`}
          </div>
        )}
      </div>

      {/* QR Section */}
      <div style={{ padding: 20 }}>
        {showQR ? (
          <div style={{ textAlign: 'center', animation: 'fade-in-up 0.3s ease' }}>
            <div style={{
              display: 'inline-block', padding: 16, background: 'white', borderRadius: 12,
              marginBottom: 12,
              filter: isValid ? 'none' : 'grayscale(1) opacity(0.4)',
            }}>
              <QRCode
                id={`qr-${ticket.id}`}
                value={ticket.qr_payload}
                size={200}
                level="H"
                style={{ display: 'block' }}
              />
            </div>
            {!isValid && (
              <div style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: 8 }}>⚠️ Ticket nicht mehr gültig</div>
            )}
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569', marginBottom: 16 }}>
              UUID: {ticket.ticket_uuid}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 12, background: isValid ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
              fontSize: '2rem',
            }}>
              {isValid ? '🔒' : '🔓'}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>QR-Code anzeigen um einzuchecken</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id={`show-qr-${ticket.id}`}
            onClick={() => setShowQR(!showQR)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none',
              background: isValid ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255,255,255,0.05)',
              color: isValid ? 'white' : '#64748b', fontWeight: 600, fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            disabled={!isValid && !showQR}
          >
            <Eye size={15} />
            {showQR ? 'Verbergen' : 'QR-Code'}
          </button>
          {showQR && isValid && (
            <button
              id={`download-qr-${ticket.id}`}
              onClick={downloadQR}
              title="Herunterladen"
              style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Download size={15} />
            </button>
          )}
          <button
            onClick={share}
            title="Teilen"
            style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
