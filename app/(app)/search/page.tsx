'use client'

import { useState, useEffect } from 'react'
import { SearchIcon, TrendingUp, Filter, Loader2, Users, Calendar, MessageSquare, Grid, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PostCard } from '@/components/feed/PostCard'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Top')
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState({
    posts: [] as any[],
    communities: [] as any[],
    users: [] as any[],
    events: [] as any[]
  })

  const router = useRouter()
  const supabase = createClient()

  // Debounce keystrokes to prevent hammering Supabase
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [query])

  // Execute global parallel search query
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery) {
        setResults({ posts: [], communities: [], users: [], events: [] })
        return
      }

      setLoading(true)
      const searchTerm = `%${debouncedQuery}%`

      const [postsRes, commsRes, usersRes, eventsRes] = await Promise.all([
        supabase.from('posts').select(`*, author:users(displayName, username, avatarUrl), community:communities(name, slug), _count:comments(count)`).ilike('content', searchTerm).order('createdAt', { ascending: false }).limit(6),
        supabase.from('communities').select('*').ilike('name', searchTerm).eq('isApproved', true).limit(4),
        supabase.from('users').select('*').ilike('displayName', searchTerm).limit(4),
        supabase.from('events').select('*').ilike('title', searchTerm).order('startTime', { ascending: true }).limit(4)
      ])

      setResults({
        posts: postsRes.data?.map(p => ({
          ...p,
          author: p.author ? { displayName: p.author.displayName, username: p.author.username, avatarUrl: p.author.avatarUrl } : undefined,
          _count: { comments: Array.isArray(p._count) ? p._count.length : p._count?.count || 0 }
        })) || [],
        communities: commsRes.data || [],
        users: usersRes.data || [],
        events: eventsRes.data || []
      })
      setLoading(false)
    }

    fetchResults()
  }, [debouncedQuery, supabase])

  const renderEmpty = () => (
    <div className="glass p-12 text-center mt-6 rounded-3xl border border-white/5">
      <SearchIcon size={32} className="mx-auto mb-3 opacity-20 text-white" />
      <p className="font-black mb-1 text-white tracking-tight text-lg">
        {loading ? 'Quantifying...' : `Scanning for "${debouncedQuery}"`}
      </p>
      <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--muted)' }}>
        {loading ? 'Initializing deep crawl' : 'No mathematical corrolaries found'}
      </p>
    </div>
  )

  const BlockHeader = ({ title, icon: Icon, count }: any) => (
    <div className="flex items-center gap-2 mb-4 mt-8 px-1">
      <Icon size={16} className="text-[#a78bfa]" />
      <h3 className="font-black uppercase tracking-wider text-xs text-white">{title}</h3>
      <span className="ml-auto text-xs font-bold bg-[#7c3aed]/20 text-[#a78bfa] px-2 py-0.5 rounded-full">{count}</span>
    </div>
  )

  const renderCommunities = (comms: any[]) => comms.map(c => (
    <div key={c.id} onClick={() => router.push(`/communities/${c.slug}`)} className="glass p-4 rounded-xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">{c.iconUrl}</div>
       <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">{c.name}</h4>
          <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{c.description}</p>
       </div>
    </div>
  ))

  const renderUsers = (users: any[]) => users.map(u => (
    <div key={u.id} onClick={() => router.push(`/profile/${u.username}`)} className="glass p-4 rounded-xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] flex items-center justify-center text-white font-black shrink-0">{u.displayName?.[0]?.toUpperCase() || '?'}</div>
       <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">{u.displayName}</h4>
          <p className="text-xs text-[#a78bfa] font-bold truncate">@{u.username}</p>
       </div>
    </div>
  ))

  const renderEvents = (events: any[]) => events.map(e => {
    let d = e.startTime
    if (d && !d.endsWith('Z')) d += 'Z'
    const dateObj = new Date(d)
    
    return (
      <div key={e.id} onClick={() => router.push('/events')} className="glass p-4 rounded-xl border border-white/5 flex flex-col gap-2 cursor-pointer hover:border-[#7c3aed]/30 transition-all">
         <div className="flex justify-between items-start">
           <h4 className="font-bold text-white leading-tight">{e.title}</h4>
           <span className="text-[10px] font-black uppercase tracking-wider bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-1 rounded-md shrink-0">Event</span>
         </div>
         <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-1">
           <span className="flex items-center gap-1"><MapPin size={12}/> {e.location}</span>
           <span className="flex items-center gap-1"><Calendar size={12}/> {dateObj.toLocaleDateString()}</span>
         </div>
      </div>
    )
  })

  return (
    <div>
      {/* Header Search Bar */}
      <div className="flex flex-col mb-6 animate-fade-in-up">
        <h1 className="text-3xl font-black tracking-tight mb-4 text-white drop-shadow-sm">
          Discovery Node
        </h1>
        <div className="relative">
          <SearchIcon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all ${debouncedQuery ? 'text-[#a78bfa]' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Query communities, profiles, broadcasts, or events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-glass py-4 text-sm w-full font-bold text-white tracking-wide border-white/10"
            style={{ paddingLeft: '3rem', borderRadius: '1.25rem' }}
            autoFocus
          />
          {loading && <Loader2 size={16} className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-[#a78bfa]" />}
        </div>
      </div>

      {/* Recommended / Trending */}
      {!debouncedQuery && (
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xs font-black uppercase tracking-wider mb-4 mt-8 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <TrendingUp size={14} style={{ color: '#a78bfa' }} /> Global Top Nodes
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {['#exam_season', 'Hackathon 2025', 'Machine Learning', '#lpu_memes'].map(term => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm active:scale-95 hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                {term}
              </button>
            ))}
          </div>
          
          <div className="mt-12 glass p-6 rounded-3xl border border-white/5 text-center px-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#7c3aed]/20 to-[#22d3ee]/20 flex items-center justify-center border border-[#7c3aed]/30 shadow-inner">
               <SearchIcon size={24} className="text-[#a78bfa]" />
            </div>
            <h3 className="font-black text-xl text-white mb-2">Connect to the Campus Grid</h3>
            <p className="text-sm font-semibold text-gray-400">Type any concept, student name, or club keyword across the entire universal database above to initiate a direct crawl.</p>
          </div>
        </div>
      )}

      {/* Results block */}
      {debouncedQuery && (
        <div className="animate-fade-in-up">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar border-b border-white/5">
            {['Top', 'Posts', 'Communities', 'People', 'Events'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm"
                style={{
                  background: activeTab === tab ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.01)',
                  borderColor: activeTab === tab ? 'rgba(124,58,237,0.4)' : 'transparent',
                  color: activeTab === tab ? '#fca5a5' : 'var(--muted)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {!loading && results.posts.length === 0 && results.communities.length === 0 && results.users.length === 0 && results.events.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="flex flex-col gap-2">
               
               {/* TOP VIEW MIX */}
               {activeTab === 'Top' && (
                 <>
                   {results.communities.length > 0 && (
                     <div className="mb-4">
                       <BlockHeader title="Communities" icon={MessageSquare} count={results.communities.length} />
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{renderCommunities(results.communities.slice(0, 2))}</div>
                     </div>
                   )}
                   {results.users.length > 0 && (
                     <div className="mb-4">
                       <BlockHeader title="Profiles" icon={Users} count={results.users.length} />
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{renderUsers(results.users.slice(0, 2))}</div>
                     </div>
                   )}
                   {results.events.length > 0 && (
                     <div className="mb-4">
                       <BlockHeader title="Events" icon={Calendar} count={results.events.length} />
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{renderEvents(results.events.slice(0, 2))}</div>
                     </div>
                   )}
                   {results.posts.length > 0 && (
                     <div className="mb-4">
                       <BlockHeader title="Broadcasts" icon={Grid} count={results.posts.length} />
                       <div className="flex flex-col gap-4">{results.posts.slice(0, 3).map(p => <PostCard key={p.id} post={p} />)}</div>
                     </div>
                   )}
                 </>
               )}

               {/* INDIVIDUAL VIEWS */}
               {activeTab === 'Communities' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCommunities(results.communities)}</div>
               )}
               {activeTab === 'People' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderUsers(results.users)}</div>
               )}
               {activeTab === 'Events' && (
                  <div className="flex flex-col gap-3">{renderEvents(results.events)}</div>
               )}
               {activeTab === 'Posts' && (
                  <div className="flex flex-col gap-4">{results.posts.map(p => <PostCard key={p.id} post={p} />)}</div>
               )}

            </div>
          )}
        </div>
      )}
    </div>
  )
}
