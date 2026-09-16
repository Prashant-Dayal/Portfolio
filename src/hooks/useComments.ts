'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CommentItem,
  fetchCommentsService,
  createCommentService,
  getVisitorId,
  toggleCommentLikeService,
  uploadCommentImageService,
} from '@/lib/commentService'

export default function useComments() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
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

      // instant UI update (tanpa nunggu realtime)
      setComments((prev) => [newComment, ...prev])
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const likeComment = async (id: number, isLiked: boolean) => {
    if (!visitorId) return
    try {
      const updatedLike = await toggleCommentLikeService(id, visitorId, isLiked)

      setComments((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updatedLike }
            : item
        )
      )
    } catch (err) {
      console.log(err)
    }
  }

  return {
    comments,
    loading,
    addComment,
    likeComment,
  }
}
