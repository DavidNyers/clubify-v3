'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDashboardRoute, type UserRole } from '@/lib/auth/rbac'
import {
  Menu, X, Moon, Sun, Globe, Map, Calendar, Music2, Beer,
  User, Users, LogOut, LayoutDashboard, ChevronDown, Search, Bell
} from 'lucide-react'

interface NavbarProps {
  user?: { id: string; full_name: string | null; role: UserRole; avatar_url: string | null } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [locale, setLocale] = useState('de')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('clubify-theme') as 'dark' | 'light' || 'dark'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('light', savedTheme === 'light')
    const savedLocale = document.cookie.match(/locale=([^;]+)/)?.[1] ?? 'de'
    setLocale(savedLocale)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const { data: clubs } = await supabase.from('clubs').select('id, name, slug, city').ilike('name', `%${searchQuery}%`).eq('status', 'published').limit(3)
      const { data: events } = await supabase.from('events').select('id, name, slug, date').ilike('name', `%${searchQuery}%`).eq('status', 'published').limit(3)
      const { data: bars } = await supabase.from('bars').select('id, name, slug, city').ilike('name', `%${searchQuery}%`).eq('status', 'published').limit(3)
      setSearchResults([
        ...(clubs ?? []).map(c => ({ ...c, type: 'club' })),
        ...(bars ?? []).map(b => ({ ...b, type: 'bar' })),
        ...(events ?? []).map(e => ({ ...e, type: 'event' })),
      ])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('clubify-theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  const toggleLocale = () => {
    const newLocale = locale === 'de' ? 'en' : 'de'
    setLocale(newLocale)
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/map', label: locale === 'de' ? 'Karte' : 'Map', icon: Map },
    { href: '/clubs', label: 'Clubs', icon: Music2 },
    { href: '/bars', label: 'Bars', icon: Beer },
    { href: '/events', label: 'Events', icon: Calendar },
  ]

