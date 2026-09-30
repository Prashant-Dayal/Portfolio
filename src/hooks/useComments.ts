'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CommentItem,
  CommentReply,
  fetchCommentsService,
  createCommentService,
  addReplyService,
  getVisitorId,
  toggleCommentLikeService,
  uploadCommentImageService,
} from '@/lib/commentService'

export default function useComments() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [replyLoading, setReplyLoading] = useState<Record<number, boolean>>({})
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const visitorIdRef = useRef<string | null>(null)

  const fetchInitialComments = async (id = visitorIdRef.current) => {
    try {
      const data = await fetchCommentsService(id)
      setComments(data)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    let active = true

    const initialiseComments = async () => {
      try {
        const id = await getVisitorId()
        if (!active) return
        visitorIdRef.current = id
        setVisitorId(id)
        await fetchInitialComments(id)
      } catch (err) {
        console.log(err)
        await fetchInitialComments()
      }
    }

    void initialiseComments()

    const channel = supabase
      .channel('comments-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async () => {
          const data = await fetchCommentsService(visitorIdRef.current)
          setComments(data)
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const addComment = async ({
    name,
    comment,
    image,
  }: {
    name: string
    comment: string
    image: File | null
  }) => {
    if (!name.trim()) return
    if (!comment.trim()) return

    setLoading(true)

    try {
      let imageUrl: string | null = null

      if (image) {
        imageUrl = await uploadCommentImageService(image)
      }

      const newComment = await createCommentService({
        name,
        comment,
        imageUrl,
      })

      // instant UI update
      setComments((prev) => [newComment, ...prev])
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const addReply = async ({
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
    if (!name.trim() || !message.trim()) return

    setReplyLoading((prev) => ({ ...prev, [commentId]: true }))

    const optimisticReply: CommentReply = {
      id: `${Date.now()}-temp`,
      name: name.trim(),
      username: name.trim(),
      message: message.trim(),
      created_at: new Date().toISOString(),
      is_admin: isAdmin,
    }

    // Optimistically add to UI immediately
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [...(Array.isArray(c.replies) ? c.replies : []), optimisticReply],
            }
          : c,
      ),
    )

    try {
      const realReply = await addReplyService({
        commentId,
        name,
        message,
        isAdmin,
      })

      // Replace optimistic reply with real returned reply
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: (c.replies ?? []).map((r) =>
                  r.id === optimisticReply.id ? realReply : r,
                ),
              }
            : c,
        ),
      )
    } catch (err) {
      console.log(err)
      // Revert optimistic update on failure
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: (c.replies ?? []).filter((r) => r.id !== optimisticReply.id),
              }
            : c,
        ),
      )
    } finally {
      setReplyLoading((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const likeComment = async (id: number, isLiked: boolean) => {
    // Optimistically update likes in UI immediately
    setComments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              likes: Math.max((item.likes ?? 0) + (isLiked ? -1 : 1), 0),
              is_liked: !isLiked,
            }
          : item,
      ),
    )

    try {
      const activeId = visitorId ?? visitorIdRef.current ?? 'visitor'
      const updatedLike = await toggleCommentLikeService(id, activeId, isLiked)

      setComments((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updatedLike }
            : item,
        ),
      )
    } catch (err) {
      console.log(err)
      // Revert optimistic update
      setComments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likes: Math.max((item.likes ?? 0) + (isLiked ? 1 : -1), 0),
                is_liked: isLiked,
              }
            : item,
        ),
      )
    }
  }

  return {
    comments,
    loading,
    replyLoading,
    addComment,
    addReply,
    likeComment,
  }
}
