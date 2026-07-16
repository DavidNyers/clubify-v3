'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Music2, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) return

    if (password !== confirmPassword) {
      setServerError('Die Passwörter stimmen nicht überein.')
      return
    }

    if (password.length < 6) {
      setServerError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setLoading(true)
    setServerError('')

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setServerError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    } catch (err: any) {
      setServerError('Verbindung zum Server fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }} className="animated-gradient">

      {/* Glow */}
      <div style={{ position: 'absolute', top: '30%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass" style={{ width: '100%', maxWidth: 420, borderRadius: 20, padding: 40, animation: 'fade-in-up 0.5s ease' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 size={22} color="white" />
          </div>
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clubify</span>
        </Link>

        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>Neues Passwort vergeben</h1>
        <p style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginBottom: 28 }}>Gib dein neues sicheres Passwort ein</p>

        {serverError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'rgb(239,68,68)', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: 20 }}>
              <KeyRound size={28} />
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'white' }}>Passwort geändert!</h2>
            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Dein Passwort wurde erfolgreich aktualisiert. Du wirst in wenigen Sekunden direkt zum Dashboard weitergeleitet...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Neues Passwort</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Min. 6 Zeichen"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Passwort bestätigen</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Speichern...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
