'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN || 'lpu.in'

export default function AuthPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    // if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    //   toast.error(`Only @${ALLOWED_DOMAIN} emails are allowed.`)
    //   return
    // }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('OTP sent! Check your inbox.')
    setStep('otp')
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: resultData, error: resultError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (resultError) {
      toast.error(resultError.message)
      return
    }
    const data = resultData as any
    if (data?.user) {
      // Check if new user (no username set) → onboarding; else → feed
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.user.id)
        .single()

      if (!profile?.username) {
        router.push('/onboarding')
      } else {
        router.push('/feed')
      }
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 70%)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
          >
            <Zap size={24} className="text-white" fill="white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to Cliq
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {step === 'email'
              ? `Sign in with your @${ALLOWED_DOMAIN} email`
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong p-6 animate-fade-in-up">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  College email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder={`you@${ALLOWED_DOMAIN}`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input-glass"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Only @{ALLOWED_DOMAIN} addresses accepted
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  6-digit OTP
                </label>
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    required
                    className="input-glass text-center text-xl tracking-widest font-bold"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Verify & Join <ArrowRight size={16} /></>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="btn-ghost w-full justify-center text-xs"
              >
                ← Change email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          By joining, you agree to our Terms of Service and Community Guidelines.
        </p>
      </div>
    </main>
  )
}
