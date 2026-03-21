'use client'

import { useState } from 'react'
import { X, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function RequestCommunityModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🎓')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim() || !icon.trim()) {
      toast.error('Please fill out all fields')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    // 1. Insert Community
    const communityId = crypto.randomUUID()
    const { error: commError } = await supabase.from('communities').insert({
      id: communityId,
      name: name.trim(),
      slug,
      description: description.trim(),
      iconUrl: icon.substring(0, 2), // store emoji in iconUrl
      createdById: user.id,
      isApproved: false, // Forces request onto the Admin Review queue
    })

    if (commError) {
      setLoading(false)
      if (commError.message.includes('unique')) {
        toast.error('A community with that name already exists!')
      } else {
        toast.error(commError.message)
      }
      return
    }

    // 2. Insert creator as Admin Member
    await supabase.from('community_members').insert({
      id: crypto.randomUUID(),
      communityId: communityId,
      userId: user.id,
      role: 'ADMIN' // based on Prisma Enum
    })

    setLoading(false)
    toast.success('Community successfully created!')
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#22d3ee' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Create Community</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Icon (Emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="input-glass w-16 text-center text-2xl py-2"
              maxLength={2}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Community Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hackers Club"
              className="input-glass w-full text-sm py-2 px-3"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this community about?"
              className="input-glass w-full text-sm py-2 px-3 resize-none min-h-[80px]"
              maxLength={200}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2 flex justify-center items-center"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  )
}
