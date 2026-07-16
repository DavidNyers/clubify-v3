'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Music2, Loader2, KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  // Track whether we're in a valid password recovery session
  const [authReady, setAuthReady] = useState<'loading' | 'ready' | 'invalid'>('loading')

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    // This fires when the user lands here via the reset email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // We're in recovery mode – show the form
        setAuthReady('ready')
      } else if (event === 'SIGNED_IN' && session) {
        // Normal sign-in happened (not recovery) - check if we already have a session
        // Small delay to allow PASSWORD_RECOVERY to fire first
        setTimeout(() => {
          setAuthReady(prev => prev === 'loading' ? 'ready' : prev)
        }, 500)
      }
    })

    // Also check current session immediately (in case user refreshes the page)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAuthReady('ready')
      } else {
        // No session at all - wait for auth event
        setTimeout(() => {
          setAuthReady(prev => prev === 'loading' ? 'invalid' : prev)
        }, 3000)
      }
    }
    checkSession()

    return () => subscription.unsubscribe()
  }, [])

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
        // Sign out so the user has to log in freshly with the new password
        await supabase.auth.signOut()
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch {
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

        {/* Loading state */}
        {authReady === 'loading' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa', margin: '0 auto 16px' }} />
            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem' }}>Sitzung wird geprüft...</p>
          </div>
        )}

        {/* Invalid / expired link */}
        {authReady === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: 20 }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'white' }}>Link ungültig oder abgelaufen</h2>
            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 24 }}>
              Dieser Link ist nicht mehr gültig. Bitte fordere einen neuen Link an.
            </p>
            <Link href="/auth/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Neuen Link anfordern
            </Link>
          </div>
        )}

        {/* Ready – show the form */}
        {authReady === 'ready' && (
          <>
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
                  Dein Passwort wurde erfolgreich aktualisiert. Du wirst in wenigen Sekunden zur Anmeldung weitergeleitet...
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
          </>
        )}
      </div>
    </div>
  )
}
