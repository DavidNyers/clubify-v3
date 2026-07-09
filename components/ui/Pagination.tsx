'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
}

/**
 * Premium reusable Pagination component.
 */
export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `${baseUrl || pathname}?${params.toString()}`
  }

  // Generate page numbers to show
  const getPages = () => {
    const pages = []
    const delta = 2 // Number of pages before and after current page
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, marginBottom: 20 }}>
      {/* PREV */}
      <Link
        href={currentPage > 1 ? createPageUrl(currentPage - 1) : '#'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          color: currentPage > 1 ? 'white' : '#3f3f46',
          cursor: currentPage > 1 ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
        className={currentPage > 1 ? 'hover-bg-violet hover-translate' : ''}
      >
        <ChevronLeft size={20} />
      </Link>

      {/* NUMBERS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {getPages().map((page, index) => {
          if (page === '...') {
            return <div key={`dots-${index}`} style={{ color: '#3f3f46', width: 44, textAlign: 'center' }}>...</div>
          }

          const isActive = page === currentPage
          return (
            <Link
              key={page}
              href={createPageUrl(page as number)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, height: 44, borderRadius: 12,
                background: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`,
                color: isActive ? 'white' : '#a1a1aa',
                textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 8px 16px rgba(139, 92, 246, 0.2)' : 'none'
              }}
              className={!isActive ? 'hover-bg-violet hover-translate' : ''}
            >
              {page}
            </Link>
          )
        })}
      </div>

      {/* NEXT */}
      <Link
        href={currentPage < totalPages ? createPageUrl(currentPage + 1) : '#'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          color: currentPage < totalPages ? 'white' : '#3f3f46',
          cursor: currentPage < totalPages ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
        className={currentPage < totalPages ? 'hover-bg-violet hover-translate' : ''}
      >
        <ChevronRight size={20} />
      </Link>
    </div>
  )
}
