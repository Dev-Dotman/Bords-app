import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TextElement {
  id: string
  text: string
  position: { x: number; y: number }
  fontSize: number
  color: string
  rotation?: number
  width?: number
}

interface TextStore {
  texts: TextElement[]
  addText: (text: TextElement) => void
  updateText: (id: string, updates: Partial<TextElement>) => void
  deleteText: (id: string) => void
}

export const useTextStore = create<TextStore>()(
  persist(
    (set) => ({
      texts: [],
      addText: (text) => set((state) => ({ texts: [...state.texts, text] })),
      updateText: (id, updates) => set((state) => ({
        texts: state.texts.map((text) => 
          text.id === id ? { ...text, ...updates } : text
        )
      })),
      deleteText: (id) => set((state) => ({
        texts: state.texts.filter((text) => text.id !== id)
      }))
    }),
    {
      name: 'text-storage'
    }
  )
)
