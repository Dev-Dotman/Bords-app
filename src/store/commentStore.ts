import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Comment {
  id: string
  text: string
  createdAt: Date
  position: { x: number; y: number }
  boardId: string // Add this property
}

interface CommentStore {
  comments: Comment[]
  isCommenting: boolean
  addComment: (text: string, boardId: string) => void
  deleteComment: (id: string) => void
  toggleCommenting: () => void
}

export const useCommentStore = create<CommentStore>()(
  persist(
    (set) => ({
      comments: [],
      isCommenting: false,
      addComment: (text, boardId) => 
        set((state) => ({ 
          comments: [...state.comments, { 
            id: Date.now().toString(), 
            text,
            createdAt: new Date(),
            position: { x: 0, y: 0 },
            boardId
          }] 
        })),
      deleteComment: (id) =>
        set((state) => ({
          comments: state.comments.filter(comment => comment.id !== id)
        })),
      toggleCommenting: () =>
        set((state) => ({ isCommenting: !state.isCommenting }))
    }),
    {
      name: 'comment-storage'
    }
  )
)
