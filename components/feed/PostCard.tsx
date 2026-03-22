'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUp, ArrowDown, MessageCircle, Share2, MoreHorizontal,
  UserCircle2, Flag, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  authorId: string
  content: string
  isAnonymous: boolean
  imageUrls?: string[]
  tags?: string[]
  upvotes: number
  downvotes: number
  createdAt: string
  author?: {
    displayName: string
    username: string
    avatarUrl?: string
  }
  community?: {
    name: string
    slug: string
  }
  _count?: {
    comments: number
  }
}

interface PostCardProps {
  post: Post
  onVote?: (postId: string, type: 'UP' | 'DOWN') => void
}

export function PostCard({ post, onVote }: PostCardProps) {
  const [vote, setVote] = useState<'UP' | 'DOWN' | null>(null)
  const [voteCount, setVoteCount] = useState(post.upvotes - post.downvotes || 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const initVoteState = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && mounted) setUserId(user.id)
      
      const { data } = await supabase.from('votes').select('userId, type').eq('postId', post.id)
      if (data && mounted) {
        const total = data.reduce((acc: number, v: any) => acc + (v.type === 'UP' ? 1 : -1), 0)
        // If data exists, it acts as the immediate authoritative source of truth
        if (data.length > 0) setVoteCount(total)
        
        if (user) {
          const myVote = data.find((v: any) => v.userId === user.id)
          if (myVote) setVote(myVote.type)
        }
      }
    }
    initVoteState()
    return () => { mounted = false }
  }, [post.id, supabase])

  const handleVote = async (type: 'UP' | 'DOWN') => {
    // 1. Optimistic UI updates
    const prev = vote
    const newVote = prev === type ? null : type
    setVote(newVote)
    
    const delta = type === 'UP' ? 1 : -1
    const revert = prev === type ? -delta : prev ? delta * 2 : delta
    setVoteCount(c => c + revert)
    onVote?.(post.id, type)

    // 2. Database Sync
    if (!userId) {
       toast.error("You must be logged in to interact mathematically.")
       return
    }

    // Always clear the existing vote for this user on this post to avoid Prisma compound-key conflicts
    await supabase.from('votes').delete().match({ userId, postId: post.id })
    if (newVote) {
      await supabase.from('votes').insert({
        id: crypto.randomUUID(),
        userId,
        postId: post.id,
        type: newVote
      })

      // Send notification to author if upvote and not self-vote
      if (newVote === 'UP' && post.authorId !== userId) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          userId: post.authorId,
          type: 'UPVOTE',
          refId: post.id,
          message: `${user?.user_metadata?.displayName || 'Someone'} upvoted your post.`,
          isRead: false
        })
      }
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    toast.success('Link copied!')
  }

  const score = voteCount
  const scoreColor = score > 0 ? '#a78bfa' : score < 0 ? '#f87171' : 'var(--muted)'

  return (
    <article
      className="px-4 py-5 border-b animate-fade-in-up transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
            style={{
              background: post.isAnonymous
                ? 'var(--border)'
                : 'linear-gradient(135deg, var(--violet-light), var(--cyan))',
            }}
          >
            {post.isAnonymous ? (
              <UserCircle2 size={20} style={{ color: 'var(--muted)' }} />
            ) : (
              <span className="text-white">
                {post.author?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                {post.isAnonymous ? 'Anonymous' : (post.author?.displayName ?? 'Unknown')}
              </span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
                · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }).replace('about', '').trim()}
              </span>
              {post.isAnonymous && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full ml-1"
                  style={{
                    background: 'var(--border)',
                    color: 'var(--muted)',
                  }}
                >
                  <EyeOff size={10} className="inline mr-1" />anon
                </span>
              )}
              {post.community && (
                <a
                  href={`/communities/${post.community.slug}`}
                  className="text-xs transition-colors hover:underline ml-1"
                  style={{ color: 'var(--cyan)' }}
                >
                  #{post.community.name}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded-full hover:bg-white/10"
            style={{ color: 'var(--muted)' }}
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div
              className="glass absolute right-0 top-full mt-1 w-36 py-1 z-10"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { setMenuOpen(false); toast.success('Reported') }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 text-red-400"
              >
                <Flag size={13} /> Report
              </button>
              <button
                onClick={() => { setMenuOpen(false); handleShare() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5"
                style={{ color: 'var(--foreground)' }}
              >
                <Share2 size={13} /> Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3 pl-0 sm:pl-[52px]">
        <p
          className="text-[15px] leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--foreground)' }}
        >
          {post.content}
        </p>
      </div>

      {/* Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div
          className={`grid gap-1 mb-3 pl-0 sm:pl-[52px] ${
            post.imageUrls.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-2'
          }`}
        >
          {post.imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Post image ${i + 1}`}
              className="rounded-xl object-cover w-full border border-white/5 shadow-sm"
              style={{ maxHeight: post.imageUrls!.length === 1 ? '450px' : '220px' }}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <a
              key={tag}
              href={`/search?q=%23${tag}`}
              className="tag text-xs"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 mt-1 pl-0 sm:pl-[52px]">
        {/* Upvote */}
        <button
          onClick={() => handleVote('UP')}
          className="flex items-center gap-1.5 transition-all text-sm font-semibold"
          style={{ color: vote === 'UP' ? 'var(--violet-light)' : 'var(--muted)' }}
        >
          <ArrowUp size={20} />
          <span>{score}</span>
        </button>

        {/* Downvote */}
        <button
          onClick={() => handleVote('DOWN')}
          className="flex items-center gap-1.5 transition-all"
          style={{ color: vote === 'DOWN' ? '#f87171' : 'var(--muted)' }}
        >
          <ArrowDown size={20} />
        </button>

        {/* Comments */}
        <a
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 transition-all text-[13px] font-semibold"
          style={{ color: 'var(--muted)' }}
        >
          <MessageCircle size={19} />
          {post._count?.comments ?? 0}
        </a>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 transition-all text-sm ml-auto"
          style={{ color: 'var(--muted)' }}
        >
          <Share2 size={19} />
        </button>
      </div>
    </article>
  )
}
