'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Edit, Loader2, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NewChatModal } from '@/components/messages/NewChatModal'

function timeAgo(dateString: string) {
  let d = dateString
  if (d && !d.endsWith('Z')) d += 'Z'
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;
    
    async function loadConversations() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_senderId_fkey(id, displayName, username, avatarUrl),
          receiver:users!messages_receiverId_fkey(id, displayName, username, avatarUrl)
        `)
        .or(`senderId.eq.${user.id},receiverId.eq.${user.id}`)
        .order('createdAt', { ascending: false })
        .limit(200)

      if (data && isMounted) {
        // Group by the OTHER user
        const grouped = new Map()
        data.forEach((msg: any) => {
          const isSender = msg.senderId === user.id
          const otherUser = isSender ? msg.receiver : msg.sender
          if (!otherUser) return // Fallback if user deleted
          const otherUserId = otherUser.id
          
          if (!grouped.has(otherUserId)) {
            grouped.set(otherUserId, {
              user: otherUser,
              latestMessage: msg,
              unreadCount: (!isSender && !msg.isRead) ? 1 : 0
            })
          } else {
            const existing = grouped.get(otherUserId)
            if (!isSender && !msg.isRead) {
              existing.unreadCount += 1
            }
          }
        })
        setConversations(Array.from(grouped.values()))
        setLoading(false)
      } else if (!data && isMounted) {
        setLoading(false)
      }

      channel = supabase
        .channel('messages-inbox')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
           // Reload on incoming/outgoing to keep unread counts perfect
           if (payload.new.senderId === user.id || payload.new.receiverId === user.id) {
             loadConversations()
           }
        })
        .subscribe()
    }

    loadConversations()
    return () => { 
      isMounted = false;
      if (channel) supabase.removeChannel(channel) 
    }
  }, [])

  const filtered = conversations.filter(c => 
    c.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>Messages</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Direct messages with verified students</p>
        </div>
        <button 
          onClick={() => setShowNewChat(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(34,211,238,0.15))' }}
        >
          <Edit size={18} style={{ color: '#a78bfa' }} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
        <input
          type="text"
          placeholder="Search conversations…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-glass text-sm w-full"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
           <div className="flex justify-center p-10"><Loader2 className="animate-spin" style={{ color: '#7c3aed' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="glass p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
               <MessageSquare size={28} style={{ color: 'var(--muted)' }} />
            </div>
            <p className="font-medium text-lg mb-1" style={{ color: 'var(--foreground)' }}>No messages yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              {searchQuery ? 'Try a different search term.' : 'Start a chat to collaborate and share with campus!'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowNewChat(true)} className="btn-primary text-sm px-6 py-2.5">
                New Conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((chat, i) => (
            <Link
              key={chat.user.id}
              href={`/messages/${chat.user.id}`}
              className="glass glass-hover p-3 flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 text-white shadow-inner"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
              >
                {chat.user.displayName ? chat.user.displayName.charAt(0).toUpperCase() : '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--foreground)' }}>
                    {chat.user.displayName}
                  </h3>
                  <span className="text-[10px] shrink-0" style={{ color: chat.unreadCount > 0 ? '#a78bfa' : 'var(--muted)' }}>
                    {timeAgo(chat.latestMessage.createdAt)}
                  </span>
                </div>
                <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-semibold' : ''}`} style={{ color: chat.unreadCount > 0 ? 'var(--foreground)' : 'var(--muted)' }}>
                  {chat.latestMessage.senderId === chat.user.id ? '' : 'You: '}
                  {chat.latestMessage.content}
                </p>
              </div>

              {chat.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white" style={{ background: '#7c3aed' }}>
                  {chat.unreadCount}
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </>
  )
}
