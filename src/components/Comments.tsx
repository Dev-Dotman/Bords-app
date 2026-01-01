import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Trash2, X } from 'lucide-react'
import { useCommentStore } from '../store/commentStore'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { useBoardStore } from '../store/boardStore'
import { useThemeStore } from '../store/themeStore'

interface CommentsProps {
  position: { x: number; y: number }
  onClose: () => void
}

export function Comments({ position, onClose }: CommentsProps) {
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const allComments = useCommentStore((state) => state.comments)
  const comments = allComments.filter(comment => comment.boardId === currentBoardId)
  const addComment = useCommentStore((state) => state.addComment)
  const isDark = useThemeStore((state) => state.isDark)
  
  const [newComment, setNewComment] = useState('')
  
  const handleAddComment = (text: string) => {
    if (currentBoardId) {
      addComment(text, currentBoardId)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }
    
    handleAddComment(newComment)
    setNewComment('')
  }

  const deleteComment = useCommentStore((state) => state.deleteComment)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed rounded-lg shadow-xl border w-80 z-[200] ${
        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
      }`}
      style={{ 
        left: position.x,
        top: position.y,
        maxHeight: '700px', // Set max height
        display: 'flex',
        flexDirection: 'column' // Enable flex column layout
      }}
    >
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between p-3 border-b ${
        isDark ? 'border-zinc-700' : 'border-gray-200'
      }`}>
        <div className={`flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <MessageCircle size={18} />
          <h3 className="font-medium">Comments</h3>
        </div>
        <button 
          onClick={onClose}
          className={`p-1 rounded-full ${
            isDark ? 'hover:bg-zinc-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X size={18} />
        </button>
      </div>

      {/* Comments List - Make scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {comments.length === 0 ? (
            <p className={`text-center text-sm py-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="group flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <MessageCircle size={14} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className={`text-[10px] ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                        isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                  <p className={`text-sm mt-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comment Input - Keep at bottom */}
      <form onSubmit={handleSubmit} className={`flex-shrink-0 border-t p-3 ${
        isDark ? 'border-zinc-700' : 'border-gray-200'
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
              isDark 
                ? 'bg-zinc-900 border-zinc-600 text-white placeholder:text-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            }`}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </motion.div>
  )
}
