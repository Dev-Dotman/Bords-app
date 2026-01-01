import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GridStore {
  isGridVisible: boolean
  gridColor: string
  zoom: number
  scrollY: number
  setZoom: (zoom: number) => void
  setScrollY: (scrollY: number) => void
  toggleGrid: () => void
  setGridColor: (color: string) => void
}

export const useGridStore = create<GridStore>()(
  persist(
    (set) => ({
      isGridVisible: true,
      gridColor: '#333333', // Default dark mode grid color
      zoom: 1,
      scrollY: 0,
      setZoom: (zoom) => set({ zoom }),
      setScrollY: (scrollY) => set({ scrollY }),
      toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
      setGridColor: (color) => set({ gridColor: color })
    }),
    {
      name: 'grid-storage'
    }
  )
)
