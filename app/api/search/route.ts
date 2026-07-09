import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') // 'club' | 'bar' | 'event' | null
  const city = searchParams.get('city')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (q.length < 2) return NextResponse.json({ clubs: [], bars: [], events: [] })

  const supabase = await createClient()

  const [clubsRes, barsRes, eventsRes] = await Promise.all([
    (!type || type === 'club') ? supabase
      .from('clubs')
      .select('id, name, slug, city, avg_rating, price_range, images, music_genres')
      .eq('status', 'published')
      .ilike('name', `%${q}%`)
      .limit(limit) : Promise.resolve({ data: [] }),

    (!type || type === 'bar') ? supabase
      .from('bars')
      .select('id, name, slug, city, avg_rating, price_range, images')
      .eq('status', 'published')
      .ilike('name', `%${q}%`)
      .limit(limit) : Promise.resolve({ data: [] }),

    (!type || type === 'event') ? supabase
      .from('events')
      .select('id, name, slug, date, ticket_price, images, lineup')
      .eq('status', 'published')
      .gt('date', new Date().toISOString())
      .ilike('name', `%${q}%`)
      .order('date', { ascending: true })
      .limit(limit) : Promise.resolve({ data: [] }),
  ])

  return NextResponse.json({
    clubs: clubsRes.data ?? [],
    bars: barsRes.data ?? [],
    events: eventsRes.data ?? [],
    total: (clubsRes.data?.length ?? 0) + (barsRes.data?.length ?? 0) + (eventsRes.data?.length ?? 0),
  }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
