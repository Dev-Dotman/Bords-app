import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MediaType = 'image' | 'video'

export interface Media {
  id: string
  url: string
  title?: string
  description?: string
  type: MediaType
  position: { x: number; y: number }
  width: number
  height: number
  color?: string
  createdAt: number
}

interface MediaStore {
  medias: Media[]
  isMediaModalOpen: boolean
  addMedia: (media: Omit<Media, 'id' | 'createdAt'>) => void
  updateMedia: (id: string, updates: Partial<Media>) => void
  deleteMedia: (id: string) => void
  openMediaModal: () => void
  closeMediaModal: () => void
}

export const useMediaStore = create<MediaStore>()(
  persist(
    (set) => ({
      medias: [],
      isMediaModalOpen: false,
      addMedia: (media) =>
        set((state) => ({
          medias: [
            ...state.medias,
            {
              ...media,
              id: `media-${Date.now()}-${Math.random()}`,
              createdAt: Date.now(),
            },
          ],
        })),
      updateMedia: (id, updates) =>
        set((state) => ({
          medias: state.medias.map((media) =>
            media.id === id ? { ...media, ...updates } : media
          ),
        })),
      deleteMedia: (id) =>
        set((state) => ({
          medias: state.medias.filter((media) => media.id !== id),
        })),
      openMediaModal: () => set({ isMediaModalOpen: true }),
      closeMediaModal: () => set({ isMediaModalOpen: false }),
    }),
    {
      name: 'media-storage'
    }
  )
)
