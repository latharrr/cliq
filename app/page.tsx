import Link from 'next/link'
import { Zap, Shield, Users, MessageCircle, Calendar, Megaphone, ArrowRight, Star } from 'lucide-react'

const features = [
  { icon: Users, title: 'Communities', desc: 'Join interest-based groups for your campus — tech, memes, sports, and more.' },
  { icon: MessageCircle, title: 'Private DMs', desc: 'Chat 1-on-1 with verified classmates in real-time, securely.' },
  { icon: Calendar, title: 'Campus Events', desc: 'Discover, RSVP, and create events happening on your campus.' },
  { icon: Megaphone, title: 'Official Notices', desc: 'Stay updated with verified college announcements in one place.' },
  { icon: Shield, title: 'Verified Only', desc: 'Every member is verified with their institutional email address.' },
  { icon: Zap, title: 'Real-time Feed', desc: 'Posts and reactions appear live — no refresh needed.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar strip */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12"
        style={{
          background: 'rgba(10,10,15,0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
          >
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span
            className="font-bold text-xl"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cliq
          </span>
        </div>
        <Link href="/auth" className="btn-primary text-sm py-2 px-4">
          Sign In
        </Link>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center pt-32 pb-20 px-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold animate-fade-in"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <Star size={11} fill="currentColor" />
          Lovely Professional University · Verified Campus Network
        </div>

        {/* Headline */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-fade-in-up"
          style={{ maxWidth: '800px', color: 'var(--foreground)' }}
        >
          Your campus{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            social layer
          </span>
          ,{' '}
          <br className="hidden md:block" />
          built for Gen Z.
        </h1>

        <p
          className="text-lg md:text-xl mb-10 max-w-xl animate-fade-in-up delay-100"
          style={{ color: 'var(--muted)', lineHeight: 1.7 }}
        >
          Reddit meets Discord, built exclusively for{' '}
          <strong style={{ color: 'var(--foreground)' }}>verified students</strong>{' '}
          of your institution. Anonymous posts, live feed, communities, events — all in one place.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-200">
          <Link
            href="/auth"
            className="btn-primary text-base px-8 py-3"
            id="cta-join-btn"
          >
            Join with College Email <ArrowRight size={18} />
          </Link>
          <Link
            href="/feed"
            className="btn-ghost text-base px-8 py-3 border"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Browse Feed
          </Link>
        </div>

        {/* Social proof */}
        <div
          className="flex items-center gap-6 mt-12 text-sm animate-fade-in-up delay-300"
          style={{ color: 'var(--muted)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['#7c3aed', '#22d3ee', '#f97316', '#10b981'].map((bg, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-black"
                  style={{ background: bg }}
                />
              ))}
            </div>
            <span>1,200+ students joined</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />
            ))}
            <span className="ml-1">Loved by students</span>
          </div>
        </div>

        {/* App preview card */}
        <div
          className="glass mt-16 w-full max-w-2xl p-4 animate-fade-in-up delay-400"
          style={{
            background: 'rgba(255,255,255,0.03)',
            boxShadow: '0 0 60px rgba(124,58,237,0.15)',
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
            <div className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
            <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
              cliq.app/feed
            </span>
          </div>
          {/* Mock posts */}
          {[
            { name: 'Ravi K.', time: '2m ago', content: 'Just submitted the OS assignment 🎉 Who else is done?', tag: 'academics', upvotes: 42, comments: 18 },
            { name: 'Anonymous', time: '8m ago', content: 'The canteen food quality has gone down drastically this semester. Someone needs to address this!!', tag: 'general', upvotes: 128, comments: 36, anon: true },
          ].map((post, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-white/5 last:border-0">
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: post.anon ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}
              >
                {post.anon ? '?' : post.name[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    {post.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{post.time}</span>
                  <span className="tag text-xs py-0.5 px-2">#{post.tag}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                  {post.content}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span>▲ {post.upvotes}</span>
                  <span>💬 {post.comments}</span>
                  <span>Share</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-3"
          style={{ color: 'var(--foreground)' }}
        >
          Everything your campus needs
        </h2>
        <p className="text-center mb-12" style={{ color: 'var(--muted)' }}>
          Built specifically for campus life — not a generic social app.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="glass glass-hover p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both', opacity: 0 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <Icon size={18} style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-16 px-6 text-center">
        <div
          className="glass max-w-2xl mx-auto p-10"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(34,211,238,0.05))',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 0 40px rgba(124,58,237,0.1)',
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Ready to join your campus circle?
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>
            Sign up with your LPU email and get instant access.
          </p>
          <Link
            href="/auth"
            className="btn-primary text-base px-10 py-3 inline-flex"
            id="cta-join-btn-2"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs"
        style={{ color: 'var(--muted)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p>© 2025 Cliq · Built for LPU students · All rights reserved</p>
      </footer>
    </main>
  )
}
