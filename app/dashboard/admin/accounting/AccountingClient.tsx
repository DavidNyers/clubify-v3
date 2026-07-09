'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { 
  Download, Filter, Search, Receipt, TrendingUp, TrendingDown, 
  RefreshCw, ChevronLeft, ChevronRight, X, Calendar, Euro,
  ChevronDown
} from 'lucide-react'
import type { AccountingTransaction, MonthlyRevenueSummary, AccountingKPIs, TransactionType, TransactionStatus } from '@/lib/actions/admin/AccountingActions'

interface Props {
  initialTransactions: AccountingTransaction[]
  monthlySummary: MonthlyRevenueSummary[]
  kpis: AccountingKPIs
  year: number
  total: number
  totalPages: number
}

const TYPE_LABELS: Record<TransactionType | 'all', string> = {
  all: 'Alle Typen',
  ticket: '🎟 Ticket-Verkauf',
  table_booking: '🪑 Tischbuchung',
  subscription: '⚡️ Abo-Einnahmen',
  alliance_share: '💰 Clubify Provision',
  refund: '↩️ Rückerstattung',
  alliance_payout: '🏦 Venue-Auszahlung',
}

const STATUS_LABELS: Record<TransactionStatus | 'all', string> = {
  all: 'Alle Status',
  paid: 'Bezahlt',
  pending: 'Ausstehend',
  failed: 'Fehlgeschlagen',
  refunded: 'Erstattet',
  calculated: 'Berechnet',
  completed: 'Abgeschlossen',
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  refunded: '#8b5cf6',
  calculated: '#22d3ee',
  completed: '#22c55e',
}

const TYPE_COLORS: Record<string, string> = {
  ticket: '#8b5cf6',
  table_booking: '#ec4899',
  subscription: '#f59e0b',
  alliance_share: '#22c55e',
  refund: '#ef4444',
  alliance_payout: '#22d3ee',
}

