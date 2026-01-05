import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StickyNote {
  id: string
  text: string
  position: { x: number; y: number }
  color: string
  width?: number
  height?: number
}

interface StickyNoteStore {
  notes: StickyNote[]
  addNote: (note: StickyNote) => void
  updateNote: (id: string, updates: Partial<StickyNote>) => void
  deleteNote: (id: string) => void
}

export const STICKY_COLORS = {
  yellow: 'bg-yellow-200',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-200',
}

export const useNoteStore = create(
  persist<StickyNoteStore>(
    (set) => ({
      notes: [],
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((note) => 
          note.id === id ? { ...note, ...updates } : note
        ),
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      })),
    }),
    {
      name: 'sticky-notes-storage',
    }
  )
)
