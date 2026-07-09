'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'
import { getDashboardRoute, type UserRole } from '@/lib/auth/rbac'
import { Music2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { trackUserLogin } from '@/lib/actions/auth/TrackingActions'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setServerError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (error) { setServerError(error.message); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      const role = (profile?.role ?? 'user') as UserRole
      
      // Hard redirect to ensure cookies are sent and dashboard loads fresh
      window.location.href = getDashboardRoute(role)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
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

        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>Willkommen zurück</h1>
        <p style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginBottom: 28 }}>Melde dich an, um fortzufahren</p>

        {serverError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'rgb(239,68,68)', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">E-Mail-Adresse</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="deine@email.com"
              {...register('email')}
            />
            {errors.email && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="label">Passwort</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                style={{ paddingRight: 44 }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.password.message}</span>}
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link href="/auth/forgot-password" style={{ color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none' }}>
              Passwort vergessen?
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
          <span style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem' }}>oder</span>
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
        </div>

        <button
          id="google-login"
          onClick={handleGoogleLogin}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Mit Google fortfahren
        </button>

        <p style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: 24 }}>
          Noch kein Konto?{' '}
          <Link href="/auth/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Registrieren</Link>
        </p>
      </div>
    </div>
  )
}
