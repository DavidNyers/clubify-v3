'use client'

import { useState, useEffect } from 'react'
import { 
  Check, X, Building2, Music, Users, Globe, MapPin, 
  Mail, Phone, Clock, Loader2, Edit2, Search, Filter,
  LayoutGrid, List as ListIcon, AlertCircle, Shield, FileText
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { moderateApplication } from '@/lib/actions/applications/ApplicationActions'

import Pagination from '@/components/ui/Pagination'
import { useRouter, useSearchParams } from 'next/navigation'

interface ApplicationListProps {
  initialApplications: any[]
  totalPages: number
  currentPage: number
  currentStatus: string
}

export default function ApplicationList({ 
  initialApplications, 
  totalPages, 
  currentPage, 
  currentStatus 
}: ApplicationListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState(initialApplications)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Sync state if props change (though usually router.refresh handles this)
  useEffect(() => {
    setApplications(initialApplications)
  }, [initialApplications])

  const handleTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('status', status)
    params.set('page', '1') // Reset to page 1 on filter change
    router.push(`/dashboard/admin/applications?${params.toString()}`)
  }

  // Filter & Search Logic
  // NOTE: Status filtering is now primarily server-side. 
  // We only keep the search term filtering client-side for "instant" feel.
  const filtered = applications.filter(a => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      a.venue_name?.toLowerCase().includes(term) ||
      a.contact_name?.toLowerCase().includes(term) ||
      a.contact_email?.toLowerCase().includes(term) ||
      a.location_city?.toLowerCase().includes(term)
    
    return matchesSearch
  })

  // Metrics (Can be passed from server in future for true accuracy)
  const TABS = [
    { id: 'pending', label: 'Ausstehend' },
    { id: 'approved', label: 'Genehmigt' },
    { id: 'rejected', label: 'Abgelehnt' },
    { id: 'all', label: 'Alle' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Search Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ color: '#71717a', fontSize: '0.9rem' }}>Prüfe und moderiere eingehende Anfragen von neuen Betreibern.</p>
        </div>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <input 
            type="text" 
            placeholder="Suchen nach Name, Email, Stadt..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: 'rgba(24, 24, 27, 0.4)', borderRadius: 16, border: '1px solid #27272a',
              padding: '12px 16px 12px 42px', color: 'white', outline: 'none', fontSize: '0.9rem'
            }} 
          />
        </div>
      </header>

      <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{ 
              padding: '10px 24px', borderRadius: 12, border: 'none', 
              background: currentStatus === tab.id ? '#8b5cf6' : 'rgba(255,255,255,0.02)', 
              color: currentStatus === tab.id ? 'white' : '#71717a', 
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
            className={currentStatus !== tab.id ? 'hover-bg-violet' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table (Match Venues style) */}
      <div style={{ background: 'rgba(24, 24, 27, 0.4)', borderRadius: 24, border: '1px solid #27272a', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #27272a' }}>
              <th style={{ padding: '20px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Location & Typ</th>
              <th style={{ padding: '20px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Kontakt / Ansprechpartner</th>
              <th style={{ padding: '20px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '20px 24px', color: '#71717a', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {filtered.map((item) => {
                const typeIcon = item.venue_type === 'club' ? <Building2 size={16} /> : item.venue_type === 'bar' ? <Music size={16} /> : <Users size={16} />
                const typeColor = item.venue_type === 'club' ? '#8b5cf6' : item.venue_type === 'bar' ? '#f472b6' : '#22d3ee'

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    className="hover-bg-muted"
                  >
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                         <div style={{ width: 44, height: 44, borderRadius: 12, background: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor, border: `1px solid ${typeColor}25` }}>
                            {typeIcon}
                         </div>
                         <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{item.venue_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                               <MapPin size={12} /> {item.location_city || 'Keine Angabe'} 
                               {item.website_url && <><span style={{ opacity: 0.3 }}>|</span> <Globe size={12} /> {new URL(item.website_url).hostname}</>}
                            </div>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>{item.contact_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{item.contact_email}</div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 800, padding: '6px 14px', borderRadius: 12, textTransform: 'uppercase',
                        background: item.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : item.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: item.status === 'approved' ? '#22c55e' : item.status === 'rejected' ? '#f87171' : '#f59e0b'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', gap: 10 }}>
                          {item.status === 'pending' ? (
                            <Link 
                              href={`/dashboard/admin/applications/${item.id}`}
                              style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: 8, background: '#27272a', border: 'none', color: '#a78bfa', padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' 
                              }}
                              className="hover-bg-violet hover-translate"
                            >
                               <Shield size={14} /> Prüfen
                            </Link>
                          ) : (
                            <Link 
                                href={`/dashboard/admin/applications/${item.id}`}
                                style={{ 
                                  color: '#a1a1aa', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 8, 
                                  textDecoration: 'none', 
                                  fontSize: '0.8rem', 
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.05)'
                                }}
                                className="hover-bg-violet hover-translate"
                            >
                               <FileText size={14} /> Log ansehen
                            </Link>
                          )}
                       </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr style={{ height: 200 }}>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: 0.3 }}>
                      <AlertCircle size={40} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Keine Bewerbungen gefunden.</div>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  )
}
