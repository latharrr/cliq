'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { CalendarDays, MapPin, Grid, Heart, MessageSquare, Loader2, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PostCard } from '@/components/feed/PostCard'

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState('Posts')
  const [loading, setLoading] = useState(true)
  
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  
  const [stats, setStats] = useState({ posts: 0, comments: 0, upvotes: 0 })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setActiveUserId(user?.id || null)

    let targetDbId = null
    let targetProfile = null

    if (username === 'me') {
      if (!user) { router.push('/'); return }
      targetDbId = user.id
    }

    if (targetDbId) {
      // Fetch by ID (if 'me')
      const { data } = await supabase.from('users').select('*').eq('id', targetDbId).single()
      targetProfile = data
    } else {
      // Fetch by Username
      const { data } = await supabase.from('users').select('*').eq('username', username).single()
      targetProfile = data
    }

    if (!targetProfile) {
      setLoading(false)
      return
    }

    setProfile(targetProfile)

    // Load Aggregates safely (Posts & Comments)
    const [postsRes, commentsRes, myPostsRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('authorId', targetProfile.id),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('authorId', targetProfile.id),
      supabase.from('posts').select(`
        *,
        author:users(displayName, username, avatarUrl),
        community:communities(name, slug),
        _count:comments(count)
      `).eq('authorId', targetProfile.id).order('createdAt', { ascending: false })
    ])

    setStats({
      posts: postsRes.count || 0,
      comments: commentsRes.count || 0,
      upvotes: 0 // Mocked for now (requires deeper aggregation RPC)
    })

    if (myPostsRes.data) {
      setPosts(myPostsRes.data.map(p => ({
        ...p,
        author: p.author ? { displayName: p.author.displayName, username: p.author.username, avatarUrl: p.author.avatarUrl } : undefined,
        _count: { comments: Array.isArray(p._count) ? p._count.length : p._count?.count || 0 }
      })))
    }

    setLoading(false)
  }, [username, router, supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
  }

  if (!profile) {
    return (
      <div className="glass p-12 text-center rounded-3xl mt-12">
        <span className="text-4xl block mb-4 opacity-50">👤</span>
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-sm text-gray-500">The user @{username} does not exist.</p>
      </div>
    )
  }

  const isMe = activeUserId === profile.id
  let d = profile.createdAt
  if (d && !d.endsWith('Z')) d += 'Z'
  const joinDate = new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Cover / Header */}
      <div className="relative mb-16 animate-fade-in-up">
        <div 
          className="h-32 md:h-48 w-full rounded-2xl overflow-hidden border border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(34,211,238,0.1))' }}
        />
        
        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
           {profile.avatarUrl ? (
               <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4" style={{ borderColor: 'var(--background)' }} />
           ) : (
               <div 
                 className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-xl"
                 style={{ 
                   background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                   borderColor: 'var(--background)',
                   color: 'white' 
                 }}
               >
                 {profile.displayName?.[0]?.toUpperCase() || '?'}
               </div>
           )}
        </div>

        {/* Action Button */}
        <div className="absolute -bottom-10 right-4 flex gap-2">
          {isMe ? (
            <button onClick={() => router.push('/settings')} className="btn-ghost flex items-center gap-2 border bg-white/5 shadow-sm active:scale-95 transition-all" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Edit2 size={14} /> Settings
            </button>
          ) : (
            <button onClick={() => router.push(`/messages/${profile.id}`)} className="py-2 px-6 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white' }}>
              <MessageSquare size={14} /> Message Map
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
          {profile.displayName}
        </h1>
        <p className="text-sm font-bold mb-4" style={{ color: '#a78bfa' }}>
          @{profile.username}
        </p>
        {profile.bio && (
           <p className="text-sm font-medium mb-5 leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.9 }}>
             {profile.bio}
           </p>
        )}

        <div className="flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5"><MapPin size={14} className="opacity-70"/> LPU Campus</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={14} className="opacity-70"/> Joined {joinDate}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 px-4 mb-8 border-t pt-6 animate-fade-in-up" style={{ borderColor: 'rgba(255,255,255,0.05)', animationDelay: '200ms' }}>
        <div className="flex gap-2 items-end">
          <span className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{stats.posts}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider pb-1" style={{ color: 'var(--muted)' }}>Posts</span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{stats.comments}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider pb-1" style={{ color: 'var(--muted)' }}>Replies</span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{stats.upvotes}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider pb-1" style={{ color: 'var(--muted)' }}>Likes</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 no-scrollbar overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {['Posts', 'Comments', 'Saved'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="pb-3 px-6 text-[12px] font-black uppercase tracking-wider transition-all relative whitespace-nowrap"
            style={{ color: activeTab === t ? '#a78bfa' : 'var(--muted)' }}
          >
            {t}
            {activeTab === t && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 shadow-glow"
                style={{ background: '#7c3aed' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
         {activeTab === 'Posts' && (
           <div className="flex flex-col gap-4">
             {posts.length > 0 ? (
               posts.map(post => <PostCard key={post.id} post={post} />)
             ) : (
               <div className="glass p-12 text-center rounded-3xl border border-white/5">
                 <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/5 shadow-inner">
                   <Grid size={24} style={{ color: 'var(--muted)' }}/>
                 </div>
                 <p className="font-bold mb-1 text-lg" style={{ color: 'var(--foreground)' }}>
                   No broadcasts yet
                 </p>
                 <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                   When {profile.displayName} creates public posts, you'll see them here.
                 </p>
               </div>
             )}
           </div>
         )}

         {activeTab === 'Comments' && (
           <div className="glass p-12 text-center rounded-3xl border border-white/5">
             <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/5 shadow-inner">
               <MessageSquare size={24} style={{ color: 'var(--muted)' }}/>
             </div>
             <p className="font-bold mb-1 text-lg" style={{ color: 'var(--foreground)' }}>
               No replies mapped
             </p>
           </div>
         )}

         {activeTab === 'Saved' && (
           <div className="glass p-12 text-center rounded-3xl border border-white/5">
             <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/5 shadow-inner">
               <Heart size={24} style={{ color: 'var(--muted)' }}/>
             </div>
             <p className="font-bold mb-1 text-lg" style={{ color: 'var(--foreground)' }}>
               Private Section
             </p>
             <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
               Saved posts are strictly visible only to {profile.displayName}.
             </p>
           </div>
         )}
      </div>
    </div>
  )
}
