'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, UserCircle2, Reply, MessageSquare, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/feed/PostCard'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const postId = resolvedParams.id

  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null)
  const [isAnon, setIsAnon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const fetchPostAndComments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Fetch Post
    const { data: postData } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(displayName, username, avatarUrl),
        community:communities(name, slug),
        _count:comments(count)
      `)
      .eq('id', postId)
      .single()

    if (postData) {
      setPost({
        ...postData,
        author: postData.author || undefined,
        _count: { comments: Array.isArray(postData._count) ? postData._count.length : 0 }
      })
    }

    // Fetch Comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        id, content, isAnonymous, createdAt, parentCommentId, authorId,
        author:users(displayName, username, avatarUrl),
        votes(userId, type)
      `)
      .eq('postId', postId)
      .order('createdAt', { ascending: true })

    if (commentsData) {
      setComments(commentsData)
    }
    setLoading(false)
  }, [postId, supabase])

  useEffect(() => {
    fetchPostAndComments()
  }, [fetchPostAndComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)

    if (!userId) {
      toast.error('You must be logged in to comment')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('comments').insert({
      id: crypto.randomUUID(),
      postId,
      authorId: userId,
      content: newComment.trim(),
      isAnonymous: isAnon,
      parentCommentId: replyingTo?.id || null,
      upvotes: 0
    })

    if (error) {
      toast.error('Failed to post comment')
    } else {
      setNewComment('')
      
      // Notify post author or parent comment author
      const targetUserId = replyingTo ? comments.find(c => c.id === replyingTo.id)?.authorId : post?.authorId
      if (targetUserId && targetUserId !== userId) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          userId: targetUserId,
          type: 'COMMENT',
          refId: postId,
          message: `${currentUser?.user_metadata?.displayName || 'Someone'} ${replyingTo ? 'replied to your comment' : 'commented on your post'}.`,
          isRead: false
        })
      }
      
      setReplyingTo(null)
      fetchPostAndComments()
    }
    setSubmitting(false)
  }

  const handleCommentVote = async (commentId: string, type: 'UP' | 'DOWN', currentVote: string | null) => {
    if (!userId) return toast.error('Please log in to vote')
    
    // optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const filteredVotes = c.votes.filter((v: any) => v.userId !== userId)
        if (type !== currentVote) {
          filteredVotes.push({ userId, type })
        }
        return { ...c, votes: filteredVotes }
      }
      return c
    }))

    await supabase.from('votes').delete().match({ userId, commentId })
    if (type !== currentVote) {
      await supabase.from('votes').insert({
        id: crypto.randomUUID(),
        userId,
        commentId,
        type
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Post not found</h2>
        <button onClick={() => router.back()} className="btn-ghost">Go back</button>
      </div>
    )
  }

  // Organize comments into thread tree
  const topLevelComments = comments.filter(c => !c.parentCommentId)
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId)

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-4 px-2">
        <button onClick={() => router.back()} className="btn-ghost p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Post Details</h1>
      </div>

      <PostCard post={post} />

      <div className="mt-8 px-2">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: 'var(--foreground)' }}>
          <MessageSquare size={18} className="text-purple-400" />
          Comments ({comments.length})
        </h2>

        <div className="flex flex-col gap-4 mb-8">
          {topLevelComments.length === 0 ? (
             <div className="text-center py-10 opacity-50">
               <p className="text-sm">Be the first to comment!</p>
             </div>
          ) : (
            topLevelComments.map(comment => (
              <CommentNode 
                key={comment.id} 
                comment={comment} 
                replies={getReplies(comment.id)} 
                allComments={comments}
                userId={userId!} 
                onReply={(id: string, author: string) => { setReplyingTo({ id, author }); document.getElementById('comment-input')?.focus() }}
                onVote={handleCommentVote}
              />
            ))
          )}
        </div>
      </div>

      {/* Sticky Comment Input */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-3 z-40 lg:left-60 xl:right-64 glass"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-2xl mx-auto relative">
          {replyingTo && (
            <div className="absolute -top-10 left-0 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-t-lg flex items-center gap-2 backdrop-blur-md border border-purple-500/30 border-b-0">
              <Reply size={12} />
              Replying to <strong>{replyingTo.author}</strong>
              <button onClick={() => setReplyingTo(null)} className="ml-2 hover:text-white"><X size={12} /></button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                id="comment-input"
                placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Add a comment..."}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="input-glass w-full py-3 px-4 pr-12 resize-none max-h-32 text-sm"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="btn-primary p-3 rounded-xl shrink-0 h-[46px] w-[46px] flex items-center justify-center"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CommentNode({ comment, replies, allComments, userId, onReply, onVote }: any) {
  const authorName = comment.isAnonymous ? 'Anonymous' : (comment.author?.displayName || 'Unknown')
  const myVote = comment.votes?.find((v: any) => v.userId === userId)?.type || null
  const score = comment.votes?.reduce((acc: number, v: any) => acc + (v.type === 'UP' ? 1 : -1), 0) || 0

  return (
    <div className="flex gap-3 animate-fade-in-up mt-2">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'var(--card)' }}>
        {comment.isAnonymous ? (
          <UserCircle2 size={16} style={{ color: 'var(--muted)' }} />
        ) : (
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{authorName[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="mb-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{authorName}</span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>• {formatDistanceToNow(new Date(comment.createdAt))}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 py-1 mb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onVote(comment.id, 'UP', myVote)}
              className={`text-xs font-medium transition-colors ${myVote === 'UP' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Upvote {score > 0 && <span className="ml-1">({score})</span>}
            </button>
            <button 
              onClick={() => onVote(comment.id, 'DOWN', myVote)}
              className={`text-xs font-medium transition-colors ${myVote === 'DOWN' ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Downvote
            </button>
          </div>
          <button 
            onClick={() => onReply(comment.id, authorName)}
            className="text-xs font-bold hover:underline transition-colors flex items-center gap-1"
            style={{ color: 'var(--muted)' }}
          >
            Reply
          </button>
        </div>

        {replies.length > 0 && (
          <div className="pl-4 border-l-2 flex flex-col gap-2 mt-2" style={{ borderColor: 'var(--border)' }}>
            {replies.map((reply: any) => (
              <CommentNode 
                key={reply.id} 
                comment={reply} 
                replies={allComments.filter((c: any) => c.parentCommentId === reply.id)} 
                allComments={allComments}
                userId={userId} 
                onReply={onReply}
                onVote={onVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
