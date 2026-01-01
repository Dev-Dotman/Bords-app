import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Board {
  id: string
  name: string
  createdAt: Date
  lastModified: Date
  notes: string[] // IDs of notes
  checklists: string[] // IDs of checklists
  texts: string[] // IDs of texts
  connections: string[] // IDs of connections
  drawings: string[] // IDs of drawings
  kanbans: string[] // IDs of kanban boards
}

interface BoardStore {
  boards: Board[]
  currentBoardId: string | null
  addBoard: (name: string) => void
  deleteBoard: (id: string) => void
  updateBoard: (id: string, updates: Partial<Board>) => void
  setCurrentBoard: (id: string) => void
  addItemToBoard: (boardId: string, itemType: 'notes' | 'checklists' | 'texts' | 'connections' | 'drawings' | 'kanbans', itemId: string) => void
  removeItemFromBoard: (boardId: string, itemType: 'notes' | 'checklists' | 'texts' | 'connections' | 'drawings' | 'kanbans', itemId: string) => void
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      boards: [],
      currentBoardId: null,
      addBoard: (name) => set((state) => ({
        boards: [...state.boards, {
          id: Date.now().toString(),
          name,
          createdAt: new Date(),
          lastModified: new Date(),
          notes: [],
          checklists: [],
          texts: [],
          connections: [],
          drawings: [],
          kanbans: [],
        }],
        currentBoardId: state.boards.length === 0 ? Date.now().toString() : state.currentBoardId
      })),
      deleteBoard: (id) => set((state) => ({
        boards: state.boards.filter((board) => board.id !== id),
        currentBoardId: state.currentBoardId === id ? 
          (state.boards.length > 1 ? state.boards[0].id : null) : 
          state.currentBoardId
      })),
      updateBoard: (id, updates) => set((state) => ({
        boards: state.boards.map((board) =>
          board.id === id ? { ...board, ...updates, lastModified: new Date() } : board
        )
      })),
      setCurrentBoard: (id) => set({ currentBoardId: id }),
      addItemToBoard: (boardId, itemType, itemId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? { ...board, [itemType]: [...(board[itemType] || []), itemId] }
              : board
          )
        })),
      removeItemFromBoard: (boardId, itemType, itemId) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? { ...board, [itemType]: (board[itemType] || []).filter(id => id !== itemId) }
              : board
          )
        }))
    }),
    {
      name: 'board-storage'
    }
  )
)
