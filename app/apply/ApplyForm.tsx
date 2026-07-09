'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Music, Users, Send, CheckCircle2, Globe, Camera, MapPin, User, Mail, Phone, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { submitApplication, ApplicationPayload, ApplicationType } from '@/lib/actions/applications/ApplicationActions'
import Link from 'next/link'

export default function ApplyForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ApplicationPayload>({
    venueName: '',
    venueType: 'club',
    websiteUrl: '',
    socialMediaUrl: '',
    address: '',
    city: '',
    capacityInfo: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  })

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await submitApplication(formData)
    
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Etwas ist schiefgelaufen.')
    }
    setLoading(false)
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 24, textAlign: 'center' }}>
              Was möchtest du registrieren?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {[
                { id: 'club', label: 'Club / Diskothek', icon: Building2 },
                { id: 'bar', label: 'Bar / Lounge', icon: Music },
                { id: 'organizer', label: 'Veranstalter', icon: Users }
              ].map(type => (
                <div 
                  key={type.id}
                  onClick={() => setFormData({ ...formData, venueType: type.id as ApplicationType })}
                  style={{ 
                    padding: '24px', borderRadius: 20, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    background: formData.venueType === type.id ? 'rgba(var(--color-violet), 0.15)' : 'rgba(255,255,255,0.03)',
                    border: formData.venueType === type.id ? '2px solid rgb(var(--color-violet))' : '1px solid rgba(255,255,255,0.06)',
                    transform: formData.venueType === type.id ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <type.icon size={32} style={{ color: formData.venueType === type.id ? 'rgb(var(--color-violet))' : '#94a3b8', marginBottom: 12, margin: '0 auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.venueType === type.id ? 'white' : '#94a3b8' }}>{type.label}</div>
                </div>
              ))}
            </div>
            <button onClick={handleNext} className="btn btn-primary" style={{ width: '100%', marginTop: 32, padding: 16, borderRadius: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Weiter zum nächsten Schritt <ArrowRight size={18} />
            </button>
          </div>
        )
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 24 }}>Informationen zur Location</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Name der Location / Brand</label>
                <input 
                  type="text" 
                  value={formData.venueName}
                  onChange={e => setFormData({ ...formData, venueName: e.target.value })}
                  placeholder="z.B. Silver Sky Club"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Stadt</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Wien"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Max. Kapazität</label>
                  <input 
                    type="text" 
                    value={formData.capacityInfo}
                    onChange={e => setFormData({ ...formData, capacityInfo: e.target.value })}
                    placeholder="z.B. 500 Gäste"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>E-Mail Adresse für Anfragen</label>
                <input 
                   type="email" 
                   value={formData.contactEmail}
                   onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                   placeholder="office@yourvenue.com"
                   style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={handleBack} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Zurück</button>
              <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2, padding: 14, borderRadius: 14, fontWeight: 700 }}>Weiter</button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 24 }}>Online Präsenz & Kontakt</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Webseite</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={{ position: 'absolute', left: 16, top: 14, color: '#64748b' }} />
                  <input 
                    type="url" 
                    value={formData.websiteUrl}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://yourvenue.com"
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Instagram / Social Media</label>
                <div style={{ position: 'relative' }}>
                  <Camera size={16} style={{ position: 'absolute', left: 16, top: 14, color: '#64748b' }} />
                  <input 
                    type="text" 
                    value={formData.socialMediaUrl}
                    onChange={e => setFormData({ ...formData, socialMediaUrl: e.target.value })}
                    placeholder="@yourvenue"
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  />
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Ansprechpartner (Name)</label>
                <input 
                  type="text" 
                  value={formData.contactName}
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Max Mustermann"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>Telefonnummer</label>
                <input 
                  type="tel" 
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+43 660 ..."
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={handleBack} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Zurück</button>
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary" 
                disabled={loading}
                style={{ flex: 2, padding: 14, borderRadius: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Jetzt bewerben
              </button>
            </div>
          </div>
        )
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="glass" style={{ maxWidth: 500, padding: 48, borderRadius: 32, textAlign: 'center', background: 'rgba(11, 11, 11, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>Bewerbung erhalten!</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
            Vielen Dank für dein Interesse an Clubify. Unser Team prüft deine Angaben und wird sich in Kürze unter der angegebenen E-Mail Adresse bei dir melden.
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ display: 'block', padding: 16, borderRadius: 16, fontWeight: 700, textDecoration: 'none' }}>
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '100px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>Partner werden</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Sichere dir deinen Platz in der Clubify-Community.</p>
        </div>

        <div className="glass" style={{ background: 'rgba(11, 11, 11, 0.6)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)', padding: 40, position: 'relative', overflow: 'hidden' }}>
          {/* Progress Bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, height: 4, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', width: `${(step / 3) * 100}%`, transition: 'width 0.4s ease' }} />
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
             {[1, 2, 3].map(i => (
               <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'rgb(var(--color-violet))' : 'rgba(255,255,255,0.1)' }} />
             ))}
          </div>

          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontSize: '0.9rem' }}>{error}</div>}

          {renderStep()}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Du hast bereits eine fertige Location? <Link href="/dashboard" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>Zurück zum Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
