'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteEvent } from '@/lib/actions/events/EventActions'

export default function EventListActions({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Möchtest du dieses Event wirklich unwiderruflich löschen?')) return
    
    setLoading(true)
    const res = await deleteEvent(eventId)
    
    if (!res.success) {
      alert('Fehler beim Löschen: ' + res.error)
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      style={{ 
        width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)', 
        background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' 
      }}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  )
}
