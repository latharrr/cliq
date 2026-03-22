'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MessageCircle, Search } from 'lucide-react'
import { useScrollDirection } from '@/lib/hooks/useScrollDirection'

const mobileLinks = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/search', label: 'Search', icon: Search },
]

export function BottomNav() {
  const pathname = usePathname()
  const { scrollDirection } = useScrollDirection()

  return (
    <nav
      className={`lg:hidden fixed left-0 right-0 z-50 flex items-center justify-around h-16 px-2 transition-transform duration-300 ease-in-out ${
        scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
      }`}
      style={{
        bottom: 0,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {mobileLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{
              color: active ? '#a78bfa' : 'var(--muted)',
              background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
            }}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