function fmt(n: number, signed = false) {
  const prefix = signed && n > 0 ? '+' : ''
  return prefix + n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// ── CUSTOM DROPDOWN COMPONENT ──
function CustomDropdown<T extends string | number>({ 
  value, 
  options, 
  onChange, 
  label,
  width = 200
}: { 
  value: T, 
  options: { value: T, label: string }[], 
  onChange: (val: T) => void,
  label?: string,
  width?: number | string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '10px 16px', background: '#18181b', border: '1px solid #27272a', borderRadius: 12, color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', borderBottomLeftRadius: isOpen ? 0 : 12, borderBottomRightRadius: isOpen ? 0 : 12 }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption?.label || label || 'Wählen...'}
        </span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#71717a' }} />
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#18181b', border: '1px solid #27272a', borderTop: 'none', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 100, maxHeight: 300, overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              style={{ padding: '10px 16px', color: value === option.value ? 'white' : '#a1a1aa', fontSize: '0.875rem', fontWeight: value === option.value ? 700 : 500, cursor: 'pointer', background: value === option.value ? 'rgba(255,255,255,0.05)' : 'transparent', borderLeft: value === option.value ? '2px solid #22c55e' : 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = value === option.value ? 'rgba(255,255,255,0.05)' : 'transparent'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountingClient({ initialTransactions, monthlySummary, kpis, year, total, totalPages }: Props) {
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'transactions' | 'monthly'>('transactions')
  const [showPreview, setShowPreview] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isInQuarter = (date: string | Date, quarter: number) => {
    if (quarter === 0) return true
    const month = new Date(date).getMonth()
    if (quarter === 1) return month >= 0 && month <= 2
    if (quarter === 2) return month >= 3 && month <= 5
    if (quarter === 3) return month >= 6 && month <= 8
    if (quarter === 4) return month >= 9 && month <= 11
    return true
  }

  const filtered = initialTransactions.filter(t => {
    const matchQuarter = isInQuarter(t.date, selectedQuarter)
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchSearch = !search || 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.stripe_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.invoice_number.toLowerCase().includes(search.toLowerCase())
    return matchQuarter && matchType && matchStatus && matchSearch
  })

  const totalFiltered = filtered.reduce((acc, t) => acc + t.gross_eur, 0)
  const netFiltered = filtered.reduce((acc, t) => acc + t.net_eur, 0)
  const vatFiltered = filtered.reduce((acc, t) => acc + t.vat_eur, 0)
  
  const displayKpis = {
    ...kpis,
    total_year: selectedQuarter > 0 ? totalFiltered : kpis.total_year,
    clubify_net: selectedQuarter > 0 ? netFiltered : kpis.clubify_net,
    pending_payouts: selectedQuarter > 0 
      ? filtered.filter(t => t.type === 'alliance_payout').reduce((s, t) => s + Math.abs(t.gross_eur), 0)
      : kpis.pending_payouts,
    alliance_total: selectedQuarter > 0
      ? filtered.filter(t => t.type === 'subscription').reduce((s, t) => s + t.gross_eur, 0)
      : kpis.alliance_total
  }

  const handleExport = () => {
    const BOM = '\uFEFF'
    const headers = ['Belegnummer', 'Belegdatum', 'Typ', 'Beschreibung', 'Kunden-Name', 'Kunden-Email', 'Bruttobetrag (EUR)', 'MwSt-Satz (%)', 'MwSt-Betrag (EUR)', 'Nettobetrag (EUR)', 'Status', 'Stripe-ID', 'Währung'].join(';')
    const rows = filtered.map(t => [t.invoice_number, new Date(t.date).toLocaleDateString('de-AT'), TYPE_LABELS[t.type], `"${t.description.replace(/"/g, '""')}"`, `"${t.user_name || ''}"`, `"${t.user_email || ''}"`, t.gross_eur.toFixed(2).replace('.', ','), (t.vat_rate * 100).toFixed(0), t.vat_eur.toFixed(2).replace('.', ','), t.net_eur.toFixed(2).replace('.', ','), STATUS_LABELS[t.status], t.stripe_id || '', t.currency].join(';'))
    const csv = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Clubify-Buchhaltung-${selectedYear}${selectedQuarter > 0 ? '-Q' + selectedQuarter : ''}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - i, label: String(new Date().getFullYear() - i) }))
  const quarterOptions = [
    { value: 0, label: 'Gesamtes Jahr' },
    { value: 1, label: '1. Quartal (Q1)' },
    { value: 2, label: '2. Quartal (Q2)' },
    { value: 3, label: '3. Quartal (Q3)' },
    { value: 4, label: '4. Quartal (Q4)' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── PREVIEW MODAL ── */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={() => setShowPreview(false)} />
          <div className="glass" style={{ position: 'relative', width: '95%', maxWidth: 1100, maxHeight: '85vh', background: '#09090b', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>CSV-Vorschau</h2>
                <p style={{ color: '#71717a', fontSize: '0.8rem', margin: 0 }}>Vorschau der exportierbaren Belege für {selectedYear} {selectedQuarter > 0 ? `(Q${selectedQuarter})` : ''}</p>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: '#18181b', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#a1a1aa' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#09090b', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid #18181b' }}>
                    {['Beleg-Nr.', 'Datum', 'Typ', 'Beschreibung', 'Brutto', 'Netto', 'MwSt'].map(h => (
                      <th key={h} style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 800, color: '#52525b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #18181b' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{t.invoice_number}</td>
                      <td style={{ padding: '12px' }}>{new Date(t.date).toLocaleDateString('de-AT')}</td>
                      <td style={{ padding: '12px' }}>{TYPE_LABELS[t.type]}</td>
                      <td style={{ padding: '12px', color: 'white' }}>{t.description}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{fmt(t.gross_eur)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{fmt(t.net_eur)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{fmt(t.vat_eur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '24px 32px', borderTop: '1px solid #18181b', background: '#0c0c0e', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid #27272a', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={() => { handleExport(); setShowPreview(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                <Download size={18} /> Jetzt exportieren ({filtered.length} Belege)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={24} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0 }}>Buchhaltung</h1>
            <p style={{ color: '#71717a', fontSize: '0.9rem', margin: 0 }}>Alle Umsätze & Transaktionen — steuerberaterfertig</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <CustomDropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} width={100} />
          <CustomDropdown value={selectedQuarter} options={quarterOptions} onChange={setSelectedQuarter} width={180} />
          
          <button
            onClick={() => setShowPreview(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1px solid #27272a', background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', height: 42 }}
          >
            <Search size={16} /> CSV Vorschau
          </button>
          
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', height: 42 }}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { label: selectedQuarter > 0 ? `Umsatz Q${selectedQuarter} (Brutto)` : 'Jahresumsatz (Brutto)', value: fmt(displayKpis.total_year), sub: `${filtered.length} Transaktionen`, color: '#22c55e', icon: TrendingUp },
          { label: 'Monatsumsatz (Brutto)', value: fmt(displayKpis.total_month), sub: 'Aktueller Monat', color: '#8b5cf6', icon: Calendar },
          { label: 'Alliance Umsatz', value: fmt(displayKpis.alliance_total), sub: selectedQuarter > 0 ? `Q${selectedQuarter} – 100% Abos` : 'Abo-Einnahmen gesamt', color: '#f59e0b', icon: TrendingUp },
          { label: 'Clubify Netto', value: fmt(displayKpis.clubify_net), sub: 'Tickets + 20% Provision', color: '#22d3ee', icon: Euro },
          { label: 'Venue-Auszahlungen', value: fmt(displayKpis.pending_payouts), sub: '80% Alliance Pool', color: '#ef4444', icon: RefreshCw },
        ].map((kpi, i) => (
          <div key={i} className="glass" style={{ background: 'rgba(24,24,27,0.5)', borderRadius: 20, padding: 24, border: `1px solid ${kpi.color}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#52525b' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 14, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[{ id: 'transactions', label: 'Transaktionen' }, { id: 'monthly', label: 'Monatsübersicht' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: 700, background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#09090b' : '#71717a' }}>{tab.label}</button>
        ))}
      </div>

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === 'transactions' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Suche nach Name, Email, Belegnummer..." style={{ width: '100%', paddingLeft: 40, paddingRight: 12, height: 42, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, color: 'white', fontSize: '0.875rem', outline: 'none' }} />
            </div>
            
            <CustomDropdown 
              value={typeFilter} 
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} 
              onChange={(val) => { setTypeFilter(val as any); setCurrentPage(1); }} 
              width={220}
            />
            
            <CustomDropdown 
              value={statusFilter} 
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} 
              onChange={(val) => { setStatusFilter(val as any); setCurrentPage(1); }} 
              width={160}
            />

            {(search || typeFilter !== 'all' || statusFilter !== 'all' || selectedQuarter !== 0) && (
              <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setSelectedQuarter(0); }} style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>
                <X size={14} /> Reset
              </button>
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: 'flex', gap: 24, padding: '12px 20px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Auswahl ({filtered.length} Einträge):</span>
              <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 800 }}>Brutto: {fmt(totalFiltered)}</span>
              <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>MwSt: {fmt(vatFiltered)}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>Netto: {fmt(netFiltered)}</span>
            </div>
          )}

          <div className="glass" style={{ background: 'rgba(24,24,27,0.4)', borderRadius: 20, border: '1px solid #27272a', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', background: 'rgba(255,255,255,0.02)' }}>
                    {['Beleg-Nr.', 'Datum', 'Typ', 'Beschreibung', 'Kunde', 'Brutto', 'MwSt', 'Netto', 'Status'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#71717a', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (<tr><td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px', color: '#52525b' }}>Keine Einträge.</td></tr>)}
                  {filtered.slice((currentPage - 1) * 20, currentPage * 20).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.invoice_number}</td>
                      <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{new Date(t.date).toLocaleDateString('de-AT')}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: 6, background: `${TYPE_COLORS[t.type]}15`, color: TYPE_COLORS[t.type], fontSize: '0.7rem', fontWeight: 800 }}>{TYPE_LABELS[t.type]}</span></td>
                      <td style={{ padding: '12px 16px', color: 'white', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</td>
                      <td style={{ padding: '12px 16px' }}><div style={{ color: '#a1a1aa' }}>{t.user_name || '—'}</div><div style={{ color: '#52525b', fontSize: '0.7rem' }}>{t.user_email || ''}</div></td>
                      <td style={{ padding: '12px 16px', color: t.gross_eur < 0 ? '#f87171' : '#22c55e', fontWeight: 800, textAlign: 'right' }}>{fmt(t.gross_eur)}</td>
                      <td style={{ padding: '12px 16px', color: '#a78bfa', textAlign: 'right' }}>{fmt(t.vat_eur)}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'right' }}>{fmt(t.net_eur)}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: 6, background: `${STATUS_COLORS[t.status]}15`, color: STATUS_COLORS[t.status], fontSize: '0.7rem', fontWeight: 800 }}>{STATUS_LABELS[t.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20, borderTop: '1px solid #27272a' }}>
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
                <span style={{ color: '#71717a', fontSize: '0.85rem' }}>Seite {currentPage} von {Math.ceil(filtered.length / 20)}</span>
                <button disabled={currentPage >= Math.ceil(filtered.length / 20)} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', opacity: currentPage >= Math.ceil(filtered.length / 20) ? 0.4 : 1 }}><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'monthly' && (
        <div className="glass" style={{ background: 'rgba(24,24,27,0.4)', borderRadius: 20, border: '1px solid #27272a', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead><tr style={{ borderBottom: '1px solid #27272a', background: 'rgba(255,255,255,0.02)' }}>{['Monat', 'Ticket & Buchungen', 'Abo-Umsatz', '20% Clubify', '80% Venue', 'Netto', 'Trend'].map(h => (<th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#71717a', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
              <tbody>
                {monthlySummary.map((m, i) => {
                  const inQuarter = isInQuarter(m.month, selectedQuarter)
                  if (selectedQuarter > 0 && !inQuarter) return null
                  const prevNet = i > 0 ? monthlySummary[i - 1].net_gross : null
                  const trend = prevNet && prevNet !== 0 ? ((m.net_gross - prevNet) / Math.abs(prevNet)) * 100 : null
                  return (
                    <tr key={m.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: inQuarter && selectedQuarter > 0 ? 'rgba(34,197,94,0.02)' : 'transparent' }}>
                      <td style={{ padding: '14px 20px', color: 'white', fontWeight: 700 }}>{m.month_label}</td>
                      <td style={{ padding: '14px 20px', color: '#22c55e', textAlign: 'right' }}>{m.ticket_revenue > 0 ? fmt(m.ticket_revenue) : '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#f59e0b', textAlign: 'right' }}>{m.alliance_revenue > 0 ? fmt(m.alliance_revenue) : '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#22d3ee', textAlign: 'right' }}>{m.alliance_share > 0 ? fmt(m.alliance_share) : '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#f87171', textAlign: 'right' }}>{m.payouts > 0 ? fmt(-m.payouts) : '—'}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, textAlign: 'right', color: m.net_gross >= 0 ? '#22c55e' : '#f87171' }}>{fmt(m.net_gross)}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>{trend ? <span style={{ color: trend >= 0 ? '#22c55e' : '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</span> : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px 20px', color: 'white', fontWeight: 900 }}>Gesamt {selectedQuarter > 0 ? `Q${selectedQuarter}` : selectedYear}</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 900, textAlign: 'right' }}>{fmt(monthlySummary.filter(m => isInQuarter(m.month, selectedQuarter)).reduce((s, m) => s + m.ticket_revenue, 0))}</td>
                  <td style={{ padding: '16px 20px', color: '#f59e0b', fontWeight: 900, textAlign: 'right' }}>{fmt(monthlySummary.filter(m => isInQuarter(m.month, selectedQuarter)).reduce((s, m) => s + m.alliance_revenue, 0))}</td>
                  <td style={{ padding: '16px 20px', color: '#22d3ee', fontWeight: 900, textAlign: 'right' }}>{fmt(monthlySummary.filter(m => isInQuarter(m.month, selectedQuarter)).reduce((s, m) => s + m.alliance_share, 0))}</td>
                  <td style={{ padding: '16px 20px', color: '#f87171', fontWeight: 900, textAlign: 'right' }}>{fmt(-monthlySummary.filter(m => isInQuarter(m.month, selectedQuarter)).reduce((s, m) => s + m.payouts, 0))}</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 900, textAlign: 'right' }}>{fmt(monthlySummary.filter(m => isInQuarter(m.month, selectedQuarter)).reduce((s, m) => s + m.net_gross, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
