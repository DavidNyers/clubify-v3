import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Plus, MapPin, Users, Ticket, Clock, Edit, Trash2, ExternalLink, Building2 } from 'lucide-react'
import EventListActions from './EventListActions'

export default async function MyEventsPage() {
  const user = await getUser()
  if (!user || user.role === 'user') redirect('/dashboard/user')

  const supabase = await createClient()

  // Fetch all events managed by the current user
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      clubs (name, slug)
    `)
    .eq('manager_id', user.id)
    .order('date', { ascending: true })

  return (
    <div style={{ padding: '32px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Event-Management</h1>
          <p style={{ color: '#64748b' }}>Erstelle und verwalte die Events deiner Locations.</p>
        </div>
        <Link href="/dashboard/club-owner/events/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', textDecoration: 'none', fontWeight: 700 }}>
          <Plus size={20} /> Neues Event planen
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events?.map(event => (
          <div 
            key={event.id}
            className="glass"
            style={{ 
              background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)',
              padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center'
            }}
          >
            {/* Date Badge */}
            <div style={{ 
              width: 70, height: 75, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 16, border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>
                {new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                {new Date(event.date).getDate()}
              </span>
            </div>

            {/* Event Info */}
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{event.name}</h3>
                <span style={{ 
                   fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase',
                   background: event.status === 'published' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148,163,184,0.15)',
                   color: event.status === 'published' ? '#4ade80' : '#94a3b8'
                }}>
                  {event.status === 'published' ? 'Live' : 'Entwurf'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Building2 size={16} /> @{event.clubs?.name || 'Club'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Clock size={16} /> {new Date(event.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                   <Ticket size={16} /> {event.ticket_price} {event.currency}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 24, display: 'flex', gap: 24 }}>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 4 }}>Zusagen</div>
                 <div style={{ color: 'white', fontWeight: 700 }}>0 / {event.max_guests || '∞'}</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 4 }}>Einnahmen</div>
                 <div style={{ color: 'white', fontWeight: 700 }}>0.00 €</div>
               </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link 
                href={event.clubs ? `/clubs/${event.clubs.slug}/events/${event.slug}` : '#'}
                className="btn-icon"
                style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ExternalLink size={18} />
              </Link>
              <Link 
                href={`/dashboard/club-owner/events/${event.id}/edit`}
                className="btn-icon"
                style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}
              >
                <Edit size={18} />
              </Link>
              <EventListActions eventId={event.id} />
            </div>
          </div>
        ))}

        {events?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(30, 41, 59, 0.2)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Calendar size={48} style={{ color: '#334155', margin: '0 auto 20px' }} />
            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>Noch keine Events</h2>
            <p style={{ color: '#64748b', marginBottom: 32 }}>Erstelle dein erstes Projekt und fülle deine Tanzfläche.</p>
            <Link href="/dashboard/club-owner/events/new" className="btn btn-primary">Jetzt Event erstellen</Link>
          </div>
        )}
      </div>
    </div>
  )
}
