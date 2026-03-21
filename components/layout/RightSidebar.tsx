'use client'

import Link from 'next/link'
import { TrendingUp, Calendar, Flame } from 'lucide-react'

const trendingTags = [
  { tag: 'placement2025', count: 128 },
  { tag: 'lpu_memes', count: 95 },
  { tag: 'exams', count: 73 },
  { tag: 'cricket', count: 61 },
  { tag: 'hostel', count: 44 },
]

const upcomingEvents = [
  { id: '1', title: 'Hackathon 2025', date: 'Mar 25', location: 'Block 32' },
  { id: '2', title: 'Cultural Fest', date: 'Mar 28', location: 'Main Auditorium' },
]

const activeCommunities = [
  { slug: 'tech', name: 'Tech', members: 1240 },
  { slug: 'memes', name: 'Memes', members: 2800 },
  { slug: 'academics', name: 'Academics', members: 3100 },
]

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-64 fixed right-0 top-16 bottom-0 overflow-y-auto py-4 px-3"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Trending */}
      <div className="glass p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} style={{ color: '#7c3aed' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Trending in Cliq
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {trendingTags.map(({ tag, count }, i) => (
            <Link
              key={tag}
              href={`/search?q=%23${tag}`}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold w-4"
                  style={{ color: 'var(--muted)' }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm font-medium group-hover:underline transition-colors"
                  style={{ color: '#22d3ee' }}
                >
                  #{tag}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {count} posts
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="glass p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} style={{ color: '#22d3ee' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Upcoming Events
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingEvents.map(ev => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="group">
              <p
                className="text-sm font-medium group-hover:underline"
                style={{ color: 'var(--foreground)' }}
              >
                {ev.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {ev.date} · {ev.location}
              </p>
            </Link>
          ))}
        </div>
        <Link
          href="/events"
          className="text-xs mt-3 block transition-colors hover:underline"
          style={{ color: '#a78bfa' }}
        >
          View all events →
        </Link>
      </div>

      {/* Active Communities */}
      <div className="glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={15} style={{ color: '#f97316' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Active Communities
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {activeCommunities.map(c => (
            <Link
              key={c.slug}
              href={`/communities/${c.slug}`}
              className="flex items-center justify-between group"
            >
              <span
                className="text-sm group-hover:underline transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                #{c.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {c.members.toLocaleString()} members
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
