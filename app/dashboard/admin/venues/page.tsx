'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, Calendar, GlassWater, Loader2, Edit2, MapPin, Users, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminVenuesPage() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'bars' | 'events'>('clubs')
  const [clubs, setClubs] = useState<any[]>([])
  const [bars, setBars] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [
        { data: clubsData },
        { data: barsData },
        { data: eventsData }
      ] = await Promise.all([
        supabase.from('clubs').select('*, users(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('bars').select('*, users(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('events').select('*, users!events_manager_id_fkey(full_name, email)').order('date', { ascending: true })
      ])

      setClubs(clubsData || [])
      setBars(barsData || [])
      setEvents(eventsData || [])
      setLoading(false)
    }
    
    fetchData()
  }, [])

  const TABS = [
    { id: 'clubs', label: 'Clubs', icon: Building2, data: clubs },
    { id: 'bars', label: 'Bars', icon: GlassWater, data: bars },
    { id: 'events', label: 'Events', icon: Calendar, data: events }
  ]

  const rawActiveData = TABS.find(t => t.id === activeTab)?.data || []

  // Global Search Filter
  const activeData = rawActiveData.filter((item: any) => {
    const term = searchTerm.toLowerCase()
    return (
      item.name?.toLowerCase().includes(term) ||
      item.city?.toLowerCase().includes(term) ||
      item.address?.toLowerCase().includes(term) ||
      item.users?.full_name?.toLowerCase().includes(term)
    )
  })

  // Metrics
  const metrics = [
    { label: 'Gesamte Locations', value: clubs.length + bars.length, color: '#8b5cf6' },
    { label: 'Geplante Events', value: events.filter(e => new Date(e.date) > new Date()).length, color: '#ec4899' },
    { label: 'Gespeerte Objekte', value: [...clubs, ...bars, ...events].filter(i => i.status === 'suspended').length, color: '#f87171' }
  ]

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="animate-spin text-violet" size={40} /></div>
  }

  return (
    <div style={{ padding: 32, flex: 1, width: '100%' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Building2 style={{ color: '#8b5cf6' }} size={32} /> Locations & Events Setup
          </h1>
          <p style={{ color: '#71717a' }}>Verwalte alle Plattform-Objekte global mit vollen Administrator-Rechten.</p>
        </div>
        
        {/* Search input */}
        <div style={{ position: 'relative', width: 300 }}>
          <input 
            type="text" 
            placeholder="Suchen nach Name, Stadt, Besitzer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: 'rgba(24, 24, 27, 0.4)', borderRadius: 16, border: '1px solid #27272a',
              padding: '12px 16px', color: 'white', outline: 'none', fontSize: '0.9rem'
            }} 
          />
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 16, padding: 20, border: '1px solid #27272a' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #27272a', marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap', paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              padding: '12px 16px', background: 'none', border: 'none', 
              color: activeTab === tab.id ? 'white' : '#71717a',
              borderBottom: `2px solid ${activeTab === tab.id ? '#8b5cf6' : 'transparent'}`,
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <tab.icon size={16} style={{ color: activeTab === tab.id ? '#8b5cf6' : '#71717a' }} />
            {tab.label} <span style={{ background: '#27272a', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', color: '#a1a1aa' }}>{tab.data.length}</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 20, border: '1px solid #27272a', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #27272a' }}>
              <th style={{ padding: '16px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 700 }}>Name & Standort</th>
              <th style={{ padding: '16px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 700 }}>Verantwortlicher</th>
              <th style={{ padding: '16px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '16px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 700 }}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {activeData.map((item) => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  key={item.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {item.city || 'Keine Stadt'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{item.users?.full_name || 'Kein Besitzer'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{item.users?.email || '-'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: 12,
                      background: item.status === 'published' ? 'rgba(34, 197, 94, 0.1)' : item.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: item.status === 'published' ? '#22c55e' : item.status === 'suspended' ? '#f87171' : '#f59e0b'
                    }}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                     <Link 
                        href={`/dashboard/admin/venues/${activeTab}/${item.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#27272a', border: 'none', color: '#a78bfa', padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
                        className="hover-bg-violet hover-translate"
                      >
                       <Edit2 size={14} /> Bearbeiten
                     </Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {activeData.length === 0 && (
              <tr style={{ height: 100 }}>
                <td colSpan={4} style={{ textAlign: 'center', color: '#71717a' }}>Keine Einträge gefunden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
