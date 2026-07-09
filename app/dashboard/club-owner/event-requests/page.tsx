'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, XCircle, Loader2, MapPin, Building2, User } from 'lucide-react'
import { respondToVenueRequest } from '@/lib/actions/venue/EventVerificationActions'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function ClubOwnerEventRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchRequests() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Get clubs owned by this user
    const { data: myClubs } = await supabase.from('clubs').select('id, name').eq('owner_id', user.id)
    const clubIds = myClubs?.map(c => c.id) || []

    if (clubIds.length > 0) {
      // 2. Fetch pending events linked to these clubs
      const { data: events } = await supabase
        .from('events')
        .select('*, users!events_manager_id_fkey(full_name, email), clubs!events_club_id_fkey(name)')
        .in('club_id', clubIds)
        .eq('venue_verification_status', 'pending')
        .order('created_at', { ascending: false })

      setRequests(events || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleResponse = async (eventId: string, status: 'approved' | 'rejected') => {
    try {
      await respondToVenueRequest(eventId, status)
      // Removes the item from state after resolving
      setRequests(current => current.filter(r => r.id !== eventId))
    } catch (err) {
      alert('Aktion fehlgeschlagen. Bitte versuche es erneut.')
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="animate-spin text-violet" size={40} /></div>

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle style={{ color: '#8b5cf6' }} size={32} /> Eingehende Event-Anfragen
        </h1>
        <p style={{ color: '#71717a' }}>Externe Veranstalter, die deine Clubs als offizielle Location nutzen möchten.</p>
      </header>

      {requests.length === 0 ? (
        <div style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, padding: 40, border: '1px dashed #27272a', textAlign: 'center' }}>
          <CheckCircle size={40} style={{ color: '#27272a', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Alles auf dem neuesten Stand</h3>
          <p style={{ color: '#a1a1aa' }}>Aktuell liegen keine neuen Anfragen von Event-Managern vor.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {requests.map(req => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                style={{ background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', borderRadius: 20, padding: 24 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                       <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800 }}>AUSSTEHEND</span>
                       <span style={{ color: '#a1a1aa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(req.date).toLocaleDateString('de-DE')}</span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>{req.name}</h2>
                    <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: 16, maxWidth: 600 }}>{req.description}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: '0.85rem' }}>
                        <Building2 size={14} style={{ color: '#8b5cf6' }} /> Gewünschter Club: <strong>{req.clubs?.name}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: '0.85rem' }}>
                        <User size={14} style={{ color: '#3b82f6' }} /> Angefragt von: <strong>{req.users?.full_name}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, minWidth: 280 }}>
                     <button 
                       onClick={() => handleResponse(req.id, 'rejected')}
                       className="hover-bg-red"
                       style={{ flex: 1, background: '#18181b', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                       Ablehnen
                     </button>
                     <button 
                       onClick={() => handleResponse(req.id, 'approved')}
                       className="hover-bg-green"
                       style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.1)' }}
                     >
                       <CheckCircle size={16} className="inline mr-2" /> Bestätigen
                     </button>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
