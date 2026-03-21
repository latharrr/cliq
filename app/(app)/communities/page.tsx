'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Search, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RequestCommunityModal } from '@/components/communities/RequestCommunityModal'

function CommunitySkeleton() {
  return (
    <div className="glass p-4 rounded-2xl">
      <div className="skeleton h-8 w-8 rounded-xl mb-3" />
      <div className="skeleton h-4 w-28 mb-2" />
      <div className="skeleton h-3 w-full mb-1" />
      <div className="skeleton h-3 w-4/5" />
    </div>
  )
}

export default function CommunitiesPage() {
  const [search, setSearch] = useState('')
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const supabase = createClient()

  const fetchCommunities = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        _count:community_members(count)
      `)
      .eq('isApproved', true)
      .order('createdAt', { ascending: false })

    if (data) {
      setCommunities(data.map(c => ({
        ...c,
        memberCount: Array.isArray(c._count) ? c._count.length : c._count?.count || 0 
      })))
    }
    setLoading(false)
  }, []) // Remove supabase from dependency to avoid infinite loops if it changes identity

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Communities
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Find your people on campus
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm px-4 hidden sm:flex items-center gap-2"
        >
          <Plus size={15} /> Create
        </button>
      </div>

      {/* Search + create (Mobile) */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search communities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-glass text-sm w-full"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <button 
           onClick={() => setShowModal(true)}
           className="btn-primary text-sm px-4 flex sm:hidden items-center justify-center shrink-0"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <CommunitySkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Users size={28} style={{ color: 'var(--muted)' }} />
          </div>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>No communities found</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {search ? 'Try a different search term.' : 'Be the first to create one!'}
          </p>
          {!search && (
            <button onClick={() => setShowModal(true)} className="btn-primary px-6 text-sm">Create New</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <Link
              key={c.slug}
              href={`/communities/${c.slug}`}
              className="glass glass-hover p-4 block rounded-2xl animate-fade-in-up"
              style={{ animationDelay: `${(i % 10) * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-3xl">{c.iconUrl || '🎓'}</div>
                <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)' }}>
                  {c.memberCount} M
                </span>
              </div>
              <h3 className="font-bold mb-1 truncate" style={{ color: 'var(--foreground)' }}>
                {c.name}
              </h3>
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                {c.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="text-xs font-bold"
                  style={{ color: '#22d3ee' }}
                >
                  Enter Arena →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <RequestCommunityModal 
          onClose={() => setShowModal(false)} 
          onCreated={fetchCommunities} 
        />
      )}
    </div>
  )
}
