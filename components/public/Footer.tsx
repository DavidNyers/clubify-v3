import Link from 'next/link'
import { Music2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          {/* Brand */}
          <div className="site-footer-brand">
            <div className="site-footer-logo-wrap">
              <div className="site-footer-logo-icon">
                <Music2 size={18} color="white" />
              </div>
              <span className="site-footer-logo-text">Clubify</span>
            </div>
            <p className="site-footer-desc">
              Deine Plattform für Nightlife-Discovery, Reservierungen und Event-Ticketing.
            </p>
          </div>

          {/* Links Wrapper */}
          <div className="site-footer-links-wrap">
            {/* Column 1: Entdecken */}
            <div>
              <h4 className="site-footer-title">Entdecken</h4>
              <ul className="site-footer-links">
                <li><Link href="/map" className="site-footer-link">Karte</Link></li>
                <li><Link href="/clubs" className="site-footer-link">Clubs</Link></li>
                <li><Link href="/bars" className="site-footer-link">Bars</Link></li>
                <li><Link href="/events" className="site-footer-link">Events</Link></li>
              </ul>
            </div>

            {/* Column 2: Konto */}
            <div>
              <h4 className="site-footer-title">Konto</h4>
              <ul className="site-footer-links">
                <li><Link href="/auth/login" className="site-footer-link">Anmelden</Link></li>
                <li><Link href="/auth/register" className="site-footer-link">Registrieren</Link></li>
                <li><Link href="/dashboard/user" className="site-footer-link">Dashboard</Link></li>
              </ul>
            </div>

            {/* Column 3: Unternehmen */}
            <div className="site-footer-col-company">
              <h4 className="site-footer-title">Unternehmen</h4>
              <ul className="site-footer-links">
                <li><span className="site-footer-link" style={{ cursor: 'pointer' }}>Über uns</span></li>
                <li><Link href="/apply" className="site-footer-link">Partner werden</Link></li>
                <li><span className="site-footer-link" style={{ cursor: 'pointer' }}>Datenschutz</span></li>
                <li><span className="site-footer-link" style={{ cursor: 'pointer' }}>AGB</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="site-footer-bottom">
          <p className="site-footer-copyright">© 2025 Clubify. Alle Rechte vorbehalten.</p>
          <div className="site-footer-socials">
            <a href="#" className="site-footer-social-btn" title="Instagram">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="site-footer-social-btn" title="X (Twitter)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="site-footer-social-btn" title="TikTok">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.43-.4-.63-.62v7.39c.04 1.36-.27 2.79-1.1 3.92-1.42 1.93-3.9 2.82-6.24 2.58-2.45-.17-4.84-1.63-5.89-3.93-1.22-2.54-.78-5.93 1.16-8.07 1.41-1.62 3.6-2.47 5.73-2.31.22.02.43.06.65.11V11.5c-.88-.27-1.87-.27-2.73.12-1.07.47-1.89 1.52-2.11 2.69-.36 1.7.53 3.65 2.1 4.34 1.35.63 3.03.35 4.09-.69.66-.66.97-1.57.97-2.51V.02z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
