'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Mail, User, Lock, Shield, Loader2 } from 'lucide-react'
import { adminCreateUser } from '@/lib/actions/admin/UserActions'
import { UserRole } from '@/lib/auth/rbac'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'user' as UserRole,
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await adminCreateUser(formData)
    
    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/admin/users')
      }, 2000)
    } else {
      setError(res.error || 'Fehler beim Erstellen des Benutzers')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/dashboard/admin/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgb(var(--text-secondary))', textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem', fontWeight: 500 }}>
        <ArrowLeft size={16} /> Zurück zur Liste
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'rgb(var(--text-primary))', marginBottom: 8 }}>
          Neuen Benutzer anlegen
        </h1>
        <p style={{ color: 'rgb(var(--text-secondary))' }}>
          Erstelle manuell ein neues Konto für die Plattform.
        </p>
      </div>

      <div className="glass" style={{ background: 'rgba(var(--bg-surface), 0.5)', borderRadius: 24, border: '1px solid rgb(var(--border))', padding: 32 }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <UserPlus size={32} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Benutzer erfolgreich angelegt!</h2>
            <p style={{ color: 'rgb(var(--text-secondary))' }}>Du wirst in Kürze zur Liste weitergeleitet...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', fontWeight: 600, marginBottom: 8 }}>Vollständiger Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 16, top: 14, color: 'rgb(var(--text-muted))' }} />
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Erika Mustermann" 
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgb(var(--border))', borderRadius: 12, color: 'white', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', fontWeight: 600, marginBottom: 8 }}>E-Mail Adresse</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 16, top: 14, color: 'rgb(var(--text-muted))' }} />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com" 
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgb(var(--border))', borderRadius: 12, color: 'white', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', fontWeight: 600, marginBottom: 8 }}>Rolle</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={{ position: 'absolute', left: 16, top: 14, color: 'rgb(var(--text-muted))' }} />
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgb(var(--border))', borderRadius: 12, color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="user">User</option>
                    <option value="club_owner">Club Owner</option>
                    <option value="bar_owner">Bar Owner</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', fontWeight: 600, marginBottom: 8 }}>Initiales Passwort (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 16, top: 14, color: 'rgb(var(--text-muted))' }} />
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Wird generiert wenn leer" 
                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgb(var(--border))', borderRadius: 12, color: 'white', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', 
                padding: '16px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              Benutzer erstellen
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
