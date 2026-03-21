'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, FileText, Flag, MessageSquare, Loader2, AlertTriangle, CheckCircle, Search, Megaphone, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'Overview' | 'Clubs' | 'Scholars' | 'Broadcast'>('Overview')
  
  const [stats, setStats] = useState({ users: 0, postsToday: 0, pendingReports: 0, activeCommunities: 0 })
  const [reports, setReports] = useState<any[]>([])
  
  // Communities Tab
  const [pendingClubs, setPendingClubs] = useState<any[]>([])
  
  // Scholars Tab
  const [userSearch, setUserSearch] = useState('')
  const [foundUsers, setFoundUsers] = useState<any[]>([])
  
  // Broadcast Tab
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeBody, setNoticeBody] = useState('')
  const [noticeUrgent, setNoticeUrgent] = useState(false)
  
  const [processing, setProcessing] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setActiveUserId(user.id)

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [usersCount, postsTodayCount, reportsCount, commsCount, recentReports, pendingCommRes, usersRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('createdAt', startOfDay.toISOString()),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('communities').select('*', { count: 'exact', head: true }).eq('isApproved', true),
      supabase.from('reports').select('*, reporter:users(displayName, username), post:posts(content), comment:comments(content)').eq('status', 'PENDING').order('createdAt', { ascending: false }).limit(20),
      supabase.from('communities').select('*, creator:users(displayName, username)').eq('isApproved', false).order('createdAt', { ascending: false }),
      supabase.from('users').select('*').order('createdAt', { ascending: false }).limit(20)
    ])

    setStats({
      users: usersCount.count || 0,
      postsToday: postsTodayCount.count || 0,
      pendingReports: reportsCount.count || 0,
      activeCommunities: commsCount.count || 0
    })

    if (recentReports.data) setReports(recentReports.data)
    if (pendingCommRes.data) setPendingClubs(pendingCommRes.data)
    if (usersRes.data) setFoundUsers(usersRes.data)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // --- Search Users ---
  useEffect(() => {
    const searchUsers = async () => {
      let query = supabase.from('users').select('*')
      if (userSearch.trim()) {
        query = query.ilike('displayName', `%${userSearch.trim()}%`)
      }
      const { data } = await query.order('createdAt', { ascending: false }).limit(20)
      if (data) setFoundUsers(data)
    }
    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearch, supabase])

  // --- Handlers ---
  const handleModeration = async (reportId: string, newStatus: 'ACTIONED' | 'DISMISSED') => {
    setProcessing(reportId)
    const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', reportId)
    if (!error) {
      toast.success(`Report visibly ${newStatus.toLowerCase()}!`)
      setReports(reports.filter(r => r.id !== reportId))
      setStats(s => ({ ...s, pendingReports: Math.max(0, s.pendingReports - 1) }))
    }
    setProcessing(null)
  }

  const handleApproveClub = async (clubId: string) => {
    setProcessing(clubId)
    const { error } = await supabase.from('communities').update({ isApproved: true }).eq('id', clubId)
    if (!error) {
      toast.success('Club Officially Approved!')
      setPendingClubs(pendingClubs.filter(c => c.id !== clubId))
      setStats(s => ({ ...s, activeCommunities: s.activeCommunities + 1 }))
    }
    setProcessing(null)
  }

  const handleRejectClub = async (clubId: string) => {
    setProcessing(clubId)
    const { error } = await supabase.from('communities').delete().eq('id', clubId)
    if (!error) {
      toast.error('Club Request Erased.')
      setPendingClubs(pendingClubs.filter(c => c.id !== clubId))
    }
    setProcessing(null)
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noticeTitle.trim() || !noticeBody.trim()) return toast.error('Fill all broadcast fields')
    setProcessing('broadcast')
    
    const { error } = await supabase.from('notices').insert({
      id: crypto.randomUUID(),
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      category: 'ADMINISTRATIVE',
      isUrgent: noticeUrgent,
      isPinned: true, // Always pin Global Broadcasts
      createdById: activeUserId
    })

    setProcessing(null)
    if (error) { toast.error(error.message) } 
    else {
      toast.success('GLOBAL BROADCAST DISPATCHED!')
      setNoticeTitle('')
      setNoticeBody('')
      setNoticeUrgent(false)
      setActiveTab('Overview') // return to overview
    }
  }

  const statCards = [
    { label: 'Total Scholars', value: stats.users, icon: Users, color: '#3b82f6' },
    { label: 'Posts Tracked', value: stats.postsToday, icon: FileText, color: '#10b981' },
    { label: 'Pending Interventions', value: stats.pendingReports, icon: Flag, color: '#ef4444' },
    { label: 'Live Academic Hubs', value: stats.activeCommunities, icon: MessageSquare, color: '#f59e0b' },
  ]

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 size={40} className="animate-spin text-primary" /></div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Shield size={28} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Admin God-View
            </h1>
            <p className="text-sm font-bold opacity-90 mt-0.5" style={{ color: '#fca5a5' }}>
              Unfettered moderation megastructure
            </p>
          </div>
        </div>
        
        <div className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 flex items-center gap-2">
          <AlertTriangle size={14} /> Global Bypass Active
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 border-b animate-fade-in-up" style={{ borderColor: 'rgba(255,255,255,0.05)', animationDelay: '100ms' }}>
        {['Overview', 'Clubs', 'Scholars', 'Broadcast'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === tab ? '#fca5a5' : 'var(--muted)',
              border: `1px solid ${activeTab === tab ? 'rgba(239, 68, 68, 0.3)' : 'transparent'}`
            }}
          >
            {tab}{tab === 'Clubs' && pendingClubs.length > 0 && ` (${pendingClubs.length})`}
          </button>
        ))}
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, i) => (
                <div key={i} className="glass p-5 border border-white/5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 disabled border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <stat.icon size={14} style={{ color: stat.color }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-3xl font-black tabular-nums text-white">
                    {stat.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-6 sm:p-8 border border-white/5 rounded-3xl">
              <div className="flex items-center justify-between mb-6 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <h2 className="text-lg font-black tracking-tight text-white">Queue Intervention</h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400">
                  {reports.length} Flags
                </span>
              </div>
              
              {reports.length === 0 ? (
                 <div className="text-center py-10">
                   <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mx-auto flex justify-center items-center mb-4"><CheckCircle size={30} className="text-green-500" /></div>
                   <p className="font-bold text-lg text-white">Grid Clean</p>
                   <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">Zero violations detected</p>
                 </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm min-w-max">
                    <tbody className="divide-y divide-white/5">
                      {reports.map(report => {
                        const targetContent = report.post?.content || report.comment?.content || '*Deleted*'
                        const reporterStr = report.reporter?.displayName || 'Ghost'
                        return (
                          <tr key={report.id} className="group transition-colors hover:bg-white/5">
                            <td className="py-4 px-2 font-black text-xs uppercase tracking-wider text-red-400">{report.reason}</td>
                            <td className="py-4 px-2 text-white font-medium max-w-xs truncate pr-6">"{targetContent}"</td>
                            <td className="py-4 px-2 text-xs font-semibold text-gray-400">@{reporterStr}</td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex justify-end gap-2.5">
                                <button disabled={processing === report.id} onClick={() => handleModeration(report.id, 'ACTIONED')} className="px-4 py-1.5 text-[11px] uppercase tracking-wider shadow rounded-lg bg-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white border border-red-500/50">Ban</button>
                                <button disabled={processing === report.id} onClick={() => handleModeration(report.id, 'DISMISSED')} className="px-4 py-1.5 text-[11px] uppercase tracking-wider shadow rounded-lg bg-white/10 text-white font-bold border border-white/20 hover:bg-white hover:text-black">Ignore</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* CLUBS TAB */}
        {activeTab === 'Clubs' && (
          <div className="glass p-6 sm:p-8 border border-white/5 rounded-3xl">
             <div className="flex items-center justify-between mb-6 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
               <h2 className="text-lg font-black tracking-tight text-white">Pending Club Requests</h2>
             </div>
             {pendingClubs.length === 0 ? (
               <div className="text-center py-10 text-gray-500 font-bold uppercase tracking-wider text-sm">No communities waiting for approval</div>
             ) : (
               <div className="flex flex-col gap-4">
                 {pendingClubs.map(club => (
                   <div key={club.id} className="glass p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">{club.iconUrl}</div>
                       <div>
                         <h3 className="font-bold text-lg text-white">{club.name}</h3>
                         <p className="text-sm font-medium text-gray-400 mt-1">{club.description}</p>
                         <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">Requested by <span className="text-[#a78bfa]">@{club.creator?.username || 'Unknown'}</span></p>
                       </div>
                     </div>
                     <div className="flex gap-3 w-full md:w-auto">
                       <button onClick={() => handleApproveClub(club.id)} disabled={processing === club.id} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"><Check size={16}/> Approve</button>
                       <button onClick={() => handleRejectClub(club.id)} disabled={processing === club.id} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"><X size={16}/> Reject</button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* SCHOLARS TAB */}
        {activeTab === 'Scholars' && (
          <div className="glass p-6 sm:p-8 border border-white/5 rounded-3xl flex flex-col gap-6">
             <div className="relative">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
               <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search scholarly identities by display name..." className="w-full input-glass py-4 pl-12 pr-4 font-bold text-white tracking-wide border-white/10" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {foundUsers.map(u => (
                 <div key={u.id} className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3 truncate">
                     <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#22d3ee] flex items-center justify-center text-white font-black">{u.displayName?.[0]?.toUpperCase() || '?'}</div>
                     <div className="truncate">
                       <h3 className="font-bold text-sm text-white truncate">{u.displayName}</h3>
                       <p className="text-xs font-semibold text-[#a78bfa] truncate">@{u.username}</p>
                     </div>
                   </div>
                   <button onClick={() => router.push(`/profile/${u.username}`)} className="px-3 shrink-0 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-gray-300">View</button>
                 </div>
               ))}
               {foundUsers.length === 0 && <div className="col-span-full text-center py-8 text-gray-500 font-bold uppercase text-sm">No profiles mathematically correspond</div>}
             </div>
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'Broadcast' && (
          <div className="glass p-6 sm:p-8 border border-red-500/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-6 pb-2 border-b border-red-500/20">
               <Megaphone className="text-red-400" size={20} />
               <h2 className="text-lg font-black tracking-tight text-white">Global Emergency Broadcast</h2>
             </div>
             <form onSubmit={handleBroadcast} className="flex flex-col gap-5">
               <div>
                  <label className="text-xs font-black uppercase tracking-wider text-red-400 mb-2 block">Header Title</label>
                  <input type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full input-glass py-3 px-4 font-bold text-white border-red-500/20" placeholder="e.g. CAMPUS WEATHER LOCKDOWN" maxLength={100} />
               </div>
               <div>
                  <label className="text-xs font-black uppercase tracking-wider text-red-400 mb-2 block">Broadcast Payload</label>
                  <textarea value={noticeBody} onChange={e => setNoticeBody(e.target.value)} rows={4} className="w-full input-glass py-3 px-4 font-bold text-gray-300 resize-none border-red-500/20" placeholder="Enter explicit administrative orders..." />
               </div>
               <div className="flex items-center gap-3">
                 <button type="button" onClick={() => setNoticeUrgent(!noticeUrgent)} className={`w-12 h-6 rounded-full relative transition-all border ${noticeUrgent ? 'bg-red-500 border-red-500' : 'bg-transparent border-red-500/30'}`}>
                   <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${noticeUrgent ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
                 <span className="text-xs font-bold uppercase tracking-wider text-red-300">Trigger Code Red Sirens (Mark Urgent)</span>
               </div>
               <button disabled={processing === 'broadcast'} type="submit" className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                 {processing === 'broadcast' ? <Loader2 size={20} className="animate-spin" /> : <><Megaphone size={18} /> Push Transmission to All Terminals</>}
               </button>
             </form>
          </div>
        )}
      </div>
    </div>
  )
}
