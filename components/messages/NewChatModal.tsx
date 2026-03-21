'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function NewChatModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSearch = async (val: string) => {
    setQuery(val)
    if (val.trim().length === 0) {
      setResults([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('id, displayName, username, avatarUrl')
      .or(`displayName.ilike.%${val}%,username.ilike.%${val}%`)
      .limit(10)
    
    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>New Message</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-white/10 relative">
          <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search verified students..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-glass w-full text-sm"
            style={{ paddingLeft: '2.25rem' }}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="animate-spin" size={20} style={{ color: '#7c3aed' }} /></div>
          ) : results.length > 0 ? (
            results.map(user => (
              <button
                key={user.id}
                onClick={() => router.push(`/messages/${user.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-left"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}>
                  {user.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{user.displayName}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>@{user.username}</div>
                </div>
              </button>
            ))
          ) : query.length > 0 ? (
            <div className="text-center p-6 text-sm" style={{ color: 'var(--muted)' }}>No students found</div>
          ) : (
            <div className="text-center p-6 text-sm" style={{ color: 'var(--muted)' }}>Type a name or username</div>
          )}
        </div>
      </div>
    </div>
  )
}
