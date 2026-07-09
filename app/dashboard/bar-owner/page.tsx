import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAllianceBenefitTypes, getVenueAllianceSettings } from '@/lib/actions/alliance/AllianceActions'
import { getVenueTables } from '@/lib/actions/venue/TableActions'
import BarOwnerDashboardClient from '@/components/dashboard/bar-owner/BarOwnerDashboardClient'

export default async function BarOwnerDashboard() {
  const user = await getUser()
  if (!user || !['bar_owner', 'admin'].includes(user.role)) redirect('/dashboard/user')

  const supabase = await createClient()
  
  // Fetch Bars owned by the user
  const { data: bars } = await supabase
    .from('bars')
    .select('id, name, slug, city, status, avg_rating, view_count, show_zones')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch Happy Hours for these bars
  const { data: happyHours } = await supabase
    .from('happy_hours')
    .select('id, bar_id, start_time, end_time, day_of_week, discount_percent, active')
    .in('bar_id', bars?.map(b => b.id) ?? [])

  // Fetch Alliance Program Data
  const benefitTypes = await getAllianceBenefitTypes()
  
  const firstBar = bars?.[0]
  const allianceData = firstBar ? await getVenueAllianceSettings(firstBar.id, 'bar') : null
  const initialTables = firstBar ? await getVenueTables(firstBar.id) : []

  // Fetch Reservations
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('venue_id', firstBar?.id ?? '')
    .order('reserved_time', { ascending: true })

  return (
    <BarOwnerDashboardClient 
      bars={bars ?? []}
      happyHours={happyHours ?? []}
      allianceData={allianceData}
      benefitTypes={benefitTypes}
      initialTables={initialTables}
      reservations={reservations ?? []}
    />
  )
}
