'use client'

import { useState, useEffect } from 'react'
import { X, Image, Tag, EyeOff, Eye, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let { width, height } = img

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }))
          } else { resolve(file) }
        }, 'image/jpeg', 0.8)
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

interface CreatePostModalProps {
  onClose: () => void
  onPostCreated?: () => void
  defaultCommunityId?: string
  defaultCommunityName?: string
}

export function CreatePostModal({ onClose, onPostCreated, defaultCommunityId, defaultCommunityName }: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [community, setCommunity] = useState(defaultCommunityId || '')
  const [liveCommunities, setLiveCommunities] = useState<any[]>([])
  const [isAnon, setIsAnon] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (defaultCommunityId) return // locked, no need to fetch all
    supabase.from('communities').select('id, name').eq('isApproved', true).then(({ data }) => {
      if (data) setLiveCommunities(data)
    })
  }, [defaultCommunityId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    const uploadedUrls: string[] = []
    if (images.length > 0) {
      for (const rawFile of images) {
        const file = await compressImage(rawFile)
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file)

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
          
        uploadedUrls.push(publicUrl)
      }
    }

    const tagList = tags.split(',').map(t => t.trim().replace('#', '')).filter(Boolean)

    const now = new Date().toISOString()
    const { error } = await supabase.from('posts').insert({
      id: crypto.randomUUID(),
      authorId: user.id,
      content: content.trim(),
      isAnonymous: isAnon,
      tags: tagList,
      communityId: community || null,
      imageUrls: uploadedUrls,
      updatedAt: now,
    })

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Post created! 🚀')
    onPostCreated?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-strong w-full max-w-lg animate-fade-in-up shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-white/10"
        >
          <h2 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
            Create a post
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">
          {/* Anon toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner text-white"
                style={{ background: isAnon ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
              >
                {isAnon ? '?' : 'C'}
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                {isAnon ? 'Anonymous' : 'You'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAnon(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-sm"
              style={{
                background: isAnon ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                color: isAnon ? '#a78bfa' : 'var(--muted)',
                border: isAnon ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent'
              }}
            >
              {isAnon ? <EyeOff size={14} /> : <Eye size={14} />}
              {isAnon ? 'Anonymous on' : 'Post as you'}
            </button>
          </div>

          {/* Content */}
          <div className="relative">
            <textarea
              placeholder="What's on your mind? Share with your campus..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              className="input-glass resize-none w-full p-4 pb-8"
              style={{ lineHeight: 1.6 }}
              autoFocus
            />
            <div className="absolute bottom-2 right-3 text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
              {content.length}/2000
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((file, i) => (
                <div key={i} className="relative w-20 h-20 shrink-0 border border-white/10 rounded-xl overflow-hidden">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Community */}
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Community (optional)
            </label>
            {defaultCommunityId ? (
               <div className="input-glass text-sm p-3 opacity-70 flex items-center gap-2 cursor-not-allowed">
                 <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">📍</div>
                 {defaultCommunityName || 'Locked to current community'}
               </div>
            ) : (
              <select
                value={community}
                onChange={e => setCommunity(e.target.value)}
                className="input-glass text-sm w-full p-3 cursor-pointer"
                style={{ appearance: 'none' }}
              >
                <option value="">No community (Post to Global Feed)</option>
                {liveCommunities.map(c => (
                  <option key={c.id} value={c.id}>#{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Tags (comma separated)
            </label>
            <div className="relative">
              <Tag
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--muted)' }}
              />
              <input
                type="text"
                placeholder="exams, lpu, placement"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="input-glass text-sm"
                style={{ paddingLeft: '2rem' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <label
                className="btn-ghost p-2 rounded-lg text-sm cursor-pointer hover:bg-white/10 transition"
                title="Attach images"
              >
                <Image size={16} />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files) {
                      setImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 4))
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn-primary px-5 py-2 text-sm"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <><Send size={14} /> Post</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
