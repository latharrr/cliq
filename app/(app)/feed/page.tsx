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

function PostSkeleton() {
  return (
    <div className="p-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div>
          <div className="skeleton h-3.5 w-32 mb-1.5" />
        </div>
      </div>
      <div className="skeleton h-3.5 w-full mb-2 ml-0 sm:ml-12" />
      <div className="skeleton h-3.5 w-[80%] mb-4 ml-0 sm:ml-12" />
      <div className="flex gap-6 mt-4 ml-0 sm:ml-12">
        <div className="skeleton h-5 w-8 rounded-md" />
        <div className="skeleton h-5 w-8 rounded-md" />
        <div className="skeleton h-5 w-8 rounded-md" />
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
    // Provide visually smooth hot-swapping without firing skeleton loading states on tab switch
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
      <div className="p-3 mb-2 flex items-center gap-3 cursor-pointer border-b" style={{ borderColor: 'var(--border)' }} onClick={() => setShowCreatePost(true)}>
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--violet-light), var(--cyan))', color: 'white' }}
        >
          C
        </div>
        <div
          className="flex-1 text-[15px] cursor-pointer text-left pl-1"
          style={{ color: 'var(--muted)' }}
        >
          What's happening on campus?
        </div>
        <button className="bg-[var(--violet)] text-white font-bold py-1.5 px-4 rounded-full text-sm shrink-0 shadow-md active:scale-95 transition-transform" onClick={() => setShowCreatePost(true)}>
          Post
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
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        style={{ background: 'var(--violet)' }}
        aria-label="Create post"
      >
        <Plus size={24} className="text-white" />
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
