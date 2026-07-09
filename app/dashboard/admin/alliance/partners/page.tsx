import React from 'react'
import Link from 'next/link'
import { ChevronLeft, Shield, Users, Zap } from 'lucide-react'
import { getPartnerDirectory } from '@/lib/actions/alliance/AllianceActions'
import AlliancePartnerManager from '@/components/admin/alliance/AlliancePartnerManager'

export const dynamic = 'force-dynamic'

export default async function AlliancePartnersPage() {
  const partners = await getPartnerDirectory()

  return (
    <div style={{ padding: '32px 32px', flex: 1, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Breadcrumbs & Header */}
      <div style={{ marginBottom: 48 }}>
        <Link 
          href="/dashboard/admin/alliance"
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', 
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, marginBottom: 20,
            transition: 'color 0.2s'
          }}
          className="hover-text-white"
        >
          <ChevronLeft size={16} /> Zurück zur Übersicht
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: '8px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                <Shield size={24} />
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em' }}>Partner Management</h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Verwalte Alliance-Teilnahme, Multiplikatoren und Benefits für Clubs, Bars und Events.</p>
          </div>

          <div style={{ display: 'flex', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Partner</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{partners.length}</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.05)', alignSelf: 'center' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Aktiv</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22c55e' }}>{partners.filter(p => p.isActive).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Manager UI */}
      <AlliancePartnerManager initialPartners={partners} />

    </div>
  )
}
