'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Bell, Shield, Moon, Monitor, Edit2, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account')
  
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [isAnonDefault, setIsAnonDefault] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUserId(user.id)

    // Using exact Prisma camelcase properties as DB columns
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile && !error) {
      setDisplayName(profile.displayName || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setIsAnonDefault(!!profile.isAnonymousDefault)
      setAvatarUrl(profile.avatarUrl || '')
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    if (!displayName.trim()) return toast.error('Display Name cannot be empty')
    
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        displayName: displayName.trim(),
        bio: bio.trim(),
        isAnonymousDefault: isAnonDefault,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
       toast.error(error.message)
    } else {
       toast.success('Profile preferences updated!')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 text-sm font-semibold overflow-x-auto no-scrollbar border-b md:border-b-0 md:border-r pb-4 md:pb-0 pr-0 md:pr-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { id: 'Account', icon: User },
            { id: 'Notifications', icon: Bell },
            { id: 'Appearance', icon: Monitor },
            { id: 'Privacy', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2.5 px-4 md:px-3 py-2.5 md:py-2.5 rounded-xl transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#a78bfa' : 'var(--muted)',
                border: activeTab === tab.id ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent'
              }}
            >
              <tab.icon size={16} /> {tab.id}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-xl animate-fade-in-up">
          {activeTab === 'Account' && (
            <div className="flex flex-col gap-5">
              
              {loading ? (
                <div className="flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
              ) : (
                <>
                  {/* Profile Card */}
                  <div className="glass p-5 flex items-center gap-4 border border-white/5">
                    <div className="relative">
                      {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                         <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-inner"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)', color: 'white' }}
                        >
                          {displayName.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <button
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 transition-transform active:scale-90 shadow-md"
                        style={{ background: '#3b82f6', color: 'white' }}
                        title="Avatar uploads coming soon!"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--foreground)' }}>{displayName || 'New Scholar'}</h3>
                      <p className="text-sm font-semibold opacity-90" style={{ color: '#a78bfa' }}>@{username}</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="glass p-6 gap-5 flex flex-col border border-white/5 shadow-md">
                    <h3 className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                      Identity Details
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Display Name</label>
                      <input 
                         type="text" 
                         value={displayName} 
                         onChange={e => setDisplayName(e.target.value)}
                         placeholder="What should people call you?"
                         className="input-glass text-base p-3 font-semibold shadow-inner" 
                         maxLength={50}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                       <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Biography Link</label>
                       <span className="text-[10px] text-gray-500 font-bold">{bio.length}/100</span>
                    </div>
                    <div className="-mt-1">
                      <textarea 
                         value={bio} 
                         onChange={e => setBio(e.target.value)}
                         placeholder="A short snippet showcasing who you are..." 
                         rows={2} 
                         className="input-glass resize-none font-medium leading-relaxed p-3 shadow-inner" 
                         maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="glass p-6 flex items-center justify-between border border-white/5 shadow-md">
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Default to Anonymous</h3>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: 'var(--muted)' }}>Mask identity globally automatically</p>
                    </div>
                    <button
                      onClick={() => setIsAnonDefault(v => !v)}
                      className="relative w-12 h-6 rounded-full transition-all shrink-0 cursor-pointer shadow-inner inset-y-0 my-auto border"
                      style={{ 
                          background: isAnonDefault ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                          borderColor: isAnonDefault ? 'transparent' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <span
                        className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform shadow flex items-center justify-center bg-white"
                        style={{ transform: isAnonDefault ? 'translateX(22px)' : 'none' }}
                      />
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end mt-2">
                     <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="py-3 px-8 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
                     >
                       {saving ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
                       {saving ? 'Synchronizing DB...' : 'Save Preferences'}
                     </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-red-500/10">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center w-full gap-2 py-3.5 rounded-xl font-bold transition-all hover:bg-red-500/10 active:scale-95"
                      style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <LogOut size={16} /> Secure Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Appearance' && (
            <div className="glass p-6 animate-fade-in-up rounded-2xl border border-white/5">
              <h3 className="font-bold text-[11px] uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>Theme Injection</h3>
              <div className="flex gap-4">
                <button className="flex-1 py-4 flex-col rounded-xl border-2 flex items-center justify-center gap-2 font-black transition-all shadow-md bg-transparent" style={{ borderColor: '#7c3aed', color: '#a78bfa' }}>
                  <Moon size={20} className="mb-1" /> Dark Void
                </button>
                <button onClick={() => toast('System mapping restricted in Demo')} className="flex-1 py-4 flex-col rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--muted)' }}>
                  <Monitor size={20} className="mb-1 opacity-50" /> System Linked
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'Account' && activeTab !== 'Appearance' && (
            <div className="flex flex-col items-center justify-center h-48 animate-fade-in-up border border-white/5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.01)' }}>
               <Shield size={32} className="mb-4 opacity-20 text-white" />
               <h3 className="font-bold text-gray-400">Section Locked</h3>
               <p className="text-xs font-semibold text-gray-600 mt-1 uppercase tracking-wider">Available in Version 2</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
