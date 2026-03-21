'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostModal } from '@/components/feed/CreatePostModal'
import toast from 'react-hot-toast'

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const [community, setCommunity] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isMember, setIsMember] = useState(false)
  const [membersCount, setMembersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const loadCommunityData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Fetch community details
    const { data: comm } = await supabase
      .from('communities')
      .select('*, _count:community_members(count)')
      .eq('slug', slug)
      .single()

    if (!comm) {
      toast.error('Community not found')
      router.push('/communities')
      return
    }

    setCommunity(comm)
    const numMembers = Array.isArray(comm._count) ? comm._count.length : comm._count?.count || 0
    setMembersCount(numMembers)

    // 2. Fetch membership status
    if (user) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('communityId', comm.id)
        .eq('userId', user.id)
        .maybeSingle()
      
      setIsMember(!!membership)
    }

    // 3. Fetch Posts scoped to this community
    const { data: commPosts } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_authorId_fkey(displayName, username, avatarUrl),
        community:communities!posts_communityId_fkey(name, slug),
        _count:comments(count)
      `)
      .eq('communityId', comm.id)
      .order('createdAt', { ascending: false })
      .limit(30)

    if (commPosts) {
      setPosts(commPosts.map(p => ({
        ...p,
        author: p.author ? { displayName: p.author.displayName, username: p.author.username, avatarUrl: p.author.avatarUrl } : undefined,
        _count: { comments: Array.isArray(p._count) ? p._count.length : p._count?.count || 0 }
      })))
    }
    
    setLoading(false)
  }, [slug, router, supabase])

  useEffect(() => {
    loadCommunityData()
  }, [loadCommunityData])

  const handleToggleJoin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return toast.error('You must be logged in to join')
    if (!community) return

    setJoining(true)
    if (isMember) {
      // Leave
      await supabase.from('community_members').delete().eq('communityId', community.id).eq('userId', user.id)
      setIsMember(false)
      setMembersCount(prev => prev - 1)
      toast.success(`Left ${community.name}`)
    } else {
      // Join
      await supabase.from('community_members').insert({
        id: crypto.randomUUID(),
        communityId: community.id,
        userId: user.id,
        role: 'MEMBER'
      })
      setIsMember(true)
      setMembersCount(prev => prev + 1)
      toast.success(`Welcome to ${community.name}!`)
    }
    setJoining(false)
  }

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }
  if (!community) return null

  return (
    <>
      {/* Banner / Header */}
      <div className="glass mb-6 rounded-3xl overflow-hidden shadow-lg relative animate-fade-in">
        {/* Abstract Background wrapper */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.8),rgba(34,211,238,0.8))', filter: 'blur(40px)' }} />
        
        <div className="p-6 sm:p-8 relative z-10">
          <Link href="/communities" className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-lg hover:bg-white/10 transition text-sm font-medium backdrop-blur-md bg-white/5 border border-white/10" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft size={16} /> All Communities
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                {community.iconUrl || '🎓'}
              </div>
              <div className="mt-2 sm:mt-0">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--foreground)' }}>
                  {community.name}
                </h1>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10" style={{ color: 'var(--muted)' }}>
                    <Users size={14} style={{ color: '#22d3ee' }} />
                    {membersCount.toLocaleString()} members
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleToggleJoin}
              disabled={joining}
              className={`px-8 py-3 rounded-xl font-bold flex flex-1 sm:flex-none justify-center items-center transition-all duration-300 shadow-lg border ${
                isMember ? 'bg-white/5 border-white/20 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400' : 'btn-primary border-transparent'
              }`}
              style={{ minWidth: '140px' }}
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : isMember ? 'Member' : 'Join Arena'}
            </button>
          </div>
          
          <p className="mt-6 text-base leading-relaxed max-w-3xl font-medium" style={{ color: 'var(--muted)' }}>
            {community.description}
          </p>
        </div>
      </div>

      {/* Write Post Prompt */}
      {isMember && (
         <div className="glass glass-hover p-4 mb-6 flex items-center gap-4 cursor-pointer shadow-md rounded-2xl animate-fade-in-up" onClick={() => setShowCreatePost(true)}>
           <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
             C
           </div>
           <div className="flex-1 font-medium text-sm" style={{ color: 'var(--muted)' }}>
             Launch an idea into #{community.name}...
           </div>
           <button className="btn-primary py-2 px-4 shadow-md text-sm whitespace-nowrap">
             <Plus size={16} className="mr-1 inline-block" /> Post
           </button>
         </div>
      )}

      {/* Feed Area */}
      <h3 className="font-bold text-lg mb-4 ml-1" style={{ color: 'var(--foreground)' }}>Top Posts in Arena</h3>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center flex flex-col items-center">
            <span className="text-4xl mb-3 opacity-80">🌱</span>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>It's quiet in here...</p>
            <p className="text-sm max-w-md" style={{ color: 'var(--muted)' }}>Be the absolute first person to claim territory and drop a post inside {community.name}!</p>
            {!isMember && (
              <p className="text-xs font-bold mt-4" style={{ color: '#7c3aed' }}>You must join the arena to post.</p>
            )}
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={loadCommunityData}
          defaultCommunityId={community.id}
          defaultCommunityName={community.name}
        />
      )}
    </>
  )
}
