'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Mail, Ticket, Check, AlertCircle, Heart, Star, MapPin, ExternalLink, Calendar, Edit2, X, History, ChevronDown, ChevronRight, LogOut, Trash2, Globe, Smartphone, Palette, Shield, Zap, TrendingUp, Award, ArrowRight, Clock, Gift, Search, Filter as FilterIcon, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { updateReview } from '@/lib/actions/user/ReviewActions'
import { QrCode } from 'lucide-react'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1514525253344-7814d9994a8c?auto=format&fit=crop&q=80&w=800'

export default function ProfileClientView({ 
  initialProfile, 
  email,
  favorites = [],
  bookings = [],
  redemptions = [],
  participatingVenues = [],
  venueBenefits = []
}: { 
  initialProfile: any; 
  email: string | undefined;
  favorites?: any[];
  reviews?: any[];
  bookings?: any[];
  redemptions?: any[];
  participatingVenues?: any[];
  venueBenefits?: any[];
}) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'alliance' | 'tickets' | 'favorites' | 'reviews' | 'settings'>((searchParams.get('tab') as any) || 'overview')
  
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'alliance', 'tickets', 'favorites', 'reviews', 'settings'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any)
    router.push(`/profile?tab=${tabId}`, { scroll: false })
  }
  
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [username, setUsername] = useState(initialProfile?.username || '')
  const [phone, setPhone] = useState(initialProfile?.phone || '')
  const [gender, setGender] = useState(initialProfile?.gender || '')
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile?.date_of_birth || '')
  const [prefLang, setPrefLang] = useState(initialProfile?.preferred_language || 'de')
  const [themePref, setThemePref] = useState(initialProfile?.theme || 'dark')
  
  const [userEmail, setUserEmail] = useState(email || '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [favFilter, setFavFilter] = useState<'all' | 'clubs' | 'bars' | 'events'>('all')

  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest')
  const [reviewPage, setReviewPage] = useState(1)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const REVIEWS_PER_PAGE = 5

  const [editingReview, setEditingReview] = useState<any>(null)
  const [editRating, setEditRating] = useState(0)
  const [editText, setEditText] = useState('')
  const [isUpdatingReview, setIsUpdatingReview] = useState(false)

  const reviews = initialProfile?.reviews || []

  const now = new Date()
  const upcomingBookings = bookings.filter(b => b.events && new Date(b.events.date) >= now)
  const pastBookings = bookings.filter(b => b.events && new Date(b.events.date) < now)

  const filteredFavorites = useMemo(() => {
    return favorites.filter(fav => {
      if (favFilter === 'all') return true
      if (favFilter === 'clubs') return !!fav.club_id
      if (favFilter === 'bars') return !!fav.bar_id
      if (favFilter === 'events') return !!fav.event_id
      return true
    })
  }, [favorites, favFilter])

  const searchedReviews = useMemo(() => {
    let result = reviews.filter((rev: any) => {
      const rawVenue = rev.clubs || rev.bars || rev.events
      const venue = Array.isArray(rawVenue) ? rawVenue[0] : rawVenue
      const venueName = (venue?.name || '').toLowerCase()
      const content = (rev.text || '').toLowerCase()
      const query = reviewSearch.toLowerCase()
      return venueName.includes(query) || content.includes(query)
    })

    if (reviewSort === 'highest') {
      result = [...result].sort((a, b) => b.rating - a.rating)
    } else if (reviewSort === 'lowest') {
      result = [...result].sort((a, b) => a.rating - b.rating)
    } else {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return result
  }, [reviews, reviewSearch, reviewSort])

  const totalPages = Math.max(1, Math.ceil(searchedReviews.length / REVIEWS_PER_PAGE))
  const paginatedReviews = searchedReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE)

  const isSubscriber = initialProfile?.alliance_status === 'active'
  const totalSaved = redemptions?.reduce((acc, r: any) => {
    return acc + (Number(r.benefit?.benefit_types?.estimated_retail_value) || 0)
  }, 0) || 0

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      if (password && password !== passwordConfirm) {
        setErrorMsg('Passwörter stimmen nicht überein.')
        setLoading(false)
        return
      }
      const { error: dbError } = await supabase.from('users').update({ 
        full_name: fullName,
        username: username,
        phone: phone,
        gender: gender,
        date_of_birth: dateOfBirth || null,
        preferred_language: prefLang,
        theme: themePref
      }).eq('id', initialProfile.id)
      if (dbError) throw dbError
      if (userEmail && userEmail !== email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: userEmail })
        if (emailError) throw emailError
        setSuccessMsg('Profil aktualisiert! Bitte bestätige deine neue E-Mail-Adresse.')
      } else {
        setSuccessMsg('Profil erfolgreich aktualisiert!')
      }
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password })
        if (authError) throw authError
        setPassword('')
        setPasswordConfirm('')
      }
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ein Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const openEditModal = (review: any) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditText(review.text || '')
  }

  const handleEditReview = async () => {
    if (!editingReview || isUpdatingReview) return
    setIsUpdatingReview(true)
    try {
      await updateReview(editingReview.id, editRating, editText)
      setEditingReview(null)
      setSuccessMsg('Bewertung erfolgreich aktualisiert!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUpdatingReview(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: User },
    { id: 'alliance', label: 'Alliance', icon: Shield },
    { id: 'tickets', label: 'Tickets', icon: Ticket, badge: bookings.length },
    { id: 'favorites', label: 'Favoriten', icon: Heart, badge: favorites.length },
    { id: 'reviews', label: 'Bewertungen', icon: Star, badge: reviews.length },
    { id: 'settings', label: 'Einstell.', icon: History }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, borderBottom: '1px solid #18181b', scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => { handleTabChange(tab.id); setReviewPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: isActive ? '#8b5cf6' : '#71717a', transition: 'all 0.2s', whiteSpace: 'nowrap', position: 'relative' }}>
              <Icon size={18} /> {tab.label}
              {tab.badge ? <span style={{ background: isActive ? '#8b5cf6' : '#27272a', color: isActive ? 'white' : '#a1a1aa', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem' }}>{tab.badge}</span> : null}
              {isActive && <motion.div layoutId="activeTabProp" style={{ position: 'absolute', bottom: -1, left: 10, right: 10, height: 2, background: '#8b5cf6', borderRadius: 2 }} />}
            </button>
          )
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 24 }}>
             <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 32, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', minHeight: 280 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', border: '4px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>{fullName?.charAt(0) || 'U'}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</h3>
                    <p style={{ color: '#71717a', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div onClick={() => setActiveTab('tickets')} style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }} className="hover-lift">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#8b5cf6' }}><Ticket size={16} /><span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Tickets</span></div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '1.75rem' }}>{bookings.length}</div>
                  </div>
                  <div onClick={() => setActiveTab('favorites')} style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }} className="hover-lift">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#ef4444' }}><Heart size={16} /><span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Faves</span></div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '1.75rem' }}>{favorites.length}</div>
                  </div>
                </div>
             </div>

             <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 32, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', minHeight: 280 }}>
                <h4 style={{ color: '#71717a', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 16 }}>Nächstes Highlight</h4>
                {upcomingBookings.length > 0 ? (
                  <Link href={`/events/${upcomingBookings[0].events.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>{upcomingBookings[0].events.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 700 }}>{new Date(upcomingBookings[0].events.date).toLocaleDateString('de-AT', { day: '2-digit', month: 'long' })}</div>
                      <div style={{ color: '#52525b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {(Array.isArray(upcomingBookings[0].events.clubs) ? upcomingBookings[0].events.clubs[0] : upcomingBookings[0].events.clubs)?.name || (Array.isArray(upcomingBookings[0].events.bars) ? upcomingBookings[0].events.bars[0] : upcomingBookings[0].events.bars)?.name}
                      </div>
                    </div>
                  </Link>
                ) : <div style={{ color: '#52525b', fontStyle: 'italic', fontSize: '0.9rem' }}>Keine anstehenden Events geplant.</div>}
             </div>

             {isSubscriber ? (
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 32, padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                     <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={22} /></div>
                     <div>
                        <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 900 }}>Bündnis {initialProfile.alliance_tier?.charAt(0).toUpperCase() + initialProfile.alliance_tier?.slice(1)}</div>
                        <div style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700 }}>Deine Vorteile sind aktiv.</div>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleTabChange('alliance')} className="btn" style={{ flex: 1, background: 'white', color: 'black', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: '0.85rem' }}>Alliance öffnen</button>
                      <div style={{ background: 'rgba(255,255,255,0.05)', color: '#22c55e', padding: '0 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>AKTIV</div>
                   </div>
                </div>
             ) : (
                <div style={{ background: 'linear-gradient(90deg, #1e1b4b, #2e1065)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 32, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', marginBottom: 12 }}>Werde Teil der Alliance</h3>
                   <button onClick={() => handleTabChange('alliance')} className="btn" style={{ background: 'white', color: 'black', borderRadius: 12, padding: '12px', fontWeight: 800, width: '100%' }}>Jetzt entdecken</button>
                </div>
             )}

             <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 32, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', marginBottom: 4 }}>Ersparnis</div>
                   <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>€{totalSaved.toLocaleString()}</div>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={28} /></div>
             </div>
          </div>
        )}

        {/* ALLIANCE TAB */}
        {activeTab === 'alliance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="glass" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 32, padding: '40px', border: '1px solid rgba(139, 92, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: '#8b5cf6', opacity: 0.1, filter: 'blur(60px)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Clubify Alliance</div>
                    {isSubscriber && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>● AKTIV</span>}
                  </div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>{isSubscriber ? 'Willkommen im Inner Circle' : 'Verwandle deine Nächte in Legenden'}</h1>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: 500, lineHeight: 1.6, marginBottom: 32 }}>{isSubscriber ? 'Genieße exklusiven Zugang, gratis Drinks und Fast-Lane Einlass bei all unseren Partnern.' : 'Werde Teil der Clubify Alliance für exklusive Vorteile.'}</p>
                  {isSubscriber ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
                      <Clock size={18} style={{ color: '#22c55e' }} />
                      Aktiv bis {initialProfile.alliance_expiration ? new Date(initialProfile.alliance_expiration).getFullYear() > 2090 ? 'Lebenslang' : new Date(initialProfile.alliance_expiration).toLocaleDateString() : 'Unbegrenzt'}
                    </div>
                  ) : (
                    <Link href="/dashboard/user/alliance" style={{ textDecoration: 'none', background: 'white', color: '#1e1b4b', padding: '16px 32px', borderRadius: 16, fontWeight: 900, display: 'inline-block' }}>Jetzt Mitglied werden</Link>
                  )}
                </div>
                {isSubscriber && (
                  <div className="glass" style={{ background: 'white', padding: '24px', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase' }}>Member ID QR</div>
                    <div style={{ width: 160, height: 160, background: '#f8fafc', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QrCode size={120} color="#1e1b4b" /></div>
                    <div style={{ marginTop: 16, color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>{fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {initialProfile.id.slice(0,8).toUpperCase()}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}><Gift className="text-pink" /> Vorteile in deiner Nähe</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24 }}>
                {participatingVenues?.map((venue: any) => {
                  const benefits = venueBenefits?.filter((b: any) => b.target_id === venue.target_id)
                  return (
                    <div key={venue.target_id} className="glass" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Partner Venue</h3>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> Standort-ID: {venue.target_id.slice(0, 8)}</div>
                          </div>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} style={{ color: '#a78bfa' }} /></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {benefits?.map((b: any) => (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                               <Zap size={16} style={{ color: '#fbbf24' }} />
                               <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{b.benefit_types.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Gilt für alle Alliance Member.</div>
                               </div>
                               <ChevronRight size={16} style={{ color: '#334155' }} />
                            </div>
                          ))}
                        </div>
                        <button disabled={!isSubscriber} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: isSubscriber ? 'white' : 'rgba(255,255,255,0.05)', color: isSubscriber ? '#1e1b4b' : '#475569', fontWeight: 800, cursor: isSubscriber ? 'pointer' : 'not-allowed' }}>{isSubscriber ? 'Vorteil Einlösen' : 'Nur für Alliance Member'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div><h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Check size={18} style={{ color: '#22c55e' }} /> Aktive Tickets</h3>
              {!upcomingBookings.length ? <div style={{ padding: '60px 0', textAlign: 'center', border: '2px dashed #1f2937', borderRadius: 24, color: '#71717a' }}>Keine kommenden Events geplant.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {upcomingBookings.map(b => {
                    const event = b.events
                    if (!event) return null
                    const rawVenue = event.clubs || event.bars
                    const venue = Array.isArray(rawVenue) ? rawVenue[0] : rawVenue
                    const getImageUrl = (images: string[] | any) => {
                      if (Array.isArray(images) && images.length > 0) {
                        const img = images[0]
                        if (img.startsWith('http')) return img
                        return img
                      }
                      return FALLBACK_IMAGE
                    }
                    const image = getImageUrl(event.images)
                    return (
                      <div key={b.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 24, overflow: 'hidden' }}>
                        <div style={{ position: 'relative', height: 120, background: '#27272a' }}>
                          <img 
                            src={image} 
                            alt={event.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== FALLBACK_IMAGE) {
                                target.src = FALLBACK_IMAGE;
                              }
                            }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #18181b, transparent)' }} />
                        </div>
                        <div style={{ padding: 20 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>{event.name}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: '#a1a1aa' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(event.date).toLocaleDateString('de-AT')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {venue?.city || 'Wien'}</span>
                          </div>
                          <Link href={`/events/${event.slug}`} style={{ display: 'block', marginTop: 16, background: '#27272a', color: 'white', textAlign: 'center', padding: '12px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>Ticket anzeigen</Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {pastBookings.length > 0 && (
              <div><h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#71717a' }}><History size={18} /> Vergangene Events</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, opacity: 0.7 }}>
                  {pastBookings.map(b => (
                    <div key={b.id} style={{ background: '#111014', border: '1px solid #1f2937', borderRadius: 24, padding: 20 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4, color: '#9ca3af' }}>{b.events.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(b.events.date).toLocaleDateString('de-AT')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAVORITES TAB */}
        {activeTab === 'favorites' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
              {['all', 'clubs', 'bars', 'events'].map(f => (
                <button key={f} onClick={() => setFavFilter(f as any)} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, background: favFilter === f ? 'white' : '#18181b', color: favFilter === f ? 'black' : '#a1a1aa' }}>{f === 'all' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {!filteredFavorites.length ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', border: '2px dashed #27272a', borderRadius: 24 }}><Heart size={40} style={{ color: '#27272a', marginBottom: 16 }} /><p style={{ color: '#71717a' }}>Keine Favoriten gefunden.</p></div> : 
                filteredFavorites.map(fav => {
                  const rawItem = fav.clubs || fav.bars || fav.events
                  const item = Array.isArray(rawItem) ? rawItem[0] : rawItem
                  if (!item) return null
                  const type = fav.club_id ? 'clubs' : fav.bar_id ? 'bars' : 'events'
                  const getImageUrl = (images: string[] | any) => {
                    if (Array.isArray(images) && images.length > 0) {
                      const img = images[0]
                      if (img.startsWith('http')) return img
                      // If it's a Supabase storage path, we might need the full URL
                      // But since it worked on home page as relative, let's keep it but handle fallback better
                      return img
                    }
                    return FALLBACK_IMAGE
                  }

                  const image = getImageUrl(item.images)

                  return (
                    <Link key={fav.id} href={`/${type}/${item.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#18181b', borderRadius: 20, overflow: 'hidden', border: '1px solid #27272a', transition: 'transform 0.2s' }} className="hover-lift">
                        <div style={{ position: 'relative', height: 140, background: '#27272a' }}>
                          <img 
                            src={image} 
                            alt={item.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== FALLBACK_IMAGE) {
                                target.src = FALLBACK_IMAGE;
                              }
                            }}
                          />
                          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 6, borderRadius: '50%' }}><Heart size={14} fill="#ef4444" color="#ef4444" /></div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a1a1aa', fontSize: '0.8rem' }}>
                            {fav.event_id ? <Calendar size={12} /> : <MapPin size={12} />}
                            {fav.event_id ? (item.date ? new Date(item.date).toLocaleDateString('de-AT') : '') : item.city}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              }
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                <input placeholder="Bewertungen durchsuchen..." value={reviewSearch} onChange={e => { setReviewSearch(e.target.value); setReviewPage(1); }} style={{ width: '100%', padding: '14px 14px 14px 48px', background: '#18181b', border: '1px solid #27272a', borderRadius: 16, color: 'white', outline: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsSortOpen(!isSortOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: '#18181b', border: '1px solid #27272a', borderRadius: 16, color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}><FilterIcon size={16} /> Sortierung <ChevronDown size={14} /></button>
                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: '120%', right: 0, background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 8, zIndex: 100, width: 220, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                      {['newest', 'highest', 'lowest'].map(opt => (
                        <button key={opt} onClick={() => { setReviewSort(opt as any); setIsSortOpen(false); setReviewPage(1); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 10, background: reviewSort === opt ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: reviewSort === opt ? '#8b5cf6' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          {opt === 'newest' ? 'Neueste zuerst' : opt === 'highest' ? 'Beste Bewertung' : 'Schlechteste Bewertung'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!paginatedReviews.length ? <div style={{ textAlign: 'center', padding: '80px 0', background: '#18181b', borderRadius: 32, border: '1px solid #27272a' }}><Star size={40} style={{ color: '#27272a', marginBottom: 16 }} /><p style={{ color: '#71717a' }}>Keine Bewertungen gefunden.</p></div> :
                paginatedReviews.map((rev: any) => {
                  const rawVenue = rev.clubs || rev.bars || rev.events
                  const venue = Array.isArray(rawVenue) ? rawVenue[0] : rawVenue
                  return (
                    <div key={rev.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 24, padding: 32 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 4 }}>{venue?.name || 'Unbekannt'}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 2 }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rev.rating ? '#fbbf24' : 'none'} color={i < rev.rating ? '#fbbf24' : '#3f3f46'} />)}</div>
                            <span style={{ color: '#71717a', fontSize: '0.8rem' }}>{new Date(rev.created_at).toLocaleDateString('de-AT')}</span>
                          </div>
                        </div>
                        <button onClick={() => openEditModal(rev)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#8b5cf6', padding: '10px', borderRadius: 12, cursor: 'pointer' }}><Edit2 size={16} /></button>
                      </div>
                      <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '1rem' }}>{rev.text || 'Kein Kommentar hinterlassen.'}</p>
                    </div>
                  )
                })
              }
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20 }}>
                <button disabled={reviewPage === 1} onClick={() => setReviewPage(p => p - 1)} style={{ background: '#18181b', color: '#a1a1aa', border: 'none', padding: 12, borderRadius: 12, cursor: reviewPage === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={20} /></button>
                <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>Seite {reviewPage} von {totalPages}</div>
                <button disabled={reviewPage === totalPages} onClick={() => setReviewPage(p => p + 1)} style={{ background: '#18181b', color: '#a1a1aa', border: 'none', padding: 12, borderRadius: 12, cursor: reviewPage === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 28, padding: 32 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><User size={20} style={{ color: '#8b5cf6' }} /> Identität & Verifikation</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Klarname (für Tickets)</label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Max Mustermann" style={{ width: '100%', padding: '14px 18px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Benutzername</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="nightrider_99" style={{ width: '100%', padding: '14px 18px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Geburtsdatum</label><input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none', colorScheme: 'dark' }} /></div>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', padding: '20px', borderRadius: 20, border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)', opacity: loading ? 0.7 : 1 }}>{loading ? 'Speichere Änderungen...' : 'Alle Änderungen speichern'}</button>
              </form>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <button onClick={handleLogout} style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 16, border: '1px solid #27272a', background: '#18181b', color: 'white', fontWeight: 700, cursor: 'pointer' }}><LogOut size={18} /> Abmelden</button>
              </div>
           </div>
        )}
      </motion.div>

      {/* EDIT REVIEW MODAL */}
      <AnimatePresence>
        {editingReview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 32, width: '100%', maxWidth: 500, padding: 32 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Bewertung bearbeiten</h3>
                 <button onClick={() => setEditingReview(null)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={24} /></button>
               </div>
               <div style={{ marginBottom: 24 }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Deine Wertung</label>
                 <div style={{ display: 'flex', gap: 8 }}>{[1,2,3,4,5].map(s => <Star key={s} size={28} onClick={() => setEditRating(s)} fill={s <= editRating ? '#fbbf24' : 'none'} color={s <= editRating ? '#fbbf24' : '#3f3f46'} style={{ cursor: 'pointer' }} />)}</div>
               </div>
               <div style={{ marginBottom: 32 }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Erfahrung</label>
                 <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Erzähle uns mehr..." style={{ width: '100%', height: 140, padding: 16, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 16, color: 'white', outline: 'none', resize: 'none' }} />
               </div>
               <button onClick={handleEditReview} disabled={isUpdatingReview} style={{ width: '100%', background: 'white', color: 'black', padding: 16, borderRadius: 16, fontWeight: 900, cursor: 'pointer' }}>{isUpdatingReview ? 'Speichere...' : 'Änderungen übernehmen'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ position: 'fixed', bottom: 40, right: 40, background: '#10b981', color: 'white', padding: '16px 24px', borderRadius: 16, fontWeight: 800, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)', zIndex: 2000 }}>{successMsg}</motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ position: 'fixed', bottom: 40, right: 40, background: '#ef4444', color: 'white', padding: '16px 24px', borderRadius: 16, fontWeight: 800, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)', zIndex: 2000 }}>{errorMsg}</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
