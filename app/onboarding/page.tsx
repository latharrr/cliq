'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Upload, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const INTEREST_OPTIONS = [
  'Tech', 'Sports', 'Music', 'Gaming', 'Politics', 'Memes',
  'Academics', 'Art', 'Fitness', 'Food', 'Travel', 'Career',
  'Movies', 'Books', 'Startups', 'Photography',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [isAnonDefault, setIsAnonDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const handleComplete = async () => {
    if (interests.length < 3) {
      toast.error('Please select at least 3 interests')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      displayName,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      isAnonymousDefault: isAnonDefault,
      role: 'STUDENT',
      updatedAt: new Date().toISOString(),
    })

    if (error) {
      console.error('Save profile error:', error)
      toast.error('Failed to save profile. Try again.')
      setLoading(false)
      return
    }

    const { error: interestsError } = await supabase.from('user_interests').upsert(
      interests.map(interest => ({
        userId: user.id,
        interest,
      }))
    )
    if (interestsError) {
      console.error('Save interests error:', interestsError)
    }
    toast.success('Welcome to Cliq! 🎉')
    router.push('/feed')
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{
                background: s <= step ? 'linear-gradient(90deg, #7c3aed, #22d3ee)' : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        <div className="glass-strong p-6 animate-fade-in-up">
          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                What should we call you?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Choose a display name and username.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                    Display name
                  </label>
                  <input
                    type="text"
                    placeholder="Ravi Kumar"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="input-glass"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                    Username
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--muted)' }}
                    >@</span>
                    <input
                      type="text"
                      placeholder="ravikumar"
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                      className="input-glass"
                      style={{ paddingLeft: '1.75rem' }}
                      maxLength={20}
                    />
                  </div>
                </div>
                <button
                  onClick={() => { if (displayName && username) setStep(2) }}
                  disabled={!displayName || !username}
                  className="btn-primary w-full justify-center py-3 mt-2"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Pick your interests
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                Select at least 3 to personalise your feed.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {INTEREST_OPTIONS.map(interest => {
                  const selected = interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                      style={{
                        background: selected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                        borderColor: selected ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                        color: selected ? '#a78bfa' : 'var(--muted)',
                      }}
                    >
                      {selected && <Check size={11} className="inline mr-1" />}
                      {interest}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 justify-center">
                  ← Back
                </button>
                <button
                  onClick={() => { if (interests.length >= 3) setStep(3) }}
                  disabled={interests.length < 3}
                  className="btn-primary flex-1 justify-center"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--muted)' }}>
                {interests.length}/3+ selected
              </p>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                One last thing
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Set your default posting preference.
              </p>
              <div
                className="p-4 rounded-xl border mb-6"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      Post anonymously by default
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      You can change this per-post anytime
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAnonDefault(v => !v)}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{
                      background: isAnonDefault ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: isAnonDefault ? 'translateX(24px)' : 'none' }}
                    />
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost flex-1 justify-center">
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn-primary flex-1 justify-center"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Let's go! 🚀</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
