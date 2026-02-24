import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Comment {
  id: string
  text: string
  createdAt: Date
  position: { x: number; y: number }
  boardId: string
  authorId?: string
  authorName?: string
  authorEmail?: string
}

interface CommentStore {
  comments: Comment[]
  isCommenting: boolean
  serverCommentCounts: Record<string, number> // boardId → count (for synced boards, updated by SSE)
  addComment: (text: string, boardId: string, author?: { id: string; name: string; email: string }) => void
  deleteComment: (id: string) => void
  toggleCommenting: () => void
  setCommenting: (value: boolean) => void
  setServerCommentCount: (boardId: string, count: number) => void
}

export const useCommentStore = create<CommentStore>()(
  persist(
    (set) => ({
      comments: [],
      isCommenting: false,
      serverCommentCounts: {},
      addComment: (text, boardId, author) => 
        set((state) => ({ 
          comments: [...state.comments, { 
            id: Date.now().toString(), 
            text,
            createdAt: new Date(),
            position: { x: 0, y: 0 },
            boardId,
            authorId: author?.id,
            authorName: author?.name,
            authorEmail: author?.email,
          }] 
        })),
      deleteComment: (id) =>
        set((state) => ({
          comments: state.comments.filter(comment => comment.id !== id)
        })),
      toggleCommenting: () =>
        set((state) => ({ isCommenting: !state.isCommenting })),
      setCommenting: (value) => set({ isCommenting: value }),
      setServerCommentCount: (boardId, count) =>
        set((state) => ({
          serverCommentCounts: { ...state.serverCommentCounts, [boardId]: count },
        })),
    }),
    {
      name: 'comment-storage',
      partialize: (state) => ({
        comments: state.comments,
        isCommenting: state.isCommenting,
        // serverCommentCounts is intentionally excluded — ephemeral, rebuilt from SSE
      }),
    }
  )
)
