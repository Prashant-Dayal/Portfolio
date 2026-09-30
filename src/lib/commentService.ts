import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type CommentReply = {
  id: string | number
  name: string
  username?: string
  message: string
  created_at?: string
  is_admin?: boolean
}

export type CommentItem = {
  id: number
  name: string
  comment: string
  image_url?: string | null
  likes?: number
  is_pinned?: boolean
  created_at?: string
  is_liked?: boolean
  liked_by_admin?: boolean
  replies?: CommentReply[]
}

const LOCAL_COMMENTS_KEY = 'portfolio-comments'

const readLocalComments = (): CommentItem[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

const saveLocalComments = (comments: CommentItem[]) => {
  localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments))
}

export const getVisitorId = async () => {
  if (!isSupabaseConfigured) return 'local-visitor'

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (sessionData.session?.user.id) return sessionData.session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  if (!data.user) throw new Error('Unable to create a visitor session.')
  return data.user.id
}

export const fetchCommentsService = async (visitorId?: string | null) => {
  if (!isSupabaseConfigured) return readLocalComments()

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error

  const comments = (data ?? []).map((item: any) => ({
    ...item,
    replies: Array.isArray(item.replies) ? item.replies : [],
  })) as CommentItem[]

  if (!visitorId) return comments.map((item) => ({ ...item, is_liked: false }))

  try {
    const { data: likes, error: likesError } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', visitorId)
    if (!likesError && likes) {
      const likedCommentIds = new Set(
        (likes as { comment_id: number }[] ?? []).map((like) => like.comment_id),
      )
      return comments.map((item) => ({ ...item, is_liked: likedCommentIds.has(item.id) }))
    }
  } catch {
    // If comment_likes table is not queryable, proceed with default false
  }

  return comments.map((item) => ({ ...item, is_liked: false }))
}

export const toggleCommentLikeService = async (
  id: number,
  visitorId: string,
  isLiked: boolean,
) => {
  if (!isSupabaseConfigured) {
    const updated = readLocalComments().map((item) =>
      item.id === id
        ? { ...item, likes: Math.max((item.likes ?? 0) + (isLiked ? -1 : 1), 0), is_liked: !isLiked }
        : item,
    )
    saveLocalComments(updated)
    return updated.find((item) => item.id === id)!
  }

  // Attempt using comment_likes table
  try {
    const query = isLiked
      ? supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', visitorId)
      : supabase.from('comment_likes').insert({ comment_id: id, user_id: visitorId })
    const { error } = await query

    if (!error) {
      const { data, error: commentError } = await supabase
        .from('comments')
        .select('likes')
        .eq('id', id)
        .single()
      if (!commentError && data) {
        return { likes: data.likes ?? 0, is_liked: !isLiked }
      }
    }
  } catch {
    // Fallback directly to comments table update if comment_likes is not set up
  }

  // Fallback: direct comments update
  const { data: currentComment } = await supabase
    .from('comments')
    .select('likes')
    .eq('id', id)
    .single()

  const currentLikes = currentComment?.likes ?? 0
  const newLikes = isLiked ? Math.max(currentLikes - 1, 0) : currentLikes + 1

  await supabase
    .from('comments')
    .update({ likes: newLikes })
    .eq('id', id)

  return { likes: newLikes, is_liked: !isLiked }
}

export const uploadCommentImageService = async (
  image: File
) => {
  const fileName = `${Date.now()}-${image.name}`

  const { error } = await supabase.storage
    .from('comments')
    .upload(fileName, image)

  if (error) throw error

  const { data } = supabase.storage
    .from('comments')
    .getPublicUrl(fileName)

  return data.publicUrl
}

export const createCommentService = async ({
  name,
  comment,
  imageUrl,
}: {
  name: string
  comment: string
  imageUrl: string | null
}) => {
  if (!isSupabaseConfigured) {
    const newComment: CommentItem = {
      id: Date.now(),
      name,
      comment,
      image_url: imageUrl,
      likes: 0,
      is_pinned: false,
      created_at: new Date().toISOString(),
      is_liked: false,
      replies: [],
    }
    saveLocalComments([newComment, ...readLocalComments()])
    return newComment
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        name,
        comment,
        image_url: imageUrl,
        likes: 0,
        replies: [],
        is_pinned: false,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    replies: Array.isArray(data.replies) ? data.replies : [],
  } as CommentItem
}

export const addReplyService = async ({
  commentId,
  name,
  message,
  isAdmin = false,
}: {
  commentId: number
  name: string
  message: string
  isAdmin?: boolean
}) => {
  const newReply: CommentReply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    username: name.trim(),
    message: message.trim(),
    created_at: new Date().toISOString(),
    is_admin: isAdmin,
  }

  if (!isSupabaseConfigured) {
    const comments = readLocalComments()
    const updated = comments.map((item) => {
      if (item.id === commentId) {
        const existingReplies = Array.isArray(item.replies) ? item.replies : []
        return {
          ...item,
          replies: [...existingReplies, newReply],
        }
      }
      return item
    })
    saveLocalComments(updated)
    return newReply
  }

  // Fetch current comment replies from Supabase
  const { data: currentComment, error: fetchError } = await supabase
    .from('comments')
    .select('replies')
    .eq('id', commentId)
    .single()

  if (fetchError) throw fetchError

  const existingReplies: CommentReply[] = Array.isArray(currentComment?.replies)
    ? currentComment.replies
    : []

  const updatedReplies = [...existingReplies, newReply]

  const { error: updateError } = await supabase
    .from('comments')
    .update({ replies: updatedReplies })
    .eq('id', commentId)

  if (updateError) throw updateError

  return newReply
}

export const deleteReplyService = async ({
  commentId,
  replyId,
}: {
  commentId: number
  replyId: string | number
}) => {
  if (!isSupabaseConfigured) {
    const comments = readLocalComments()
    const updated = comments.map((item) => {
      if (item.id === commentId) {
        const existingReplies = Array.isArray(item.replies) ? item.replies : []
        return {
          ...item,
          replies: existingReplies.filter((r) => r.id !== replyId),
        }
      }
      return item
    })
    saveLocalComments(updated)
    return
  }

  const { data: currentComment, error: fetchError } = await supabase
    .from('comments')
    .select('replies')
    .eq('id', commentId)
    .single()

  if (fetchError) throw fetchError

  const existingReplies: CommentReply[] = Array.isArray(currentComment?.replies)
    ? currentComment.replies
    : []

  const updatedReplies = existingReplies.filter((r) => r.id !== replyId)

  const { error: updateError } = await supabase
    .from('comments')
    .update({ replies: updatedReplies })
    .eq('id', commentId)

  if (updateError) throw updateError
}
