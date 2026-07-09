'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X, AlertTriangle, ShieldAlert } from 'lucide-react'
import { submitReport } from '@/lib/actions/user/ContentActions'
import { motion, AnimatePresence } from 'framer-motion'

interface ReportModalProps {
  targetId: string
  targetType: 'review' | 'comment' | 'club' | 'bar' | 'event' | 'user'
  trigger: React.ReactNode
}

const REPORT_REASONS = [
  'Spam / Werbung',
  'Beleidigung / Hassrede',
  'Falschinformation',
  'Unangemessener Inhalt',
  'Sonstiges'
]

export default function ReportModal({ targetId, targetType, trigger }: ReportModalProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    
    setLoading(true)
    try {
      await submitReport({ targetId, targetType, reason, description })
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setReason('')
        setDescription('')
      }, 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay 
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
            backdropFilter: 'blur(4px)', zIndex: 9999
          }} 
        />
        <Dialog.Content 
          style={{ 
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: 450, background: '#18181b', border: '1px solid #27272a',
            borderRadius: 24, padding: 32, zIndex: 10000, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Dialog.Title style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={22} style={{ color: '#ef4444' }} />
              Inhalt melden
            </Dialog.Title>
            <Dialog.Close asChild>
              <button style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '40px 0' }}
              >
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <AlertTriangle size={32} style={{ color: '#22c55e' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Danke für deine Meldung</h3>
                <p style={{ color: '#a1a1aa' }}>Ein Moderator wird den Inhalt zeitnah prüfen.</p>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#a1a1aa', marginBottom: 12 }}>Grund der Meldung</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {REPORT_REASONS.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        style={{
                          padding: '10px 12px', borderRadius: 12, border: '1px solid',
                          borderColor: reason === r ? '#ef4444' : '#27272a',
                          background: reason === r ? '#ef444410' : '#09090b',
                          color: reason === r ? 'white' : '#a1a1aa',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s', textAlign: 'left'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#a1a1aa', marginBottom: 12 }}>Zusätzliche Details (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Erläutere kurz das Problem..."
                    style={{
                      width: '100%', minHeight: 100, background: '#09090b', border: '1px solid #27272a',
                      borderRadius: 16, padding: 16, color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none'
                    }}
                  />
                </div>

                <button
                  disabled={!reason || loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 16, background: '#ef4444',
                    color: 'white', fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                    opacity: (!reason || loading) ? 0.5 : 1, transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Sende Meldung...' : 'Meldung absenden'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
