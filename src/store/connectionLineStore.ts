import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConnectionLineStore {
  isModalOpen: boolean
  colorMode: 'multicolor' | 'monochromatic'
  monochromaticColor: string
  openModal: () => void
  closeModal: () => void
  setColorMode: (mode: 'multicolor' | 'monochromatic') => void
  setMonochromaticColor: (color: string) => void
}

export const useConnectionLineStore = create<ConnectionLineStore>()(
  persist(
    (set) => ({
      isModalOpen: false,
      colorMode: 'multicolor',
      monochromaticColor: '#3b82f6', // Default blue
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      setColorMode: (mode) => set({ colorMode: mode }),
      setMonochromaticColor: (color) => set({ monochromaticColor: color }),
    }),
    {
      name: 'connection-line-storage',
    }
  )
)
