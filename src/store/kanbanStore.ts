import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KanbanBoard, KanbanColumn, KanbanTask } from '../types/kanban'

interface KanbanStore {
  boards: KanbanBoard[]
  addBoard: (board: KanbanBoard) => void
  removeBoard: (id: string) => void
  updateBoardPosition: (id: string, position: { x: number; y: number }) => void
  addTask: (boardId: string, columnId: string, task: KanbanTask) => void
  moveTask: (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void
  updateTask: (boardId: string, columnId: string, taskId: string, updates: Partial<KanbanTask>) => void
  deleteTask: (boardId: string, columnId: string, taskId: string) => void
  addColumn: (boardId: string, column: KanbanColumn) => void
  updateColumn: (boardId: string, columnId: string, title: string) => void
  deleteColumn: (boardId: string, columnId: string) => void
}

export const useKanbanStore = create<KanbanStore>()(persist(
  (set) => ({
  boards: [],
  
  addBoard: (board) => set((state) => ({ 
    boards: [...state.boards, board] 
  })),
  
  removeBoard: (id) => set((state) => ({
    boards: state.boards.filter((b) => b.id !== id)
  })),
  
  updateBoardPosition: (id, position) => set((state) => ({
    boards: state.boards.map((b) =>
      b.id === id ? { ...b, position } : b
    )
  })),
  
  addTask: (boardId, columnId, task) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId
                ? { ...col, tasks: [...col.tasks, task] }
                : col
            )
          }
        : board
    )
  })),
  
  moveTask: (boardId, taskId, fromColumnId, toColumnId, newIndex) => set((state) => ({
    boards: state.boards.map((board) => {
      if (board.id !== boardId) return board
      
      const fromColumn = board.columns.find((c) => c.id === fromColumnId)
      const task = fromColumn?.tasks.find((t) => t.id === taskId)
      
      if (!task) return board
      
      return {
        ...board,
        columns: board.columns.map((col) => {
          if (col.id === fromColumnId) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          }
          if (col.id === toColumnId) {
            const newTasks = [...col.tasks]
            newTasks.splice(newIndex, 0, task)
            return { ...col, tasks: newTasks }
          }
          return col
        })
      }
    })
  })),
  
  updateTask: (boardId, columnId, taskId, updates) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId
                ? {
                    ...col,
                    tasks: col.tasks.map((t) =>
                      t.id === taskId ? { ...t, ...updates } : t
                    )
                  }
                : col
            )
          }
        : board
    )
  })),
  
  deleteTask: (boardId, columnId, taskId) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId
                ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
                : col
            )
          }
        : board
    )
  })),
  
  addColumn: (boardId, column) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? { ...board, columns: [...board.columns, column] }
        : board
    )
  })),
  
  updateColumn: (boardId, columnId, title) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId ? { ...col, title } : col
            )
          }
        : board
    )
  })),
  
  deleteColumn: (boardId, columnId) => set((state) => ({
    boards: state.boards.map((board) =>
      board.id === boardId
        ? { ...board, columns: board.columns.filter((c) => c.id !== columnId) }
        : board
    )
  }))
}),
  {
    name: 'kanban-storage',
  }
))
