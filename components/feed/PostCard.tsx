'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUp, ArrowDown, MessageCircle, Share2, MoreHorizontal,
  UserCircle2, Flag, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Post {
  id: string
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
  const [voteCount, setVoteCount] = useState(post.upvotes - post.downvotes)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleVote = (type: 'UP' | 'DOWN') => {
    const prev = vote
    const newVote = prev === type ? null : type
    setVote(newVote)
    const delta = type === 'UP' ? 1 : -1
    const revert = prev === type ? -delta : prev ? delta * 2 : delta
    setVoteCount(c => c + revert)
    onVote?.(post.id, type)
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    toast.success('Link copied!')
  }

  const score = voteCount
  const scoreColor = score > 0 ? '#a78bfa' : score < 0 ? '#f87171' : 'var(--muted)'

  return (
    <article
      className="glass glass-hover p-4 mb-3 animate-fade-in-up"
      style={{ position: 'relative' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
            style={{
              background: post.isAnonymous
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #7c3aed, #22d3ee)',
            }}
          >
            {post.isAnonymous ? (
              <UserCircle2 size={18} style={{ color: 'var(--muted)' }} />
            ) : (
              <span className="text-white">
                {post.author?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {post.isAnonymous ? 'Anonymous' : (post.author?.displayName ?? 'Unknown')}
              </span>
              {post.isAnonymous && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--muted)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <EyeOff size={9} className="inline mr-1" />
                  anon
                </span>
              )}
              {post.community && (
                <a
                  href={`/communities/${post.community.slug}`}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: '#22d3ee' }}
                >
                  #{post.community.name}
                </a>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label="Post options"
          >
            <MoreHorizontal size={16} />
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
      <div className="mb-3">
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--foreground)' }}
        >
          {post.content}
        </p>
      </div>

      {/* Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            post.imageUrls.length === 1
              ? 'grid-cols-1'
              : post.imageUrls.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2'
          }`}
        >
          {post.imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Post image ${i + 1}`}
              className="rounded-xl object-cover w-full"
              style={{ maxHeight: post.imageUrls!.length === 1 ? '400px' : '200px' }}
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
      <div className="flex items-center gap-1 mt-2">
        {/* Upvote */}
        <button
          onClick={() => handleVote('UP')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-semibold"
          style={{
            background: vote === 'UP' ? 'rgba(124,58,237,0.2)' : 'transparent',
            color: vote === 'UP' ? '#a78bfa' : 'var(--muted)',
            border: vote === 'UP' ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
          }}
        >
          <ArrowUp size={14} />
          <span style={{ color: scoreColor }}>{score}</span>
        </button>

        {/* Downvote */}
        <button
          onClick={() => handleVote('DOWN')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
          style={{
            background: vote === 'DOWN' ? 'rgba(248,113,113,0.1)' : 'transparent',
            color: vote === 'DOWN' ? '#f87171' : 'var(--muted)',
          }}
        >
          <ArrowDown size={14} />
        </button>

        {/* Comments */}
        <a
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5 text-xs"
          style={{ color: 'var(--muted)' }}
        >
          <MessageCircle size={14} />
          {post._count?.comments ?? 0}
        </a>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5 text-xs"
          style={{ color: 'var(--muted)' }}
        >
          <Share2 size={14} />
          Share
        </button>
      </div>
    </article>
  )
}
