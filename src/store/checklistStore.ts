import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CHECKLIST_COLORS = {
  white: 'bg-white/90',
  gray: 'bg-zinc-100/90',
  yellow: 'bg-yellow-100/90',
  blue: 'bg-blue-100/90',
  green: 'bg-green-100/90',
  pink: 'bg-pink-100/90',
  purple: 'bg-purple-100/90',
  orange: 'bg-orange-100/90'
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  deadline?: Date
  timeSpent: number // in seconds
  isTracking: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
  position: { x: number; y: number }
  color: string
  createdAt: Date  // Add this line
  width?: number
  height?: number
}

interface ChecklistStore {
  checklists: Checklist[]
  addChecklist: (checklist: Omit<Checklist, 'boardId'>) => void
  updateChecklist: (id: string, updates: Partial<Checklist>) => void
  deleteChecklist: (id: string) => void
  toggleItem: (checklistId: string, itemId: string) => void
  updateItem: (checklistId: string, itemId: string, updates: Partial<ChecklistItem>) => void
  toggleTimeTracking: (checklistId: string, itemId: string) => void
}

export const useChecklistStore = create<ChecklistStore>()(
  persist(
    (set) => ({
      checklists: [],
      addChecklist: (checklist) => 
        set((state) => ({ 
          checklists: [...state.checklists, checklist] 
        })),
      
      updateChecklist: (id, updates) =>
        set((state) => ({
          checklists: state.checklists.map((list) =>
            list.id === id ? { ...list, ...updates } : list
          ),
        })),
      
      deleteChecklist: (id) =>
        set((state) => ({
          checklists: state.checklists.filter((list) => list.id !== id),
        })),
      
      toggleItem: (checklistId, itemId) =>
        set((state) => ({
          checklists: state.checklists.map((list) =>
            list.id === checklistId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.id === itemId
                      ? { ...item, completed: !item.completed }
                      : item
                  ),
                }
              : list
          ),
        })),
      
      updateItem: (checklistId, itemId, updates) =>
        set((state) => ({
          checklists: state.checklists.map((list) =>
            list.id === checklistId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : list
          ),
        })),
      
      toggleTimeTracking: (checklistId, itemId) =>
        set((state) => ({
          checklists: state.checklists.map((list) =>
            list.id === checklistId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          isTracking: !item.isTracking,
                          timeSpent: item.timeSpent || 0
                        }
                      : item
                  ),
                }
              : list
          ),
        })),
    }),
    {
      name: 'checklist-storage',
      onRehydrateStorage: () => (state) => {
        // Convert stored date strings back to Date objects
        if (state?.checklists) {
          state.checklists = state.checklists.map(list => ({
            ...list,
            items: list.items.map(item => ({
              ...item,
              deadline: item.deadline ? new Date(item.deadline) : undefined
            }))
          }))
        }
      }
    }
  )
)
