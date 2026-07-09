import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getAccountingTransactions, getAccountingKPIs, getMonthlySummary } from '@/lib/actions/admin/AccountingActions'
import AccountingClient from './AccountingClient'

export const dynamic = 'force-dynamic'

export default async function AdminAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>
}) {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/dashboard/user')

  const params = await searchParams
  const year = parseInt(params.year || String(new Date().getFullYear()))
  const page = parseInt(params.page || '1')

  const [{ transactions, total, totalPages, currentPage }, kpis, monthlySummary] = await Promise.all([
    getAccountingTransactions({ year, page, pageSize: 200 }), // load more for client-side filtering
    getAccountingKPIs(year),
    getMonthlySummary(year),
  ])

  return (
    <AccountingClient
      initialTransactions={transactions}
      monthlySummary={monthlySummary}
      kpis={kpis}
      year={year}
      total={total}
      totalPages={totalPages}
    />
  )
}
