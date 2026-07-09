import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Zap, Gift, Star, Check, ArrowRight, Music, Beer, Ticket } from 'lucide-react'
import AllianceJoinButton from '@/components/user/AllianceJoinButton'

export default async function AllianceLandingPage() {
  const user = await getUser()
  const supabase = user ? await createClient() : null
  const profile = user ? (await supabase!.from('users').select('*').eq('id', user.id).single()).data : null
  const isSubscriber = profile?.alliance_status === 'active'

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', overflow: 'hidden' }}>
      {/* Navigation Background / Spacer */}
      <div style={{ height: 80 }} />

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', position: 'relative' }}>
        {/* Abstract Background Elements */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(236, 72, 153, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 100, 
            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
            color: '#a78bfa', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 32
          }}>
            <Shield size={16} /> Clubify Alliance Premium
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Deine Eintrittskarte in die <br/> <span style={{ background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nacht deines Lebens.</span>
          </h1>

          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#94a3b8', maxWidth: 700, margin: '0 auto 48px', lineHeight: 1.6 }}>
            Ein Abo. Unendlich viele Möglichkeiten. <br/>
            Genieße exklusive Vorteile in den besten Clubs und Bars deiner Stadt.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {user ? (
               <AllianceJoinButton 
                 isSubscriber={isSubscriber} 
                 userName={profile?.full_name || ''} 
                 userId={user.id} 
                 expirationDate={profile?.alliance_expiration} 
               />
            ) : (
                <Link href="/login?redirect=/alliance" className="btn btn-primary lg" style={{ padding: '16px 40px', borderRadius: 16, fontSize: '1.1rem', fontWeight: 800, textDecoration: 'none' }}>
                  Jetzt Account erstellen
                </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {[
              { icon: Ticket, title: 'Freier Eintritt', text: 'Keine Tickets mehr kaufen. Bei teilnehmenden Partner-Clubs stehst du immer auf der Liste.', color: '#ec4899' },
              { icon: Zap, title: 'Fast Lane Access', text: 'An der Schlange vorbei. Zeig deinen Alliance QR-Code am Eingang und geh direkt rein.', color: '#8b5cf6' },
              { icon: Beer, title: 'Gratis Drinks', text: 'Jede Nacht ein Begrüßungs-Drink oder exklusive Rabatte an der Bar unserer Partner.', color: '#f59e0b' }
            ].map((f, i) => (
              <div key={i} className="glass" style={{ 
                background: 'rgba(30, 41, 59, 0.4)', padding: '40px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: f.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: `1px solid ${f.color}30` }}>
                  <f.icon size={32} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>{f.title}</h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1rem' }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Social Proof */}
      <section style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 56 }}>So einfach geht's</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {[
              { step: '01', title: 'Member werden', text: 'Schließe dein Alliance Abo ab und erhalte sofort Zugriff.' },
              { step: '02', title: 'Location wählen', text: 'Finde teilnehmende Clubs & Bars auf unserer Live-Map.' },
              { step: '03', title: 'QR-Code zeigen', text: 'QR-Code beim Personal vorzeigen, entwerten lassen und Vorteile genießen.' }
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 40, textAlign: 'left', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(139, 92, 246, 0.3)', minWidth: 100 }}>{s.step}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>{s.title}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Final CTA */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 16 }}>Wähle deine Stufe</h2>
            <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Einfach monatlich kündbar. Keine Verpflichtungen.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch' }}>
            {/* EXPLORER */}
            <div className="glass" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '48px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Explorer</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>9,99€</span>
                  <span style={{ color: '#64748b' }}>/ mtl.</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 40, flex: 1 }}>
                {['1x Freier Eintritt / Monat', 'Exklusive Bar-Rabatte', 'Alliance Community Zugang', 'Digitaler Member-Pass'].map(f => (
                  <li key={f} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: '0.95rem' }}>
                    <Check size={18} style={{ color: '#22c55e' }} /> {f}
                  </li>
                ))}
              </ul>
              <AllianceJoinButton tier="explorer" isSubscriber={isSubscriber && profile?.alliance_tier === 'explorer'} userName={profile?.full_name || ''} userId={user?.id || ''} />
            </div>

            {/* PREMIUM - Recommended */}
            <div className="glass" style={{ 
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(30, 41, 59, 0.4))', 
              padding: '48px', borderRadius: 40, border: '2px solid #8b5cf6', 
              display: 'flex', flexDirection: 'column', position: 'relative', transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)' 
            }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: '#8b5cf6', color: 'white', padding: '4px 16px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Empfohlen</div>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Premium</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: 'white' }}>29,99€</span>
                  <span style={{ color: '#94a3b8' }}>/ mtl.</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 40, flex: 1 }}>
                {['Unbegrenzt Freier Eintritt', 'Fast-Lane Einlass', 'Premium Support', 'Alle Explorer Vorteile'].map(f => (
                  <li key={f} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, color: 'white', fontSize: '0.95rem', fontWeight: 600 }}>
                    <Check size={18} style={{ color: '#22c55e' }} /> {f}
                  </li>
                ))}
              </ul>
              <AllianceJoinButton tier="premium" isSubscriber={isSubscriber && profile?.alliance_tier === 'premium'} userName={profile?.full_name || ''} userId={user?.id || ''} />
            </div>

            {/* ELITE */}
            <div className="glass" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '48px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Elite</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>59,99€</span>
                  <span style={{ color: '#64748b' }}>/ mtl.</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 40, flex: 1 }}>
                {['Täglich 1x Gratis Longdrink', 'VIP Guestlist Hosting', 'Meet the Managers Events', 'Alle Premium Vorteile'].map(f => (
                  <li key={f} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: '0.95rem' }}>
                    <Check size={18} style={{ color: '#22c55e' }} /> {f}
                  </li>
                ))}
              </ul>
              <AllianceJoinButton tier="elite" isSubscriber={isSubscriber && profile?.alliance_tier === 'elite'} userName={profile?.full_name || ''} userId={user?.id || ''} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontWeight: 900, fontSize: '1.5rem', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>CLUBIFY</div>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>&copy; 2026 Clubify Technologies. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
