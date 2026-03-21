'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Flame, Clock, TrendingUp } from 'lucide-react'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostModal } from '@/components/feed/CreatePostModal'
import { createClient } from '@/lib/supabase/client'

const FILTERS = [
  { key: 'new', label: 'New', icon: Clock },
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'top', label: 'Top', icon: TrendingUp },
] as const

type Filter = typeof FILTERS[number]['key']

// Skeleton post card
function PostSkeleton() {
  return (
    <div className="glass p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div>
          <div className="skeleton h-3 w-28 mb-1.5" />
          <div className="skeleton h-2.5 w-16" />
        </div>
      </div>
      <div className="skeleton h-3.5 w-full mb-2" />
      <div className="skeleton h-3.5 w-4/5 mb-2" />
      <div className="skeleton h-3.5 w-2/3 mb-4" />
      <div className="flex gap-3">
        <div className="skeleton h-7 w-16 rounded-lg" />
        <div className="skeleton h-7 w-16 rounded-lg" />
        <div className="skeleton h-7 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('new')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users(displayName, username, avatarUrl),
        community:communities(name, slug),
        _count:comments(count)
      `)
      .limit(20)

    if (filter === 'new') query = query.order('createdAt', { ascending: false })
    else if (filter === 'hot') query = query.order('upvotes', { ascending: false })
    else if (filter === 'top') query = query.order('upvotes', { ascending: false })

    const { data, error } = await query
    if (!error && data) {
      setPosts(data.map(p => ({
        ...p,
        author: p.author
          ? { displayName: p.author.displayName, username: p.author.username, avatarUrl: p.author.avatarUrl }
          : undefined,
        _count: { comments: Array.isArray(p._count) ? p._count.length : 0 },
      })))
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        const newPost = payload.new as any
        setPosts(prev => [{
          ...newPost,
          _count: { comments: 0 },
        }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <>
      {/* Create post prompt */}
      <div className="glass glass-hover p-3 mb-4 flex items-center gap-3 cursor-pointer" onClick={() => setShowCreatePost(true)}>
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
        >
          C
        </div>
        <div
          className="flex-1 input-glass text-sm py-2 cursor-pointer text-left"
          style={{ color: 'var(--muted)' }}
        >
          What&apos;s happening on campus?
        </div>
        <button className="btn-primary py-2 px-3 text-sm shrink-0" onClick={() => setShowCreatePost(true)}>
          <Plus size={15} /> Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-4 glass p-1 rounded-xl">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 flex-1 justify-center py-1.5 text-sm font-medium rounded-lg transition-all"
            style={{
              background: filter === key ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))' : 'transparent',
              color: filter === key ? '#a78bfa' : 'var(--muted)',
              border: filter === key ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
      ) : posts.length === 0 ? (
        <div className="glass p-10 text-center">
          <p className="text-2xl mb-2">🌊</p>
          <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>
            No posts yet
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Be the first to post something on campus!
          </p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="btn-primary mt-4 text-sm"
          >
            Create a post
          </button>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
        aria-label="Create post"
      >
        <Plus size={22} className="text-white" />
      </button>

      {/* Create post modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={fetchPosts}
        />
      )}
    </>
  )
}
