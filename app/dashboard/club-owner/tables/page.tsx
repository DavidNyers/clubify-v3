'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  GlassWater, Plus, Edit2, Trash2, Check, X, 
  Calendar, Users, Info, Loader2, ClipboardList,
  Search, Filter, ChevronRight, Armchair
} from 'lucide-react'
import { 
  createTablePackage, updateTablePackage, updateReservationStatus 
} from '@/lib/actions/club/TableActions'
import { motion, AnimatePresence } from 'framer-motion'

export default function TableManagementPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'packages' | 'reservations'>('reservations')

  // Modal State
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any>(null)

  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userClubs } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('owner_id', user.id)

      if (userClubs && userClubs.length > 0) {
        setClubs(userClubs)
        setSelectedClubId(userClubs[0].id)
      }
      setLoading(false)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedClubId) return
    loadClubData()
  }, [selectedClubId])

  async function loadClubData() {
    const supabase = createClient()
    const [
      { data: pkgData },
      { data: resData }
    ] = await Promise.all([
      supabase.from('table_packages').select('*').eq('club_id', selectedClubId).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, users(full_name, email), table_packages(name)').eq('club_id', selectedClubId).eq('booking_type', 'vip').order('reservation_date', { ascending: true })
    ])

    setPackages(pkgData || [])
    setReservations(resData || [])
  }

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'rejected') => {
    if (!confirm(`Soll diese Reservierung wirklich ${status === 'confirmed' ? 'bestätigt' : 'abgelehnt'} werden?`)) return
    const res = await updateReservationStatus(id, status)
    if (res.success) loadClubData()
  }

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
  if (clubs.length === 0) return <div style={{ padding: 32 }}>Du hast noch keine Locations erstellt.</div>

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Armchair style={{ color: '#8b5cf6' }} size={32} /> Tisch-Management
          </h1>
          <p style={{ color: '#71717a' }}>Angebote und Reservierungen verwalten</p>
        </div>
        
        <select 
          value={selectedClubId || ''} 
          onChange={(e) => setSelectedClubId(e.target.value)}
          style={{ background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '10px 16px', borderRadius: 12, outline: 'none' }}
        >
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #27272a', marginBottom: 32 }}>
        <button 
          onClick={() => setActiveTab('reservations')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            color: activeTab === 'reservations' ? '#8b5cf6' : '#71717a',
            borderBottom: `2px solid ${activeTab === 'reservations' ? '#8b5cf6' : 'transparent'}`,
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Reservierungen
        </button>
        <button 
          onClick={() => setActiveTab('packages')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            color: activeTab === 'packages' ? '#8b5cf6' : '#71717a',
            borderBottom: `2px solid ${activeTab === 'packages' ? '#8b5cf6' : 'transparent'}`,
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Flaschenpakete
        </button>
      </div>

      {activeTab === 'reservations' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reservations.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed #27272a' }}>
              <Calendar size={48} style={{ color: '#3f3f46', marginBottom: 16 }} />
              <p style={{ color: '#a1a1aa' }}>Noch keine Tisch-Reservierungen vorhanden.</p>
            </div>
          ) : (
            reservations.map(res => (
              <div key={res.id} className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, border: '1px solid #27272a', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 2 }}>{res.users?.full_name || 'Gast'} • {res.table_packages?.name || 'Standard Tisch'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#71717a' }}>{new Date(res.reservation_date).toLocaleDateString('de-DE')} • {res.guests} Personen</div>
                    {res.notes && <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginTop: 4, fontStyle: 'italic' }}>"{res.notes}"</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                    background: res.status === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' : res.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: res.status === 'confirmed' ? '#22c55e' : res.status === 'pending' ? '#f59e0b' : '#f87171'
                  }}>
                    {res.status.toUpperCase()}
                  </span>

                  {res.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleStatusUpdate(res.id, 'rejected')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                      <button onClick={() => handleStatusUpdate(res.id, 'confirmed')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Aktive Angebote</h2>
            <button 
              onClick={() => { setEditingPackage(null); setShowPackageModal(true); }}
              style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> Neues Paket
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {packages.map(pkg => (
              <div key={pkg.id} className="glass" style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 24, border: '1px solid #27272a', padding: 24, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                   <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} style={{ color: '#a78bfa' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingPackage(pkg); setShowPackageModal(true); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><Edit2 size={16} /></button>
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>{pkg.name}</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>{pkg.price} €</div>
                
                <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: 20, minHeight: 40 }}>{pkg.description}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pkg.items?.map((item: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#a1a1aa' }}>
                      <Check size={12} style={{ color: '#22c55e' }} /> {item}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#71717a' }}>
                  <span><Users size={12} /> max. {pkg.max_guests} Gäste</span>
                  <span style={{ color: pkg.status === 'active' ? '#22c55e' : '#f87171' }}>● {pkg.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Form Modal (Simplified for this version) */}
      <AnimatePresence>
        {showPackageModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 28, padding: 32, width: '100%', maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingPackage ? 'Paket bearbeiten' : 'Neues Flaschenpaket'}</h2>
                <button onClick={() => setShowPackageModal(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  name: formData.get('name'),
                  price: parseFloat(formData.get('price') as string),
                  description: formData.get('description'),
                  max_guests: parseInt(formData.get('max_guests') as string),
                  items: (formData.get('items') as string).split(',').map(i => i.trim()),
                  status: 'active'
                }

                if (editingPackage) await updateTablePackage(editingPackage.id, data)
                else await createTablePackage(selectedClubId!, data)
                
                setShowPackageModal(false)
                loadClubData()
              }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', marginBottom: 8 }}>Paket-Name</label>
                  <input name="name" defaultValue={editingPackage?.name} required style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', marginBottom: 8 }}>Preis (€)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingPackage?.price} required style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', marginBottom: 8 }}>Max. Gäste</label>
                    <input name="max_guests" type="number" defaultValue={editingPackage?.max_guests} required style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', marginBottom: 8 }}>Beschreibung</label>
                  <textarea name="description" defaultValue={editingPackage?.description} rows={3} style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white', resize: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#71717a', marginBottom: 8 }}>Inhalt (mit Komma getrennt)</label>
                  <input name="items" defaultValue={editingPackage?.items?.join(', ')} placeholder="0.7L Vodka, 4 Mixers, ..." style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, padding: 12, color: 'white' }} />
                </div>

                <button type="submit" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', border: 'none', padding: 14, borderRadius: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                  Speichern
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
