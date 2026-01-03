import { create } from 'zustand'

interface PresentationStore {
  isPresentationMode: boolean
  togglePresentationMode: () => void
  setPresentationMode: (mode: boolean) => void
}

export const usePresentationStore = create<PresentationStore>((set) => ({
  isPresentationMode: false,
  togglePresentationMode: () => set((state) => ({ isPresentationMode: !state.isPresentationMode })),
  setPresentationMode: (mode: boolean) => set({ isPresentationMode: mode }),
}))
