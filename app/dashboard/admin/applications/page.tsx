import { getApplications } from '@/lib/actions/applications/ApplicationActions'
import ApplicationList from './ApplicationList'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const status = params.status || 'pending'
  const pageSize = 10
  
  const res = await getApplications(status, page, pageSize)
  const initialApplications = res.success ? res.data : []
  const totalPages = (res.success ? res.totalPages : 0) ?? 0
  const currentPage = (res.success ? res.currentPage : 1) ?? 1

  return (
    <div style={{ padding: '32px', flex: 1 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Partner-Bewerbungen
        </h1>
        <p style={{ color: 'rgb(var(--text-secondary))' }}>
          Prüfe neue Anfragen für Clubs, Bars und Events.
        </p>
      </div>

      <ApplicationList 
        initialApplications={initialApplications || []} 
        totalPages={totalPages}
        currentPage={currentPage}
        currentStatus={status}
      />
    </div>
  )
}
