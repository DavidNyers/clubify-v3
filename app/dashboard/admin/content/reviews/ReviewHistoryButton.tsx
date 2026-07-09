'use client'

import { useState } from 'react'
import { History, X, Star, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ReviewHistoryButton({ history = [] }: { history: any[] }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!history || history.length === 0) return null

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hover-translate"
        style={{ 
          width: 36, height: 36, borderRadius: 10, 
          background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#a78bfa'
        }} 
        title="Verlauf anzeigen"
      >
        <History size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'relative', width: '100%', maxWidth: 450, background: '#0c0c0e', borderLeft: '1px solid #27272a', height: '100vh', padding: 40, overflowY: 'auto', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Versions-Verlauf</h2>
                <button onClick={() => setIsOpen(false)} style={{ background: '#1c1c1e', border: 'none', padding: 8, borderRadius: 12, color: 'white', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {history.map((entry, index) => (
                  <div key={index} style={{ borderBottom: '1px solid #1c1c1e', paddingBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                        {index === 0 ? 'Original' : `Version ${index}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {new Date(entry.edited_at).toLocaleString('de-AT')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < entry.rating ? '#f59e0b' : 'transparent'} color={i < entry.rating ? '#f59e0b' : '#3f3f46'} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{entry.text || 'Kein Text...'}"
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 40, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid #1c1c1e' }}>
                <p style={{ fontSize: '0.8rem', color: '#52525b', margin: 0, textAlign: 'center' }}>
                  Die aktuellste Version ist in der Hauptliste sichtbar.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
