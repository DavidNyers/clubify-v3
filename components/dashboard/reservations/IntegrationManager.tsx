'use client'

import { useState } from 'react'
import { Link as LinkIcon, ExternalLink, Globe, Info, Check, Copy, LayoutPanelLeft } from 'lucide-react'
import { updateVenueSettings } from '@/lib/actions/venue/TableActions'

interface Reservation {
    id: string
    source?: string
}

interface Props {
    venueId: string
    venueSlug: string
    venueType: 'bar' | 'club'
    reservations: Reservation[]
    initialShowZones?: boolean
}

export default function IntegrationManager({ venueId, venueSlug, venueType, reservations, initialShowZones = true }: Props) {
    const [copied, setCopied] = useState(false)
    const [showZones, setShowZones] = useState(initialShowZones)
    const [isUpdating, setIsUpdating] = useState(false)
    const bookingUrl = `https://clubify.at/reserve/${venueSlug}`

    const googleBookings = reservations.filter(r => r.source === 'google').length
    const totalBookings = reservations.length
    const conversionRate = totalBookings > 0 ? (googleBookings / totalBookings * 100).toFixed(1) : 0

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bookingUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleToggleShowZones = async () => {
        const newVal = !showZones
        setShowZones(newVal)
        setIsUpdating(true)
        const res = await updateVenueSettings(venueId, venueType, { show_zones: newVal })
        setIsUpdating(false)
        if (!res.success) {
            alert("Einstellung konnte nicht gespeichert werden.")
            setShowZones(!newVal)
        }
    }

    const cardStyle: React.CSSProperties = {
        background: 'rgba(24, 24, 27, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        padding: 40,
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={cardStyle}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 40 }}>
                    <div style={{ width: 64, height: 64, background: '#4285F415', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ExternalLink size={32} color="#4285F4" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white', margin: 0 }}>Google Reservierungen</h2>
                        <p style={{ color: '#71717a', marginTop: 6, fontSize: '1.1rem', maxWidth: 600 }}>
                            Verbinde deine Bar mit Google Maps und der Google Suche. Nutze den "Place Action Link", um Buchungen direkt in dein System zu leiten.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 32 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            Dein persönlicher Buchungs-Link
                        </h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 20px', color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {bookingUrl}
                            </div>
                            <button 
                                onClick={copyToClipboard}
                                style={{ 
                                    padding: '0 24px', borderRadius: 14, border: 'none', background: copied ? '#22c55e' : 'white', 
                                    color: copied ? 'white' : 'black', fontWeight: 950, cursor: 'pointer', display: 'flex', 
                                    alignItems: 'center', gap: 10, transition: 'all 0.2s' 
                                }}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Kopiert' : 'Kopieren'}
                            </button>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'flex-start', background: 'rgba(59, 130, 246, 0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <Info size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '0.85rem', color: '#93c5fd', margin: 0, lineHeight: 1.5 }}>
                                Kopiere diesen Link und füge ihn in deinem **Google Business Profil** unter dem Punkt "Reservierungs-Link" ein. Google zeigt dann automatisch einen "Tisch reservieren" Button bei deiner Bar an.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Google Bookings</div>
                            <div style={{ fontSize: '2rem', fontWeight: 950, color: '#3b82f6' }}>{googleBookings}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Conversion Rate</div>
                            <div style={{ fontSize: '2rem', fontWeight: 950, color: '#22c55e' }}>{conversionRate}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutPanelLeft size={32} color="#8b5cf6" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white', margin: 0 }}>Bereiche & Zonen</h2>
                                <p style={{ color: '#71717a', marginTop: 4, fontSize: '0.95rem' }}>
                                    Gruppiere die verfügbaren Zeiten im Buchungsformular nach deinen Sitzbereichen (z.B. Bar, Lounge, Terrasse). Deaktiviere dies, um alle Zeiten in einer einfachen Liste anzuzeigen.
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: showZones ? '#8b5cf6' : '#52525b' }}>
                                    {showZones ? 'Aktiviert' : 'Deaktiviert'}
                                </span>
                                <button 
                                    onClick={handleToggleShowZones}
                                    disabled={isUpdating}
                                    style={{ 
                                        width: 52, height: 28, borderRadius: 20, border: 'none', 
                                        background: showZones ? '#8b5cf6' : '#3f3f46', position: 'relative', cursor: 'pointer', transition: '0.2s',
                                        opacity: isUpdating ? 0.5 : 1
                                    }}
                                >
                                    <div style={{ 
                                        width: 22, height: 22, borderRadius: '50%', background: 'white', 
                                        position: 'absolute', top: 3, left: showZones ? 27 : 3, transition: '0.2s' 
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.03)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'white', marginBottom: 24 }}>Häufig gestellte Fragen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                    <div>
                        <p style={{ fontSize: '0.95rem', fontWeight: 950, color: 'white', marginBottom: 12 }}>Ist die Integration kostenlos?</p>
                        <p style={{ fontSize: '0.85rem', color: '#71717a', lineHeight: 1.6, margin: 0 }}>Ja, Clubify erhebt keine Gebühren für Reservierungen, die über den Google Link kommen. Du behältst 100% deiner Einnahmen.</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.95rem', fontWeight: 950, color: 'white', marginBottom: 12 }}>Wie erkenne ich Google-Gäste?</p>
                        <p style={{ fontSize: '0.85rem', color: '#71717a', lineHeight: 1.6, margin: 0 }}>Im Dashboard und im Kalender werden diese Gäste mit einem blauen Google-Icon markiert, damit du die Herkunft sofort siehst.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
