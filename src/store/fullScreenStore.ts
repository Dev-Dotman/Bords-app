import { create } from 'zustand'

interface FullScreenStore {
  isFullScreen: boolean
  toggleFullScreen: () => void
  setFullScreen: (mode: boolean) => void
}

export const useFullScreenStore = create<FullScreenStore>((set) => ({
  isFullScreen: false,
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
  setFullScreen: (mode: boolean) => set({ isFullScreen: mode }),
}))
