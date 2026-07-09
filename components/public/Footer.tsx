import Link from 'next/link'
import { Music2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{
      background: 'rgb(var(--bg-surface))',
      borderTop: '1px solid rgb(var(--border))',
      padding: '60px 0 32px',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Music2 size={18} color="white" />
              </div>
              <span style={{
                fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Clubify</span>
            </div>
            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 220 }}>
              Deine Plattform für Nightlife-Discovery, Reservierungen und Event-Ticketing.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Entdecken', links: [{ href: '/map', label: 'Karte' }, { href: '/clubs', label: 'Clubs' }, { href: '/bars', label: 'Bars' }, { href: '/events', label: 'Events' }] },
            { title: 'Konto', links: [{ href: '/auth/login', label: 'Anmelden' }, { href: '/auth/register', label: 'Registrieren' }, { href: '/dashboard/user', label: 'Dashboard' }] },
            { title: 'Unternehmen', links: [{ href: '#', label: 'Über uns' }, { href: '/apply', label: 'Partner werden' }, { href: '#', label: 'Datenschutz' }, { href: '#', label: 'AGB' }] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>{col.title}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map(link => (
                  <li key={`${link.label}-${col.title}`}>
                    {link.href === '#' ? (
                      <span style={{ color: 'rgb(var(--text-muted))', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s', cursor: 'pointer' }} className="hover-text-violet">
                        {link.label}
                      </span>
                    ) : (
                      <Link href={link.href} style={{ color: 'rgb(var(--text-muted))', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                        className="hover-text-violet"
                      >{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem' }}>© 2025 Clubify. Alle Rechte vorbehalten.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Twitter', 'Instagram', 'TikTok'].map(social => (
              <a key={social} href="#" style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                className="hover-text-violet"
              >{social}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
