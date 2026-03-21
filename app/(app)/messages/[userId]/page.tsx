'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function timeFormat(dateString: string) {
  let d = dateString
  if (d && !d.endsWith('Z')) d += 'Z'
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function DirectChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = React.use(params)
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    async function loadChat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      if (isMounted) setMyId(user.id)

      // Fetch other user's profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profile && isMounted) setOtherUser(profile)

      // Fetch messages history
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(senderId.eq.${user.id},receiverId.eq.${userId}),and(senderId.eq.${userId},receiverId.eq.${user.id})`)
        .order('createdAt', { ascending: true }) // oldest to newest for chat
        .limit(100)

      if (msgs && isMounted) setMessages(msgs)
      if (isMounted) setLoading(false)

      // Mark unread as read
      const unreadMsgs = (msgs || []).filter(m => m.receiverId === user.id && !m.isRead)
      if (unreadMsgs.length > 0) {
        await supabase
          .from('messages')
          .update({ isRead: true })
          .in('id', unreadMsgs.map(m => m.id))
      }

      // Realtime subscription
      channel = supabase
        .channel(`chat-${user.id}-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          const newMsg = payload.new as any
          const involvesUs = 
            (newMsg.senderId === user.id && newMsg.receiverId === userId) ||
            (newMsg.senderId === userId && newMsg.receiverId === user.id)
            
          if (involvesUs) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            if (newMsg.receiverId === user.id) {
              // mark read if we're currently open
              supabase.from('messages').update({ isRead: true }).eq('id', newMsg.id).then()
            }
          }
        })
        .subscribe()
    }

    loadChat()

    return () => { 
      isMounted = false;
      if (channel) supabase.removeChannel(channel) 
    }
  }, [userId, router]) 

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || !myId || sending) return

    setSending(true)
    const content = text.trim()
    setText('') // optimistic clear

    const newMsg = {
      id: crypto.randomUUID(),
      senderId: myId,
      receiverId: userId,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    }

    // Optimistic update
    setMessages(prev => [...prev, newMsg])

    const { error } = await supabase.from('messages').insert(newMsg)

    if (error) {
      console.error('Failed to send:', error)
      setText(content) // revert if failed
      setMessages(prev => prev.filter(m => m.id !== newMsg.id))
    }
    setSending(false)
  }

  if (loading) {
    return <div className="h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin" size={32} style={{ color: '#7c3aed' }} /></div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-h-[800px] -mx-4 sm:mx-0">
      {/* Header */}
      <div className="glass rounded-none sm:rounded-2xl p-4 flex items-center gap-4 shrink-0 z-10 border-b border-white/5 relative shadow-md">
        <Link href="/messages" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}>
            {otherUser?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-bold leading-tight text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
              {otherUser?.displayName || 'Unknown Student'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              @{otherUser?.username || 'unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col container-scroll" style={{ background: 'rgba(0,0,0,0.1)' }}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Info size={24} style={{ color: 'var(--muted)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Say hello!</p>
            <p className="text-xs max-w-[200px] mt-1" style={{ color: 'var(--muted)' }}>Messages are processed in realtime via Supabase. Say "Hi" to test it out.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === myId
            return (
              <div key={msg.id || idx} className={`flex flex-col max-w-[75%] animate-fade-in-up ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                <div 
                  className={`p-3 rounded-2xl text-sm shadow-md ${
                    isMe 
                      ? 'rounded-tr-none text-white backdrop-blur-md'
                      : 'rounded-tl-none glass'
                  }`}
                  style={{
                    background: isMe ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : undefined,
                    color: isMe ? 'white' : 'var(--foreground)'
                  }}
                >
                  {msg.content}
                </div>
                <div className="text-[10px] mt-1 px-1 flex gap-2 items-center" style={{ color: 'var(--muted)' }}>
                  {timeFormat(msg.createdAt || new Date())}
                  {isMe && msg.isRead && <span className="font-bold" style={{ color: '#7c3aed' }}>Read</span>}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="glass rounded-none sm:rounded-2xl p-3 shrink-0 flex items-end gap-2 relative shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message..."
          className="input-glass flex-1 resize-none py-3 px-4 min-h-[44px] max-h-32 text-sm leading-normal scrollbar-none"
          rows={1}
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
        <button 
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-12 h-[44px] rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
        >
          {sending ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
        </button>
      </div>
    </div>
  )
}
