'use server'

import { createClient } from '@/lib/supabase/server'

export type TransactionType = 'ticket' | 'table_booking' | 'subscription' | 'alliance_share' | 'alliance_payout' | 'refund'
export type TransactionStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'calculated' | 'completed'

export interface AccountingTransaction {
  id: string
  invoice_number: string
  date: string
  type: TransactionType
  description: string
  user_email: string | null
  user_name: string | null
  gross_eur: number
  vat_rate: number
  vat_eur: number
  net_eur: number
  status: TransactionStatus
  stripe_id: string | null
  currency: string
}

export interface MonthlyRevenueSummary {
  month: string
  month_label: string
  ticket_revenue: number
  subscription_revenue: number
  alliance_revenue: number
  alliance_share: number
  payouts: number
  net_gross: number
}

export interface AccountingKPIs {
  total_year: number
  total_month: number
  pending_payouts: number
  clubify_net: number
  transaction_count: number
  refund_total: number
  alliance_total: number
  alliance_share_total: number
}

const GERMAN_MONTHS = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

function calcVat(gross: number, rate = 0.20) {
  const net = gross / (1 + rate)
  return { net: Math.round(net * 100) / 100, vat: Math.round((gross - net) * 100) / 100 }
}

export async function getAccountingTransactions(filters: {
  year?: number
  type?: TransactionType | 'all'
  status?: TransactionStatus | 'all'
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ transactions: AccountingTransaction[]; total: number; totalPages: number; currentPage: number }> {
  const supabase = await createClient()
  const year = filters.year ?? new Date().getFullYear()
  const pageSize = filters.pageSize ?? 200

  const startDate = new Date(year, 0, 1).toISOString()
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString()

  const allTransactions: AccountingTransaction[] = []
  let invoiceCounter = 0

  // ── 1. PAYMENTS (Tickets, Tischbuchungen, Erstattungen) ──
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, amount, currency, status, refunded, refund_amount, created_at,
      stripe_session_id, stripe_payment_intent_id,
      users:user_id ( email, full_name ),
      bookings:booking_id (
        id, event_id, club_id, bar_id,
        events:event_id ( name, date ),
        clubs:club_id ( name ),
        bars:bar_id ( name )
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  for (const p of (payments || []) as any[]) {
    invoiceCounter++
    const booking = p.bookings
    const isRefund = p.refunded && Number(p.refund_amount) > 0
    const isTicket = booking?.event_id != null
    const isTable = (booking?.club_id != null || booking?.bar_id != null) && !isTicket

    let type: TransactionType = 'ticket'
    let description = ''

    if (isRefund && p.status === 'refunded') {
      type = 'refund'
      description = 'Rückerstattung'
    } else if (isTicket) {
      type = 'ticket'
      const eventName = booking?.events?.name || 'Event'
      const eventDate = booking?.events?.date ? ' (' + new Date(booking.events.date).toLocaleDateString('de-AT') + ')' : ''
      description = `Ticket: ${eventName}${eventDate}`
    } else if (isTable) {
      type = 'table_booking'
      description = `Tischreservierung: ${booking?.clubs?.name || booking?.bars?.name || 'Venue'}`
    } else {
      description = 'Zahlung'
    }

    const amount = isRefund ? -Number(p.refund_amount || 0) : Number(p.amount)
    const { net, vat } = calcVat(amount)

    allTransactions.push({
      id: p.id,
      invoice_number: `CLB-${year}-${String(invoiceCounter).padStart(4, '0')}`,
      date: p.created_at,
      type,
      description,
      user_email: p.users?.email ?? null,
      user_name: p.users?.full_name ?? null,
      gross_eur: Math.round(amount * 100) / 100,
      vat_rate: 0.20,
      vat_eur: vat,
      net_eur: net,
      status: p.refunded ? 'refunded' : (p.status as TransactionStatus),
      stripe_id: p.stripe_payment_intent_id || p.stripe_session_id || null,
      currency: p.currency || 'EUR',
    })
  }

  // ── 2. ALLIANCE SETTLEMENTS (100% Subscription Revenue) ──
  const { data: settlements } = await supabase
    .from('alliance_monthly_settlements')
    .select('*')
    .gte('month_start', `${year}-01-01`)
    .lte('month_start', `${year}-12-31`)
    .order('month_start', { ascending: false })

  for (const s of (settlements || []) as any[]) {
    invoiceCounter++
    const monthDate = new Date(s.month_start)
    const monthLabel = GERMAN_MONTHS[monthDate.getMonth()]
    const totalRev = Number(s.total_revenue)
    const { net, vat } = calcVat(totalRev)

    allTransactions.push({
      id: s.id + '-rev',
      invoice_number: `ALC-${year}-${String(invoiceCounter).padStart(4, '0')}`,
      date: s.month_start,
      type: 'subscription',
      description: `Alliance Abo-Umsatz gesamt — ${monthLabel} ${year}`,
      user_email: null,
      user_name: 'Alliance Subscriptions',
      gross_eur: Math.round(totalRev * 100) / 100,
      vat_rate: 0.20,
      vat_eur: vat,
      net_eur: net,
      status: s.status === 'completed' ? 'paid' : (s.status === 'calculated' ? 'pending' : 'paid'),
      stripe_id: null,
      currency: 'EUR',
    })
  }

  // ── 3. ACTUAL VENUE PAYOUTS (Cash Flow Out) ──
  const { data: realPayouts } = await supabase
    .from('alliance_venue_payouts')
    .select('*')
    .gte('paid_at', startDate)
    .lte('paid_at', endDate)
    .order('paid_at', { ascending: false })

  for (const p of (realPayouts || []) as any[]) {
    invoiceCounter++
    const amount = Number(p.amount_eur)
    const { net, vat } = calcVat(amount)

    allTransactions.push({
      id: p.id,
      invoice_number: `PAY-${year}-${String(invoiceCounter).padStart(4, '0')}`,
      date: p.paid_at || p.created_at,
      type: 'alliance_payout',
      description: `Auszahlung an Partner (ID: ${p.target_id.substring(0,8)}…)`,
      user_email: null,
      user_name: 'Alliance Partner',
      gross_eur: -Math.round(amount * 100) / 100,
      vat_rate: 0.20,
      vat_eur: -vat,
      net_eur: -net,
      status: p.payout_status === 'paid' ? 'paid' : 'pending',
      stripe_id: p.stripe_transfer_id || null,
      currency: 'EUR',
    })
  }

  // Sort by date descending
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply type/status/search filters
  let filtered = allTransactions
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(t => t.type === filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(t => t.status === filters.status)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.user_email?.toLowerCase().includes(q) ||
      t.user_name?.toLowerCase().includes(q) ||
      t.invoice_number.toLowerCase().includes(q) ||
      t.stripe_id?.toLowerCase().includes(q)
    )
  }

  return {
    transactions: filtered,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage: 1,
  }
}

export async function getAccountingKPIs(year: number): Promise<AccountingKPIs> {
  const supabase = await createClient()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Payments
  const { data: yearPayments } = await supabase
    .from('payments').select('amount, status, refunded, refund_amount')
    .eq('status', 'paid')
    .gte('created_at', new Date(year, 0, 1).toISOString())
    .lte('created_at', new Date(year, 11, 31, 23, 59, 59).toISOString())

  const paymentTotal = (yearPayments || []).reduce((s: number, p: any) =>
    s + Number(p.amount) - (p.refunded ? Number(p.refund_amount || 0) : 0), 0)
  const refundTotal = (yearPayments || []).filter((p: any) => p.refunded)
    .reduce((s: number, p: any) => s + Number(p.refund_amount || 0), 0)

  // Alliance settlements (Revenue side)
  const { data: settlements } = await supabase
    .from('alliance_monthly_settlements')
    .select('total_revenue, clubify_share, alliance_pool, month_start, status')
    .gte('month_start', `${year}-01-01`)
    .lte('month_start', `${year}-12-31`)

  const allianceTotal = (settlements || []).reduce((s: number, st: any) => s + Number(st.total_revenue || 0), 0)
  const allianceShareTotal = (settlements || []).reduce((s: number, st: any) => s + Number(st.clubify_share || 0), 0)
  const alliancePoolTotal = (settlements || []).reduce((s: number, st: any) => s + Number(st.alliance_pool || 0), 0)

  // Current month revenue
  const currentSettlement = (settlements || []).find((st: any) => (st.month_start as string).startsWith(currentMonth))
  const monthRevenue = currentSettlement ? Number(currentSettlement.total_revenue) : 0

  // Actual payouts (Expense side)
  const { data: payouts } = await supabase
    .from('alliance_venue_payouts').select('amount_eur, payout_status')
    .gte('created_at', new Date(year, 0, 1).toISOString())
    .lte('created_at', new Date(year, 11, 31, 23, 59, 59).toISOString())

  const payoutTotal = (payouts || []).filter(p => p.payout_status === 'paid').reduce((s: number, p: any) => s + Number(p.amount_eur), 0)
  const pendingTotal = (payouts || []).filter(p => p.payout_status === 'pending').reduce((s: number, p: any) => s + Number(p.amount_eur), 0)

  const totalYear = paymentTotal + allianceTotal
  const totalMonth = monthRevenue + (yearPayments || []).filter((p: any) => {
    const d = new Date(p.created_at || '')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s: number, p: any) => s + Number(p.amount), 0)

  return {
    total_year: Math.round(totalYear * 100) / 100,
    total_month: Math.round(totalMonth * 100) / 100,
    pending_payouts: Math.round(alliancePoolTotal * 100) / 100, // Show total pool liability
    clubify_net: Math.round((paymentTotal + allianceShareTotal) * 100) / 100, // Net = Tickets + 20%
    transaction_count: (yearPayments || []).length + (settlements || []).length,
    refund_total: Math.round(refundTotal * 100) / 100,
    alliance_total: Math.round(allianceTotal * 100) / 100,
    alliance_share_total: Math.round(allianceShareTotal * 100) / 100,
  }
}

export async function getMonthlySummary(year: number): Promise<MonthlyRevenueSummary[]> {
  const supabase = await createClient()

  const [{ data: payments }, { data: settlements }, { data: payouts }] = await Promise.all([
    supabase.from('payments').select('amount, status, refunded, refund_amount, created_at')
      .eq('status', 'paid')
      .gte('created_at', new Date(year, 0, 1).toISOString())
      .lte('created_at', new Date(year, 11, 31, 23, 59, 59).toISOString()),
    supabase.from('alliance_monthly_settlements')
      .select('month_start, total_revenue, clubify_share, alliance_pool, status')
      .gte('month_start', `${year}-01-01`)
      .lte('month_start', `${year}-12-31`),
    supabase.from('alliance_venue_payouts')
      .select('amount_eur, paid_at, payout_status')
      .gte('created_at', new Date(year, 0, 1).toISOString())
      .lte('created_at', new Date(year, 11, 31, 23, 59, 59).toISOString()),
  ])

  return Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`

    // Payments for this month
    const monthPayments = (payments || []).filter((p: any) => {
      const d = new Date(p.created_at)
      return d.getFullYear() === year && d.getMonth() === i
    })
    const ticketRev = monthPayments.reduce((s: number, p: any) =>
      s + Number(p.amount) - (p.refunded ? Number(p.refund_amount || 0) : 0), 0)

    // Alliance settlement for this month
    const settlement = (settlements || []).find((s: any) => (s.month_start as string).startsWith(monthStr))
    const allianceRevenue = settlement ? Number(settlement.total_revenue) : 0
    const allianceShare = settlement ? Number(settlement.clubify_share) : 0
    const alliancePool = settlement ? Number(settlement.alliance_pool) : 0

    // Actual Payouts this month (for transaction details only)
    const monthPayouts = (payouts || []).filter((p: any) => {
      if (!p.paid_at) return false
      const d = new Date(p.paid_at)
      return d.getFullYear() === year && d.getMonth() === i && p.payout_status === 'paid'
    })
    const payoutTotal = monthPayouts.reduce((acc: number, p: any) => acc + Number(p.amount_eur), 0)

    return {
      month: monthStr,
      month_label: `${GERMAN_MONTHS[i]} ${year}`,
      ticket_revenue: Math.round(ticketRev * 100) / 100,
      subscription_revenue: Math.round(allianceRevenue * 100) / 100,
      alliance_revenue: Math.round(allianceRevenue * 100) / 100,
      alliance_share: Math.round(allianceShare * 100) / 100,
      payouts: Math.round(alliancePool * 100) / 100, // Use the 80% pool from settlement
      net_gross: Math.round((ticketRev + allianceShare) * 100) / 100, // Clubify Net = Tickets + 20%
    }
  })
}
