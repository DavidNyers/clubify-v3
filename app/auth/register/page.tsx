'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas'
import { Music2, Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setServerError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
      })
      if (error) { setServerError(error.message); return }
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} className="animated-gradient">
        <div className="glass" style={{ maxWidth: 420, width: '100%', borderRadius: 20, padding: 40, textAlign: 'center', animation: 'fade-in-up 0.5s ease' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={28} color="rgb(34,197,94)" />
          </div>
          <h2 style={{ marginBottom: 12 }}>Registrierung erfolgreich!</h2>
          <p style={{ color: 'rgb(var(--text-muted))', marginBottom: 24 }}>
            Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link gesendet.
          </p>
          <Link href="/auth/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            Zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }} className="animated-gradient">
      <div style={{ position: 'absolute', top: '25%', right: '25%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass" style={{ width: '100%', maxWidth: 440, borderRadius: 20, padding: 40, animation: 'fade-in-up 0.5s ease' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 size={22} color="white" />
          </div>
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clubify</span>
        </Link>

        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>Konto erstellen</h1>
        <p style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginBottom: 28 }}>Kostenlos registrieren und loslegen</p>

        {serverError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'rgb(239,68,68)', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Vollständiger Name</label>
            <input id="full_name" type="text" className="input" placeholder="Anna Mustermann" {...register('full_name')} />
            {errors.full_name && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.full_name.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">E-Mail-Adresse</label>
            <input id="email" type="email" className="input" placeholder="deine@email.com" {...register('email')} />
            {errors.email && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Passwort</label>
            <div style={{ position: 'relative' }}>
              <input id="password" type={showPassword ? 'text' : 'password'} className="input" placeholder="••••••••" style={{ paddingRight: 44 }} {...register('password')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Passwort bestätigen</label>
            <input id="confirmPassword" type="password" className="input" placeholder="••••••••" {...register('confirmPassword')} />
            {errors.confirmPassword && <span style={{ color: 'rgb(239,68,68)', fontSize: '0.8rem' }}>{errors.confirmPassword.message}</span>}
          </div>

          <button id="register-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {loading ? 'Registrierung...' : 'Kostenlos registrieren'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
          <span style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem' }}>oder</span>
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
        </div>

        <button
          id="google-register"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${location.origin}/auth/callback` },
            })
          }}
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
          Bereits registriert?{' '}
          <Link href="/auth/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
