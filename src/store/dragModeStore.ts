import { create } from 'zustand'

interface DragModeStore {
  isDragEnabled: boolean
  toggleDragMode: () => void
}

export const useDragModeStore = create<DragModeStore>((set) => ({
  isDragEnabled: true,  // Enabled by default
  toggleDragMode: () => set((state) => ({ isDragEnabled: !state.isDragEnabled }))
}))
