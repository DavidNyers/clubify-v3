'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Check, Trash2, Shield, Calendar, CreditCard, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  read: boolean
  created_at: string
}

interface NotificationsClientProps {
  initialNotifications: Notification[]
  userId: string
}

export default function NotificationsClient({ initialNotifications, userId }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: !currentRead })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: !currentRead } : n))
      )
    } catch (err) {
      console.error('Error toggling read state:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const getIcon = (type: string) => {
    const style = { size: 18 }
    switch (type) {
      case 'alliance':
      case 'alliance_subscription':
        return { icon: <Shield {...style} />, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' }
      case 'booking':
      case 'reservation':
        return { icon: <Calendar {...style} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' }
      case 'payment':
      case 'stripe':
        return { icon: <CreditCard {...style} />, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
      default:
        return { icon: <Info {...style} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
          {unreadCount > 0 ? (
            <span>Du hast <strong style={{ color: '#fbbf24' }}>{unreadCount}</strong> ungelesene Nachricht{unreadCount === 1 ? '' : 'en'}.</span>
          ) : (
            <span>Alle Nachrichten gelesen.</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', 
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            className="hover-bg-elevated"
          >
            <Check size={14} /> Alle als gelesen markieren
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              style={{ 
                textAlign: 'center', padding: '64px 20px', 
                background: 'rgba(30, 41, 59, 0.2)', borderRadius: 24, 
                border: '1px dashed rgba(255,255,255,0.1)' 
              }}
            >
              <BellOff size={48} style={{ color: '#334155', margin: '0 auto 20px' }} />
              <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: 6 }}>Keine Benachrichtigungen</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Wir halten dich auf dem Laufenden, sobald etwas Wichtiges passiert.</p>
            </motion.div>
          ) : (
            notifications.map(n => {
              const meta = getIcon(n.type)
              return (
                <motion.div 
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass"
                  style={{ 
                    background: n.read ? 'rgba(24, 24, 27, 0.4)' : 'rgba(30, 41, 59, 0.6)', 
                    borderRadius: 20, 
                    border: n.read ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(251, 191, 36, 0.2)', 
                    padding: 20, 
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Indicator Dot */}
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', marginTop: 14, flexShrink: 0 }} />
                  )}

                  {/* Icon */}
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: meta.bg, color: meta.color, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, marginTop: !n.read ? 0 : 2
                  }}>
                    {meta.icon}
                  </div>

                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>{n.title}</h4>
                    {n.message && (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                    )}
                    <span style={{ display: 'block', color: '#475569', fontSize: '0.75rem', marginTop: 8 }}>
                      {new Date(n.created_at).toLocaleString('de-AT', { 
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button 
                      onClick={() => handleToggleRead(n.id, n.read)}
                      title={n.read ? "Als ungelesen markieren" : "Als gelesen markieren"}
                      style={{ 
                        width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)', color: n.read ? '#64748b' : '#22c55e',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(n.id)}
                      title="Löschen"
                      style={{ 
                        width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.1)', color: '#f87171',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
