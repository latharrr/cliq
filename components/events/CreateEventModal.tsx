'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, MapPin, Clock, Loader2, Link } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface CreateEventModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateEventModal({ onClose, onCreated }: CreateEventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  
  const [community, setCommunity] = useState('')
  const [liveCommunities, setLiveCommunities] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('communities').select('id, name').eq('isApproved', true).then(({ data }) => {
      if (data) setLiveCommunities(data)
    })
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !location.trim() || !startDate || !startTime) {
      toast.error('Please fill out all required fields')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    // Combine dates natively
    const startIso = new Date(`${startDate}T${startTime}`).toISOString()
    let endIso = null
    if (endDate && endTime) endIso = new Date(`${endDate}T${endTime}`).toISOString()

    const { error } = await supabase.from('events').insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      isOnline,
      startTime: startIso,
      endTime: endIso,
      communityId: community || null,
      createdById: user.id
    })

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Event successfully created! 🎉')
    onCreated()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-strong w-full max-w-xl animate-fade-in-up shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <CalendarIcon size={20} style={{ color: '#22d3ee' }} />
            Host an Event
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. CodeRed Hackathon 2025"
              className="input-glass w-full text-sm p-3 font-medium"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What should people expect at this event?"
              className="input-glass w-full text-sm p-3 resize-none h-24"
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl shadow-inner border border-white/5">
              <label className="text-xs font-bold mb-2 block uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Clock size={14} /> Start Time *
              </label>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-glass w-full text-sm p-2 bg-transparent" />
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-glass w-full text-sm p-2 bg-transparent" />
              </div>
            </div>
            
            <div className="glass p-4 rounded-xl shadow-inner border border-white/5">
              <label className="text-xs font-bold mb-2 block uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Clock size={14} /> End Time (Optional)
              </label>
              <div className="flex gap-2">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-glass w-full text-sm p-2 bg-transparent" />
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-glass w-full text-sm p-2 bg-transparent" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
               <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Location *</label>
               <button type="button" onClick={() => setIsOnline(!isOnline)} className="text-xs font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition" style={{ color: isOnline ? '#22d3ee' : 'var(--muted)' }}>
                 {isOnline ? '💻 Online Event' : '📍 Physical Event'}
               </button>
            </div>
            <div className="relative">
              {!isOnline ? <MapPin size={16} className="absolute inset-y-0 my-auto left-3" style={{ color: 'var(--muted)' }} /> : <Link size={16} className="absolute inset-y-0 my-auto left-3" style={{ color: 'var(--muted)' }} />}
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={isOnline ? 'e.g. Google Meet Link' : 'e.g. Block 32, Auditorium'}
                className="input-glass w-full text-sm p-3 pl-10"
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Host Community (Optional)</label>
            <select
              value={community}
              onChange={e => setCommunity(e.target.value)}
              className="input-glass text-sm w-full p-3 cursor-pointer"
              style={{ appearance: 'none' }}
            >
              <option value="">No Community (Open to all Campus)</option>
              {liveCommunities.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2 font-bold flex justify-center items-center shadow-lg"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Publish Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
