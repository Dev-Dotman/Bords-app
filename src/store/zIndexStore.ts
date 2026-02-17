import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ZIndexStore {
  counter: number
  zIndexMap: Record<string, number>
  bringToFront: (id: string) => number
  getZIndex: (id: string) => number
  removeItem: (id: string) => void
}

export const useZIndexStore = create<ZIndexStore>()(
  persist(
    (set, get) => ({
      counter: 1,
      zIndexMap: {},
      bringToFront: (id: string) => {
        const newZ = get().counter + 1
        set((state) => ({
          counter: newZ,
          zIndexMap: { ...state.zIndexMap, [id]: newZ }
        }))
        return newZ
      },
      getZIndex: (id: string) => {
        return get().zIndexMap[id] || 1
      },
      removeItem: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.zIndexMap
          return { zIndexMap: rest }
        })
      }
    }),
    {
      name: 'z-index-storage'
    }
  )
)
