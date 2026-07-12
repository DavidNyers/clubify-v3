import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get('city') || 'Wien'
    const supabase = await createClient()

    const now = new Date().toISOString()
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Get venue IDs in this city
    const [clubsRes, barsRes] = await Promise.all([
      supabase.from('clubs').select('id').eq('city', city).eq('status', 'published'),
      supabase.from('bars').select('id').eq('city', city).eq('status', 'published'),
    ])

    const clubIds = clubsRes.data?.map((c: any) => c.id) ?? []
    const barIds = barsRes.data?.map((b: any) => b.id) ?? []
    const venueCount = clubIds.length + barIds.length

    // Count events this week at venues in this city
    const eventCounts = await Promise.all([
      clubIds.length > 0
        ? supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .in('club_id', clubIds)
            .eq('status', 'published')
            .gte('date', now)
            .lte('date', weekEnd)
        : Promise.resolve({ count: 0 }),
      barIds.length > 0
        ? supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .in('bar_id', barIds)
            .eq('status', 'published')
            .gte('date', now)
            .lte('date', weekEnd)
        : Promise.resolve({ count: 0 }),
    ])

    const eventCount = eventCounts.reduce((sum, r) => sum + ((r as any).count ?? 0), 0)

    return NextResponse.json({ city, eventCount, venueCount })
  } catch {
    return NextResponse.json({ city: 'Wien', eventCount: 0, venueCount: 0 })
  }
}
