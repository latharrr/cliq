'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, MapPin, Clock, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import toast from 'react-hot-toast'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming')
  const [showCreate, setShowCreate] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)

  const supabase = createClient()

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let userUniversity = 'Lovely Professional University'
    if (user) {
      setUserId(user.id)
      const { data: profile } = await supabase.from('users').select('university').eq('id', user.id).single()
      if (profile?.university) userUniversity = profile.university
    }

    // Using explicit camelCase mapping for relational table properties mapped by Prisma
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        createdBy:users!inner(university),
        community:communities!events_communityId_fkey(name, slug),
        rsvps:event_rsvps(userId, status)
      `)
      .eq('createdBy.university', userUniversity)
      .order('startTime', { ascending: true })

    if (data) setEvents(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Filter logic based on current time
  const now = new Date().toISOString()
  const displayEvents = events.filter(ev => {
    if (filter === 'Upcoming') return ev.startTime > now || (ev.endTime && ev.endTime > now)
    return ev.startTime <= now && (!ev.endTime || ev.endTime <= now)
  })

  const getAttendanceCount = (rsvps: any[]) => {
    if (!rsvps) return 0
    return rsvps.filter(r => r.status === 'GOING').length
  }

  const getMyStatus = (rsvps: any[]) => {
    if (!userId || !rsvps) return null
    return rsvps.find(r => r.userId === userId)?.status || null
  }

  const handleRsvp = async (eventId: string, newStatus: string) => {
    if (!userId) return toast.error('Please log in')
    setRsvpLoading(eventId)
    
    // UPSERT directly into Prisma DB mapped constraints
    const { error } = await supabase.from('event_rsvps').upsert({
      userId: userId,
      eventId: eventId,
      status: newStatus
    }, { onConflict: 'userId, eventId' })

    if (error) {
      toast.error('Failed to update RSVP')
    } else {
      // Optimistically update
      setEvents(events.map(ev => {
        if (ev.id !== eventId) return ev
        const updatedRsvps = ev.rsvps ? ev.rsvps.filter((r: any) => r.userId !== userId) : []
        updatedRsvps.push({ userId, status: newStatus })
        return { ...ev, rsvps: updatedRsvps }
      }))
      if (newStatus === 'GOING') toast.success('See you there! 🎉')
    }
    setRsvpLoading(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <CalendarIcon size={24} style={{ color: '#7c3aed' }} />
            Events
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Happenings around campus
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 shadow-lg border-b-2 border-indigo-700/50 hover:translate-y-px hover:border-b-0 active:border-b-0">
          Create Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 border-white/10">
        {['Upcoming', 'Past'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className="pb-2 px-4 text-sm font-bold transition-all relative"
            style={{ color: filter === t ? '#a78bfa' : 'var(--muted)' }}
          >
            {t}
            {filter === t && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 shadow-glow"
                style={{ background: '#7c3aed' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : displayEvents.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl flex flex-col items-center">
             <span className="text-4xl mb-3 opacity-60">📅</span>
             <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>No {filter.toLowerCase()} events found</p>
             <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Host a new gathering to bring students together!</p>
          </div>
        ) : displayEvents.map((ev, i) => {
          // Parse Dates safely mapping Prisma TZ outputs correctly
          let startD = ev.startTime
          if (startD && !startD.endsWith('Z')) startD += 'Z'
          let endD = ev.endTime
          if (endD && !endD.endsWith('Z')) endD += 'Z'
          
          const dObj = new Date(startD)
          const monthShort = dObj.toLocaleString('en-US', { month: 'short' })
          const day = dObj.getDate()
          const timeStr = dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          
          let fullTime = timeStr
          if (endD) {
            const eObj = new Date(endD)
            fullTime += ' - ' + eObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }

          const myStatus = getMyStatus(ev.rsvps)
          const isGoing = myStatus === 'GOING'
          const isInterested = myStatus === 'INTERESTED'

          return (
            <div
              key={ev.id}
              className="glass glass-hover p-4 flex flex-col md:flex-row gap-5 animate-fade-in-up rounded-2xl border"
              style={{ animationDelay: `${(i % 10) * 100}ms`, borderColor: 'rgba(255,255,255,0.03)' }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-inner"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(34,211,238,0.1))',
                  border: '1px solid rgba(124,58,237,0.3)'
                }}
              >
                <span className="text-sm font-black uppercase tracking-wider" style={{ color: '#a78bfa' }}>
                  {monthShort}
                </span>
                <span className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>
                  {day}
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {ev.title}
                  </h3>
                  {ev.community && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/20 rounded-md" style={{ color: '#22d3ee' }}>
                      #{ev.community.name}
                    </span>
                  )}
                  {ev.isOnline && (
                     <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                       Live
                     </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-3 py-1" style={{ color: 'var(--muted)' }}>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {fullTime}</span>
                  <span className="flex items-center gap-1.5">
                    {ev.isOnline ? <MapPin size={14} className="opacity-50" /> : <MapPin size={14} />} 
                    {ev.location}
                  </span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {getAttendanceCount(ev.rsvps)} attending</span>
                </div>

                <p className="text-sm mb-5 font-medium leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.9 }}>
                  {ev.description}
                </p>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleRsvp(ev.id, isGoing ? 'NOT_GOING' : 'GOING')}
                    disabled={rsvpLoading === ev.id}
                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg border"
                    style={{ 
                      background: isGoing ? 'linear-gradient(135deg, #34d399, #10b981)' : 'rgba(255,255,255,0.05)', 
                      borderColor: isGoing ? 'transparent' : 'rgba(255,255,255,0.1)',
                      color: isGoing ? 'white' : 'var(--foreground)'
                    }}
                  >
                    {rsvpLoading === ev.id ? <Loader2 size={14} className="animate-spin inline mr-1"/> : null} 
                    {isGoing ? '✓ Going' : "I'm Going"}
                  </button>
                  <button
                    onClick={() => handleRsvp(ev.id, isInterested ? 'NOT_GOING' : 'INTERESTED')}
                    disabled={rsvpLoading === ev.id}
                    className="px-5 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/10 border"
                    style={{
                      background: isInterested ? 'rgba(124,58,237,0.2)' : 'transparent',
                      borderColor: isInterested ? 'transparent' : 'rgba(255,255,255,0.05)',
                      color: isInterested ? '#a78bfa' : 'var(--muted)'
                    }}
                  >
                    {isInterested ? '★ Interested' : 'Interested'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && (
         <CreateEventModal onClose={() => setShowCreate(false)} onCreated={loadEvents} />
      )}
    </div>
  )
}
