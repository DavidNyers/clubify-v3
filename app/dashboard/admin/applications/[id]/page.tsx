'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Building2, Music, Users, Globe, MapPin, Mail, Phone, 
  Clock, Check, X, Shield, Info, Loader2, AlertTriangle, 
  FileText, ArrowLeft, ExternalLink, Share2,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { getApplication, moderateApplication } from '@/lib/actions/applications/ApplicationActions'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null)
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    identityVerified: false,
    locationVerified: false,
    linksVerified: false,
    typeCorrect: false
  })
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const res = await getApplication(id as string)
      if (res.success) setApp(res.data)
      setLoading(false)
    }
    load()
  }, [id])

  const canApprove = Object.values(checklist).every(v => v === true)

  const handleActionInitiation = (status: 'approved' | 'rejected') => {
    if (status === 'approved' && !canApprove) {
      alert('Bitte gehen Sie erst die gesamte Checkliste durch.')
      return
    }
    setPendingAction(status)
    setShowConfirmModal(true)
  }

  const handleConfirmedAction = async () => {
    if (!pendingAction) return
    
    setShowConfirmModal(false)
    setProcessing(true)
    
    const res = await moderateApplication(id as string, pendingAction, notes, checklist)
    if (res.success) {
      router.push('/dashboard/admin/applications')
      router.refresh()
    } else {
      alert('Fehler: ' + res.error)
      setProcessing(false)
    }
    setPendingAction(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 className="animate-spin text-violet" size={40} />
    </div>
  )

  if (!app) return <div style={{ padding: 32 }}>Bewerbung nicht gefunden.</div>

  const typeColor = app.venue_type === 'club' ? '#8b5cf6' : app.venue_type === 'bar' ? '#f472b6' : '#22d3ee'

  return (
    <div style={{ padding: '32px 5%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Link href="/dashboard/admin/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#71717a', textDecoration: 'none', fontWeight: 700 }}>
          <ArrowLeft size={18} /> Bewerbungen
        </Link>
        <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', color: '#52525b', fontSize: '0.8rem', fontWeight: 800 }}>
          ID: {id?.slice(0, 8)}...
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Main Card */}
          <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: 32, border: '1px solid #27272a', padding: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor, border: `1px solid ${typeColor}25` }}>
                {app.venue_type === 'club' ? <Building2 size={40} /> : app.venue_type === 'bar' ? <Music size={40} /> : <Users size={40} />}
              </div>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{app.venue_name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: typeColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
                  {app.venue_type} application
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40 }}>
              {/* Location */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Standort & Basis</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a1a1aa' }}>
                    <MapPin size={18} /> {app.location_address || 'N/A'}, {app.location_city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a1a1aa' }}>
                    <Users size={18} /> Kapazität: {app.capacity_info || 'Keine Angabe'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a1a1aa' }}>
                    <Clock size={18} /> Eingereicht: {new Date(app.created_at).toLocaleString('de-AT')}
                  </div>
                </div>
              </div>

              {/* Online Presence */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Online Präsenz</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {app.website_url ? (
                    <a href={app.website_url} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>
                      <Globe size={18} /> Website besuchen <ExternalLink size={14} />
                    </a>
                  ) : <div style={{ color: '#3f3f46' }}>Keine Website</div>}
                  {app.social_media_url ? (
                    <a href={app.social_media_url} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>
                      <Share2 size={18} /> Social Media <ExternalLink size={14} />
                    </a>
                  ) : <div style={{ color: '#3f3f46' }}>Kein Social Media</div>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>Ansprechpartner</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{app.contact_name}</div>
                  <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>UserID: {app.user_id.slice(0, 8)}...</div>
                </div>
                <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 600, marginBottom: 8 }}>
                    <Mail size={16} /> {app.contact_email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#71717a', fontSize: '0.9rem' }}>
                    <Phone size={16} /> {app.contact_phone || 'Keine Telefonnummer'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Logs Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', margin: '0 8px' }}>Verlauf & Protokoll</h3>
             
             {app.application_verification_logs?.length > 0 ? (
               app.application_verification_logs.map((log: any) => (
                 <div key={log.id} style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, padding: 20, border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 700 }}>
                          <Shield size={16} style={{ color: '#8b5cf6' }} /> {log.admin?.full_name || 'Admin'}
                       </div>
                       <div style={{ color: '#52525b', fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString('de-AT')}</div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: 10 }}>{log.notes || 'Keine Notizen hinterlegt.'}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                       {(Object.entries(log.checklist || {}) as [string, boolean][]).map(([key, val]) => (
                         val && <span key={key} style={{ fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '2px 8px', borderRadius: 8 }}>{key}</span>
                       ))}
                    </div>
                 </div>
               ))
             ) : (
               <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: '32px', textAlign: 'center', border: '1px dashed #27272a' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#3f3f46' }}>
                    <FileText size={32} />
                  </div>
                  <div style={{ color: '#71717a', fontSize: '0.9rem', fontWeight: 500 }}>
                    {app.status === 'pending' ? 'Noch kein Prüfprotokoll vorhanden. Bitte führen Sie die Prüfung rechts durch.' : 'Für diese Alt-Bewerbung existiert kein detailliertes Protokoll.'}
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: Verification Action */}
        <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 32, border: '1px solid #8b5cf622', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Shield size={24} style={{ color: '#8b5cf6' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>Verifizierung</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'identityVerified', label: 'Identität verifiziert' },
                { id: 'locationVerified', label: 'Standort plausibel' },
                { id: 'linksVerified', label: 'Links & Socials geprüft' },
                { id: 'typeCorrect', label: 'Venue-Typ korrekt' }
              ].map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid transparent', transition: 'all 0.2s' }} className="hover-border-violet">
                  <input 
                    type="checkbox"
                    checked={(checklist as any)[item.id]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    style={{ width: 22, height: 22, accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: (checklist as any)[item.id] ? 'white' : '#71717a' }}>{item.label}</span>
                </label>
              ))}
            </div>

            <textarea 
              placeholder="Zusätzliche Prüf-Notizen (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.2)', border: '1px solid #27272a', borderRadius: 16, padding: 16, color: 'white', fontSize: '0.9rem', resize: 'none', marginBottom: 24, outline: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => handleActionInitiation('approved')}
                disabled={processing || !canApprove}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: canApprove ? '#8b5cf6' : '#27272a', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: canApprove ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s'
                }}
              >
                {processing ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Genehmigen & Loggen</>}
              </button>
              
              <button 
                onClick={() => handleActionInitiation('rejected')}
                disabled={processing}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.2)', background: 'transparent', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <AlertCircle size={18} /> Bewerbung Ablehnen
              </button>
            </div>
            
            {!canApprove && (
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>
                <Info size={14} /> Checklist abschließen um zu genehmigen
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: 24, padding: 20, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontWeight: 800, marginBottom: 8, fontSize: '0.85rem' }}>
                <AlertTriangle size={18} /> Wichtiger Hinweis
             </div>
             <p style={{ color: 'rgba(248, 113, 113, 0.7)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Die Genehmigung schaltet den Benutzer als Betreiber frei und erstellt automatisch einen Venue-Platzhalter. Dieser Schritt ist endgültig.
             </p>
          </div>
        </div>

      </div>

      {/* CUSTOM CONFIRM MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowConfirmModal(false)}
               style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
             />
             
             {/* Modal Card */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#09090b', borderRadius: 32, border: '1px solid #27272a', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
             >
                <div style={{ padding: 32 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: pendingAction === 'approved' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pendingAction === 'approved' ? '#8b5cf6' : '#f87171', marginBottom: 24, border: `1px solid ${pendingAction === 'approved' ? '#8b5cf622' : '#f8717122'}` }}>
                     {pendingAction === 'approved' ? <Shield size={28} /> : <AlertTriangle size={28} />}
                  </div>
                  
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 12 }}>
                    Bewerbung {pendingAction === 'approved' ? 'genehmigen' : 'ablehnen'}?
                  </h2>
                  
                  <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32 }}>
                    Bist du sicher, dass du <strong>{app.venue_name}</strong> {pendingAction === 'approved' ? 'freischalten' : 'ablehnen'} möchtest? Diese Aktion wird dauerhaft im Audit-Log protokolliert.
                  </p>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid #27272a', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Abbrechen
                    </button>
                    <button 
                      onClick={handleConfirmedAction}
                      style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: pendingAction === 'approved' ? '#8b5cf6' : '#f87171', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: `0 10px 20px ${pendingAction === 'approved' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}
                    >
                      Ja, Bestätigen
                    </button>
                  </div>
                </div>
                
                {/* Visual Accent */}
                <div style={{ height: 4, background: pendingAction === 'approved' ? 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' : 'linear-gradient(90deg, transparent, #f87171, transparent)' }} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
