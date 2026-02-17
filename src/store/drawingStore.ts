import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Drawing, DrawingPath } from '@/types/drawing'

interface DrawingStore {
  drawings: Drawing[]
  undoneDrawings: Drawing[]
  isDrawing: boolean
  isErasing: boolean
  currentColor: string
  currentStrokeWidth: number
  eraserWidth: number
  toggleDrawing: () => void
  toggleEraser: () => void
  setColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  setEraserWidth: (width: number) => void
  addDrawing: (drawing: Drawing) => void
  updateDrawing: (id: string, paths: DrawingPath[]) => void
  deleteDrawing: (id: string) => void
  moveDrawing: (id: string, position: { x: number; y: number }) => void
  undoLastDrawing: () => void
  redoLastDrawing: () => void
}

export const useDrawingStore = create<DrawingStore>()(
  persist(
    (set) => ({
      drawings: [],
      undoneDrawings: [],
      isDrawing: false,
      isErasing: false,
      currentColor: '#000000',
      currentStrokeWidth: 2,
      eraserWidth: 12,
      
      toggleDrawing: () => set((state) => ({ isDrawing: !state.isDrawing, isErasing: false })),
      
      toggleEraser: () => set((state) => ({ isErasing: !state.isErasing, isDrawing: true })),
      
      setColor: (color) => set({ currentColor: color }),
      
      setStrokeWidth: (width) => set({ currentStrokeWidth: width }),
      
      setEraserWidth: (width) => set({ eraserWidth: width }),
      
      addDrawing: (drawing) =>
        set((state) => ({ drawings: [...state.drawings, drawing], undoneDrawings: [] })),
      
      updateDrawing: (id, paths) =>
        set((state) => ({
          drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, paths } : d
          ),
        })),
      
      deleteDrawing: (id) =>
        set((state) => ({
          drawings: state.drawings.filter((d) => d.id !== id),
        })),
      
      moveDrawing: (id, position) =>
        set((state) => ({
          drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, position } : d
          ),
        })),
      
      undoLastDrawing: () =>
        set((state) => {
          if (state.drawings.length === 0) return state
          const last = state.drawings[state.drawings.length - 1]
          return {
            drawings: state.drawings.slice(0, -1),
            undoneDrawings: [...state.undoneDrawings, last],
          }
        }),

      redoLastDrawing: () =>
        set((state) => {
          if (state.undoneDrawings.length === 0) return state
          const last = state.undoneDrawings[state.undoneDrawings.length - 1]
          return {
            drawings: [...state.drawings, last],
            undoneDrawings: state.undoneDrawings.slice(0, -1),
          }
        }),
    }),
    {
      name: 'drawing-storage',
    }
  )
)
