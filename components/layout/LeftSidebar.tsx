'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Home, Users, Calendar, Megaphone, MessageCircle,
  Search, Settings, Hash, ChevronRight, Plus
} from 'lucide-react'

const mainLinks = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/notices', label: 'Notices', icon: Megaphone },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const defaultCommunities = [
  { slug: 'general', label: 'general' },
  { slug: 'memes', label: 'memes' },
  { slug: 'tech', label: 'tech' },
  { slug: 'academics', label: 'academics' },
  { slug: 'sports', label: 'sports' },
]

export function LeftSidebar() {
  const pathname = usePathname()
  const [university, setUniversity] = useState('Lovely Professional University')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('university').eq('id', user.id).single()
          .then(({ data }) => setUniversity(data?.university || 'Lovely Professional University'))
      }
    })
  }, [])

  return (
    <aside
      className="hidden lg:flex flex-col w-60 fixed left-0 top-16 bottom-0 z-40 overflow-y-auto py-4 px-3"
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 mb-6">
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              <Icon
                size={17}
                style={{ color: active ? '#a78bfa' : 'var(--muted)' }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="divider" />

      {/* Communities section */}
      <div className="mt-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted)' }}
          >
            Communities
          </span>
          <Link
            href="/communities"
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: '#a78bfa' }}
          >
            <Plus size={12} /> New
          </Link>
        </div>
        <div className="flex flex-col gap-0.5">
          {defaultCommunities.map(({ slug, label }) => {
            const active = pathname === `/communities/${slug}`
            return (
              <Link
                key={slug}
                href={`/communities/${slug}`}
                className={`nav-link text-sm ${active ? 'active' : ''}`}
              >
                <span style={{ color: active ? '#22d3ee' : 'var(--muted)' }}>#</span>
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div
          className="glass p-3 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(34,211,238,0.05))' }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            {university}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Verified campus network
          </p>
        </div>
      </div>
    </aside>
  )
}
