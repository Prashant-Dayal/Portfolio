'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Upload,
  Heart,
  Pin,
  MessageSquare,
  CornerDownRight,
  Send,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import useComments from '@/hooks/useComments'

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
}

export default function CommentsSection() {
  const { comments, loading, replyLoading, addComment, addReply, likeComment } =
    useComments()

  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Reply state per comment
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [replyName, setReplyName] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({})

  // Load stored name from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('portfolio_commenter_name')
      if (savedName) {
        setName(savedName)
        setReplyName(savedName)
      }
    }
  }, [])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !comment.trim()) return

    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio_commenter_name', name.trim())
    }

    await addComment({
      name: name.trim(),
      comment: comment.trim(),
      image,
    })

    setComment('')
    setImage(null)
    setPreview(null)
  }

  const handleReplySubmit = async (commentId: number) => {
    const authorName = replyName.trim() || name.trim()
    if (!authorName || !replyMessage.trim()) return

    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio_commenter_name', authorName)
    }

    await addReply({
      commentId,
      name: authorName,
      message: replyMessage.trim(),
      isAdmin: false,
    })

    setReplyMessage('')
    setActiveReplyId(null)
    // Auto expand replies for this comment
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }))
  }

  const toggleRepliesView = (commentId: number) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: prev[commentId] === undefined ? false : !prev[commentId],
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.8,
        ease: smoothEase,
      }}
      viewport={{ once: false, amount: 0.2 }}
      className="rounded-[28px] md:rounded-[34px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-8 h-full flex flex-col justify-between"
    >
      <div>
        {/* HEADER */}
        <div className="mb-5 md:mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-1 flex items-center gap-2">
            Comments
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-normal">
              {comments.length}
            </span>
          </h3>

          <p className="text-xs md:text-sm text-white/40">
            Leave your thoughts or reply to conversations
          </p>
        </div>

        {/* POST COMMENT FORM */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          className="space-y-3 md:space-y-4 mb-5 md:mb-6"
        >
          <motion.input
            variants={itemVariants}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setReplyName(e.target.value)
            }}
            placeholder="Your Name"
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 md:py-3.5 outline-none focus:border-white transition text-sm"
          />

          <motion.textarea
            variants={itemVariants}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 md:py-3.5 outline-none resize-none focus:border-white transition text-sm"
          />

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <label className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-3 flex items-center justify-center gap-2 cursor-pointer hover:border-white/30 transition flex-1">
              <Upload size={15} className="text-white/60" />
              <span className="text-xs text-white/65 font-medium">
                {image ? image.name.slice(0, 18) + '...' : 'Attach Image'}
              </span>
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImage}
              />
            </label>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !comment.trim()}
              className="rounded-2xl py-3 px-6 bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative rounded-2xl overflow-hidden border border-white/10"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 md:h-40 w-full object-cover"
                />
                <button
                  onClick={() => {
                    setImage(null)
                    setPreview(null)
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white backdrop-blur-md"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* COMMENTS LIST */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false }}
        className="rounded-[24px] md:rounded-[28px] border border-white/10 bg-black/20 p-3.5 md:p-4 max-h-[440px] md:max-h-[520px] overflow-y-auto custom-scroll"
      >
        <div className="space-y-3.5">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm flex flex-col items-center gap-2">
              <MessageSquare size={24} className="opacity-40" />
              <span>No comments yet. Be the first to start the conversation!</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((item, i) => {
                const replies = Array.isArray(item.replies) ? item.replies : []
                const isReplying = activeReplyId === item.id
                const isExpanded =
                  expandedReplies[item.id] !== undefined
                    ? expandedReplies[item.id]
                    : true // expand by default if replies exist

                return (
                  <motion.div
                    key={item.id || i}
                    layout
                    initial={{
                      opacity: 0,
                      y: 18,
                      scale: 0.96,
                      filter: 'blur(6px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                      scale: 0.96,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: smoothEase,
                    }}
                    className={`rounded-[20px] md:rounded-[24px] border p-3.5 md:p-4 transition-all ${
                      item.is_pinned
                        ? 'border-purple-500/30 bg-purple-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/15'
                    }`}
                  >
                    {/* COMMENT HEADER & BODY */}
                    <div className="flex gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                        {item.name?.charAt(0).toUpperCase() || 'U'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-white/90 truncate">
                            {item.name}
                          </p>

                          {item.is_pinned && (
                            <div className="flex items-center gap-1 px-2 py-[2px] rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
                              <Pin size={10} />
                              PINNED
                            </div>
                          )}

                          {item.liked_by_admin && (
                            <div className="flex items-center gap-1 px-2 py-[2px] rounded-full bg-pink-500/20 border border-pink-500/30 text-[10px] text-pink-300 font-medium">
                              <Heart size={9} fill="currentColor" />
                              LIKED BY ADMIN
                            </div>
                          )}

                          {item.created_at && (
                            <span className="text-[11px] text-white/30 ml-auto">
                              {new Date(item.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] md:text-[13px] text-white/70 leading-relaxed break-words whitespace-pre-wrap">
                          {item.comment}
                        </p>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt="Comment attachment"
                            className="mt-2.5 rounded-xl w-full max-h-48 md:max-h-56 object-cover border border-white/10"
                          />
                        )}

                        {/* ACTION BUTTONS (LIKE & REPLY) */}
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                          {/* LIKE BUTTON */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => likeComment(item.id, item.is_liked ?? false)}
                            aria-label={item.is_liked ? 'Unlike comment' : 'Like comment'}
                            aria-pressed={item.is_liked ?? false}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                              item.is_liked
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
                            }`}
                          >
                            <Heart
                              size={13}
                              fill={item.is_liked ? 'currentColor' : 'none'}
                              className={item.is_liked ? 'text-rose-400' : ''}
                            />
                            <span>{item.likes || 0}</span>
                          </motion.button>

                          {/* REPLY TOGGLE BUTTON */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setActiveReplyId(isReplying ? null : item.id)
                              if (!replyName && name) {
                                setReplyName(name)
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                              isReplying
                                ? 'bg-white/20 text-white border border-white/30'
                                : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
                            }`}
                          >
                            <CornerDownRight size={13} />
                            <span>Reply</span>
                          </motion.button>

                          {/* TOGGLE EXPAND REPLIES */}
                          {replies.length > 0 && (
                            <button
                              onClick={() => toggleRepliesView(item.id)}
                              className="text-[11px] text-white/40 hover:text-white/70 flex items-center gap-1 ml-auto transition-colors"
                            >
                              <span>
                                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                              </span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>

                        {/* INLINE REPLY FORM */}
                        <AnimatePresence>
                          {isReplying && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: smoothEase }}
                              className="mt-3 pt-3 border-t border-white/10"
                            >
                              <div className="space-y-2.5 bg-black/30 p-3 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/60 flex items-center gap-1">
                                    <CornerDownRight size={12} className="text-purple-400" />
                                    Replying to <b className="text-white/90">{item.name}</b>
                                  </span>

                                  <button
                                    onClick={() => setActiveReplyId(null)}
                                    className="text-white/40 hover:text-white p-1 rounded-full"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                <input
                                  value={replyName}
                                  onChange={(e) => setReplyName(e.target.value)}
                                  placeholder="Your Name"
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                />

                                <textarea
                                  rows={2}
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Write your reply..."
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none focus:border-white/30"
                                />

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setActiveReplyId(null)}
                                    className="px-3 py-1.5 rounded-xl text-xs text-white/50 hover:text-white transition"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    onClick={() => handleReplySubmit(item.id)}
                                    disabled={
                                      replyLoading[item.id] ||
                                      !replyName.trim() ||
                                      !replyMessage.trim()
                                    }
                                    className="px-4 py-1.5 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {replyLoading[item.id] ? (
                                      <>
                                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Send size={11} />
                                        Send Reply
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* REPLIES THREAD */}
                        {replies.length > 0 && isExpanded && (
                          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-2.5 pl-3 border-l-2 border-white/10">
                            {replies.map((reply, rIdx) => {
                              const replyAuthor =
                                reply.name || reply.username || 'Anonymous'
                              const isAdmin =
                                reply.is_admin ||
                                replyAuthor.toLowerCase() === 'admin'

                              return (
                                <motion.div
                                  key={reply.id || rIdx}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`rounded-xl p-2.5 text-xs transition-all ${
                                    isAdmin
                                      ? 'bg-purple-500/10 border border-purple-500/20 shadow-sm'
                                      : 'bg-white/[0.02] border border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isAdmin
                                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                          : 'bg-white/10 text-white/80'
                                      }`}
                                    >
                                      {isAdmin ? (
                                        <ShieldCheck size={11} />
                                      ) : (
                                        replyAuthor.charAt(0).toUpperCase()
                                      )}
                                    </div>

                                    <span className="font-semibold text-white/90">
                                      {replyAuthor}
                                    </span>

                                    {isAdmin && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-200 font-bold tracking-wide">
                                        ADMIN
                                      </span>
                                    )}

                                    {reply.created_at && (
                                      <span className="text-[10px] text-white/30 ml-auto">
                                        {new Date(reply.created_at).toLocaleDateString(
                                          undefined,
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                          }
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-white/70 pl-8 leading-relaxed break-words whitespace-pre-wrap">
                                    {reply.message}
                                  </p>
                                </motion.div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
