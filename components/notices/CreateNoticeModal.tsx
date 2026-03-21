'use client'

import { useState } from 'react'
import { X, Megaphone, Loader2, Pin, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface CreateNoticeModalProps {
  onClose: () => void
  onCreated: () => void
}

const CATEGORIES = ['ACADEMIC', 'ADMINISTRATIVE', 'CULTURAL', 'URGENT']

export function CreateNoticeModal({ onClose, onCreated }: CreateNoticeModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('ADMINISTRATIVE')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required properties')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('notices').insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      category,
      isUrgent,
      isPinned,
      createdById: user.id
    })

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Official Notice published globally! 📢')
    onCreated()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-strong w-full max-w-xl animate-fade-in-up shadow-2xl my-8 border border-white/10 rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Megaphone size={20} style={{ color: '#a78bfa' }} />
            Publish Notice
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          <div>
            <label className="text-[11px] font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Notice Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Revised Mid-Term Examination Schedule"
              className="input-glass w-full text-base p-3 font-medium"
              maxLength={150}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Official Body *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Formal announcement payload..."
              className="input-glass w-full text-sm p-4 resize-none h-32 leading-relaxed"
              maxLength={3000}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Department Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-glass text-sm w-full p-3 font-semibold cursor-pointer"
              style={{ color: '#a78bfa', appearance: 'none' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <label className={`glass p-4 rounded-xl cursor-pointer transition-all border ${isPinned ? 'bg-yellow-500/10 border-yellow-500/50' : 'hover:bg-white/5 border-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                   <Pin size={18} className={isPinned ? 'text-yellow-500' : 'text-gray-500'} />
                   <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="hidden" />
                   <div className={`w-4 h-4 rounded shadow-inner flex items-center justify-center border ${isPinned ? 'bg-yellow-500 border-transparent' : 'border-white/20'}`}>
                     {isPinned && <span className="text-black text-[10px] font-bold">✓</span>}
                   </div>
                </div>
                <div className={`font-bold text-sm ${isPinned ? 'text-yellow-500' : 'text-gray-400'}`}>Pin Notice</div>
                <div className="text-[10px] text-gray-500 mt-1">Sticks identically to the top of the feed globally</div>
             </label>

             <label className={`glass p-4 rounded-xl cursor-pointer transition-all border ${isUrgent ? 'bg-red-500/10 border-red-500/50' : 'hover:bg-white/5 border-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                   <AlertTriangle size={18} className={isUrgent ? 'text-red-400' : 'text-gray-500'} />
                   <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="hidden" />
                   <div className={`w-4 h-4 rounded shadow-inner flex items-center justify-center border ${isUrgent ? 'bg-red-500 border-transparent' : 'border-white/20'}`}>
                     {isUrgent && <span className="text-black text-[10px] font-bold">✓</span>}
                   </div>
                </div>
                <div className={`font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>Mark Urgent</div>
                <div className="text-[10px] text-gray-500 mt-1">Highlights border heavily with red warning colors</div>
             </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 font-bold flex justify-center items-center shadow-lg rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Dispatch Notice'}
          </button>
        </form>
      </div>
    </div>
  )
}
