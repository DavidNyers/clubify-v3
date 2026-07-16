'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Music2, Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setServerError('')
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setServerError(error.message)
      } else {
        setSuccess(true)
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

        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 6 }}>Passwort zurücksetzen</h1>
        <p style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginBottom: 28 }}>Wir senden dir einen Link zum Zurücksetzen deines Passworts</p>

        {serverError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'rgb(239,68,68)', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: 20 }}>
              <Mail size={28} />
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'white' }}>E-Mail gesendet!</h2>
            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 28 }}>
              Wir haben dir eine E-Mail an <strong>{email}</strong> mit Anweisungen zum Zurücksetzen deines Passworts gesendet. Bitte überprüfe auch deinen Spam-Ordner.
            </p>
            <Link href="/auth/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="label">E-Mail-Adresse</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="deine@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Wird gesendet...' : 'Link anfordern'}
            </button>

            <Link href="/auth/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgb(var(--text-muted))', fontSize: '0.85rem', textDecoration: 'none', marginTop: 8 }} className="hover-text-white">
              <ArrowLeft size={14} /> Zurück zum Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
