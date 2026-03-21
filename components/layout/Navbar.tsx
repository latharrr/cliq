'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Zap, X, LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)', // Crucial for Native Android/iOS Status Bars
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 gap-4 h-16">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
          >
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span
            className="font-bold text-xl tracking-tight"
            style={{
              fontFamily: 'var(--font-inter)',
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cliq
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm mx-auto relative"
        >
          <div className="relative w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="text"
              placeholder="Search posts, people, communities…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-glass pl-9 py-2 text-sm w-full"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="md:hidden btn-ghost p-2"
            aria-label="Search"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Notifications */}
          <Link href="/feed" className="relative btn-ghost p-2" aria-label="Notifications">
            <Bell size={18} />
            <span
              className="absolute top-1 right-1 h-2 w-2 rounded-full"
              style={{ background: '#7c3aed' }}
            />
          </Link>

          {/* User avatar / menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all"
              style={{ borderColor: menuOpen ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
              aria-label="User menu"
            >
              <div
                className="w-full h-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
              >
                C
              </div>
            </button>

            {menuOpen && (
              <div
                className="glass absolute right-0 top-full mt-2 w-48 py-1"
                style={{ zIndex: 100 }}
              >
                <Link
                  href="/profile/me"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--foreground)' }}
                >
                  <User size={14} style={{ color: 'var(--muted)' }} /> Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--foreground)' }}
                >
                  <Settings size={14} style={{ color: 'var(--muted)' }} /> Settings
                </Link>
                <div className="divider my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5 text-red-400"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div
          className="md:hidden px-4 pb-3"
          style={{ background: 'rgba(10,10,15,0.95)' }}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-glass py-2 text-sm w-full"
              style={{ paddingLeft: '2.25rem' }}
            />
          </form>
        </div>
      )}
    </header>
  )
}
