import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/public/Navbar'
import ProfileClientView from './ProfileClientView'
import Footer from '@/components/public/Footer'

export const metadata = {
  title: 'Mein Profil — Clubify'
}

export default async function ProfileRootPage() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  
  // Fetch full user profile, favorites, reviews and tickets in parallel
  const [
    { data: profile },
    { data: favorites },
    { data: reviews },
    { data: bookings },
    { data: redemptions },
    { data: participatingVenues },
    { data: venueBenefits }
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('favorites').select('id, club_id, bar_id, event_id, clubs(name, slug, city, images), bars(name, slug, city, images), events(name, slug, date, images)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('id, rating, text, created_at, clubs(name), bars(name), events(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*, events(name, slug, date, images, club_id, bar_id, clubs(name, city), bars(name, city))').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('alliance_redemptions')
      .select('*, benefit:benefit_id(benefit_types:benefit_type_id(estimated_retail_value, name))')
      .eq('user_id', user.id)
      .order('redeemed_at', { ascending: false }),
    supabase.from('alliance_venue_settings').select('*, venue_id:target_id').eq('is_alliance_active', true).limit(12),
    supabase.from('alliance_venue_benefits').select('*, benefit_types:benefit_type_id(*)').eq('is_active', true)
  ])

  return (
    <>
      <Navbar user={user as any} />
      <main style={{ minHeight: '100vh', background: '#09090b', color: '#f1f5f9', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Willkommen zurück, {profile?.full_name?.split(' ')[0] || 'Gast'}!
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
              Dein Gateway zum Nightlife – Verwalte deine Tickets, Favoriten und Erlebnisse.
            </p>
          </div>
 
          <ProfileClientView 
            initialProfile={profile} 
            email={user.email} 
            favorites={favorites || []}
            reviews={reviews || []}
            bookings={bookings || []}
            redemptions={redemptions || []}
            participatingVenues={participatingVenues || []}
            venueBenefits={venueBenefits || []}
          />

        </div>
      </main>
      <Footer />
    </>
  )
}