  return (
    <nav
      id="main-navbar"
      className="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        ...(scrolled ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(9,9,11,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        } : {
          background: 'transparent',
        }),
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Music2 size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Clubify</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 24, flex: 1 }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                color: pathname === link.href ? '#a78bfa' : 'rgb(var(--text-secondary))',
                background: pathname === link.href ? 'rgba(139,92,246,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname === link.href ? '#a78bfa' : 'rgb(var(--text-secondary))'; (e.currentTarget as HTMLElement).style.background = pathname === link.href ? 'rgba(139,92,246,0.1)' : 'transparent' }}
            >
              <link.icon size={15} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <button
              id="navbar-search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="btn btn-ghost btn-icon"
              title="Suche"
            >
              <Search size={18} />
            </button>
            {searchOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 340, background: 'rgb(var(--bg-surface))',
                border: '1px solid rgb(var(--border))', borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
              }}>
                <div style={{ padding: 12, borderBottom: '1px solid rgb(var(--border))' }}>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'de' ? 'Clubs, Bars, Events suchen...' : 'Search clubs, bars, events...'}
                    className="input"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {searchResults.map(result => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={`/${result.type}s/${result.slug}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', textDecoration: 'none',
                          color: 'rgb(var(--text-primary))', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgb(var(--bg-elevated))'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <span className={`badge badge-${result.type === 'club' ? 'violet' : result.type === 'bar' ? 'pink' : 'yellow'}`} style={{ fontSize: '0.7rem', minWidth: 40, justifyContent: 'center' }}>
                          {result.type === 'club' ? 'Club' : result.type === 'bar' ? 'Bar' : 'Event'}
                        </span>
                        <span style={{ fontSize: '0.875rem' }}>{result.name}</span>
                        {result.city && <span style={{ color: 'rgb(var(--text-muted))', fontSize: '0.75rem', marginLeft: 'auto' }}>{result.city}</span>}
                      </Link>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem' }}>
                    {locale === 'de' ? 'Keine Ergebnisse' : 'No results'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Toggle */}
          <button
            id="locale-toggle"
            onClick={toggleLocale}
            className="btn btn-ghost btn-icon"
            title={locale === 'de' ? 'English' : 'Deutsch'}
            style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.5 }}
          >
            {locale === 'de' ? 'EN' : 'DE'}
          </button>

          {/* User Menu or Auth Buttons */}
          {user ? (
            <div ref={userMenuRef} className="hide-mobile" style={{ position: 'relative' }}>
              <button
                id="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px 5px 5px', borderRadius: 24,
                  background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={14} color="white" />
                  }
                </div>
                <span className="hide-mobile" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                  {user.full_name?.split(' ')[0] ?? 'Profil'}
                </span>
                <ChevronDown size={14} style={{ color: 'rgb(var(--text-muted))', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 200, background: 'rgb(var(--bg-surface))',
                  border: '1px solid rgb(var(--border))', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
                  animation: 'fade-in-up 0.15s ease',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(var(--text-primary))' }}>{user.full_name}</div>
                    <div className={`badge badge-violet`} style={{ marginTop: 4, fontSize: '0.7rem' }}>
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  {(() => {
                    const links = []
                    if (user.role !== 'user') {
                      links.push({ href: getDashboardRoute(user.role), label: locale === 'de' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard })
                    }
                    links.push({ href: '/profile', label: locale === 'de' ? 'Mein Profil' : 'Profile', icon: User })
                    return links
                  })().map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', textDecoration: 'none',
                        color: 'rgb(var(--text-primary))', fontSize: '0.875rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgb(var(--bg-elevated))'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <item.icon size={15} style={{ color: 'rgb(var(--text-muted))' }} />
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid rgb(var(--border))' }}>
                    <button
                      id="signout-btn"
                      onClick={handleSignOut}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgb(239,68,68)', fontSize: '0.875rem',
                        transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <LogOut size={15} />
                      {locale === 'de' ? 'Abmelden' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hide-mobile" style={{ display: 'flex', gap: 8 }}>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                {locale === 'de' ? 'Anmelden' : 'Sign In'}
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                {locale === 'de' ? 'Registrieren' : 'Register'}
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-btn"
            className="hide-desktop btn btn-ghost btn-icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgb(var(--bg-surface))',
          borderBottom: '1px solid rgb(var(--border))',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          padding: '16px 20px',
          animation: 'fade-in-up 0.2s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 10,
                  textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
                  color: pathname === link.href ? '#a78bfa' : 'rgb(var(--text-primary))',
                  background: pathname === link.href ? 'rgba(139,92,246,0.1)' : 'transparent',
                }}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid rgb(var(--border))' }}>
                <Link href="/auth/login" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  {locale === 'de' ? 'Anmelden' : 'Sign In'}
                </Link>
                <Link href="/auth/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  {locale === 'de' ? 'Registrieren' : 'Register'}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, paddingTop: 16, borderTop: '1px solid rgb(var(--border))' }}>
                <div style={{ padding: '4px 16px 8px 16px', fontSize: '0.85rem', color: 'rgb(var(--text-muted))' }}>
                  Eingeloggt als {user.full_name}
                </div>
                {(() => {
                  const links = []
                  if (user.role !== 'user') {
                    links.push({ href: getDashboardRoute(user.role), label: locale === 'de' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard })
                  }
                  links.push({ href: '/profile', label: locale === 'de' ? 'Mein Profil' : 'Profile', icon: User })
                  return links
                })().map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 10,
                      textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
                      color: 'rgb(var(--text-primary))',
                    }}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
                
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    border: 'none', background: 'transparent',
                    textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
                    color: 'rgb(239,68,68)', textAlign: 'left', cursor: 'pointer'
                  }}
                >
                  <LogOut size={18} />
                  {locale === 'de' ? 'Abmelden' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
