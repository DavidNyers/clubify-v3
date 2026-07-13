'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import VenueReservationForm from './VenueReservationForm'

interface VenueReservationModalProps {
  venueId: string
  venueType: 'bar' | 'club'
  venueName: string
  trigger: React.ReactNode
}

export default function VenueReservationModal({ venueId, venueType, venueName, trigger }: VenueReservationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="sidebar-booking-container" style={{ width: '100%' }}>
        {trigger}
      </div>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} 
              />

              {/* Modal Content */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="reservation-modal-content"
                style={{ 
                  position: 'relative', width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto',
                  background: '#18181b', border: '1px solid #27272a', borderRadius: 32,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', zIndex: 10
                }}
              >
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a1a1aa', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>


                <VenueReservationForm 
                  venueId={venueId}
                  venueType={venueType}
                  venueName={venueName}
                  source="app"
                  onClose={() => setIsOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
