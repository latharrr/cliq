'use client'

import { useState, useEffect, useCallback } from 'react'
import { Megaphone, AlertTriangle, Pin, CalendarDays, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CreateNoticeModal } from '@/components/notices/CreateNoticeModal'

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const categories = ['ALL', 'ACADEMIC', 'ADMINISTRATIVE', 'CULTURAL', 'URGENT']

  const supabase = createClient()

  const loadNotices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notices')
      .select('*, createdBy:users(displayName)')
      .order('isPinned', { ascending: false }) // Pinned top
      .order('createdAt', { ascending: false })

    if (data) setNotices(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadNotices()
  }, [loadNotices])

  // Realtime wrapper for massive university scale announcements
  useEffect(() => {
    const channel = supabase
      .channel('notices-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, () => {
        loadNotices()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadNotices])

  const filteredNotices = filter === 'ALL'
    ? notices
    : filter === 'URGENT' 
       ? notices.filter(n => n.isUrgent) 
       : notices.filter(n => n.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Official Notices
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Verified announcements from the administration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setShowCreate(true)} 
             className="btn-primary text-sm px-4 hidden sm:flex items-center gap-2 shadow-lg hover:-translate-y-px"
          >
            <Plus size={15} /> Publish
          </button>
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
            <Megaphone size={18} style={{ color: '#a78bfa' }} />
          </div>
        </div>
      </div>

      <button 
         onClick={() => setShowCreate(true)} 
         className="w-full btn-primary text-sm py-3 mb-6 flex sm:hidden items-center justify-center gap-2 shadow-lg"
      >
         <Plus size={15} /> Publish Notice
      </button>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-all border shadow-sm"
              style={{
                background: filter === cat ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))' : 'rgba(255,255,255,0.02)',
                borderColor: filter === cat ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)',
                color: filter === cat ? '#a78bfa' : 'var(--muted)',
                opacity: filter === cat ? 1 : 0.7
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin" style={{ color: '#a78bfa' }} /></div>
        ) : filteredNotices.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl border border-white/5">
            <span className="text-4xl mb-4 opacity-50 block">📭</span>
            <p className="font-bold mb-1" style={{ color: 'var(--foreground)' }}>Nothing to report</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No official announcements in this category yet.</p>
          </div>
        ) : (
          filteredNotices.map((notice, i) => {
            let d = notice.createdAt
            if (d && !d.endsWith('Z')) d += 'Z'
            const dObj = new Date(d)
            const dateStr = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const timeStr = dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={notice.id}
                className={`glass p-6 sm:p-8 animate-fade-in-up rounded-3xl transition-all shadow-md ${notice.isUrgent ? 'border-red-500/40 bg-red-500/5' : 'border-white/5'}`}
                style={{ animationDelay: `${(i % 10) * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4 flex-col sm:flex-row gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {notice.isPinned && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 shadow-inner">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    {notice.isUrgent && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 shadow-inner">
                        <AlertTriangle size={10} /> Urgent
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10" style={{ color: 'var(--foreground)' }}>
                      {notice.category}
                    </span>
                  </div>
                  <span className="text-xs font-semibold flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg" style={{ color: 'var(--muted)' }}>
                    <CalendarDays size={12} /> {dateStr}, {timeStr}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>
                  {notice.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap" style={{ color: 'var(--muted)', opacity: 0.9 }}>
                  {notice.body}
                </p>

                <div className="flex justify-between items-center text-xs pt-5 border-t font-semibold" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--muted)' }}>
                    Authorized by <strong className="px-1.5 py-0.5 rounded ml-1 bg-white/5" style={{ color: '#a78bfa' }}>{notice.createdBy?.displayName || 'Administration'}</strong>
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showCreate && (
        <CreateNoticeModal onClose={() => setShowCreate(false)} onCreated={loadNotices} />
      )}
    </div>
  )
}
