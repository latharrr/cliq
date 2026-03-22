'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Heart, MessageCircle, AlertCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'UPVOTE' | 'COMMENT' | 'DM' | 'EVENT' | 'NOTICE' | 'REPORT_ACTIONED'
  refId: string | null
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (data && mounted) {
        setNotifications(data)
        // Mark as read immediately on viewing
        const unreadIds = data.filter(n => !n.isRead).map(n => n.id)
        if (unreadIds.length > 0) {
          await supabase.from('notifications').update({ isRead: true }).in('id', unreadIds)
        }
      }
      setLoading(false)
    }
    
    fetchNotifications()
    return () => { mounted = false }
  }, [supabase])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'UPVOTE': return <Heart size={18} className="text-pink-400" />
      case 'COMMENT': return <MessageCircle size={18} className="text-blue-400" />
      case 'EVENT': return <Calendar size={18} className="text-emerald-400" />
      case 'NOTICE': return <AlertCircle size={18} className="text-amber-400" />
      default: return <Bell size={18} className="text-purple-400" />
    }
  }

  const getHref = (type: Notification['type'], refId: string | null) => {
    if (!refId) return '#'
    switch (type) {
      case 'UPVOTE':
      case 'COMMENT':
      case 'REPORT_ACTIONED':
        return `/post/${refId}`
      case 'EVENT':
        return `/events`
      case 'NOTICE':
        return `/notices`
      default:
        return '#'
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 px-2" style={{ color: 'var(--foreground)' }}>
        Notifications
      </h1>
      
      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass p-4 rounded-xl flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="skeleton w-3/4 h-4 mb-2" />
                <div className="skeleton w-1/4 h-3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="glass p-12 text-center rounded-xl">
            <Bell size={32} className="mx-auto mb-4 opacity-50 text-purple-400" />
            <h3 className="text-lg font-medium mb-1">All caught up!</h3>
            <p className="text-sm text-gray-400">You don't have any notifications right now.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <Link 
              key={notification.id} 
              href={getHref(notification.type, notification.refId)}
              className={`glass p-4 rounded-xl flex items-start gap-4 transition-all hover:bg-white/5 ${!notification.isRead ? 'border-purple-500/30 bg-purple-500/5' : ''}`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium leading-snug mb-1 text-gray-200">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
