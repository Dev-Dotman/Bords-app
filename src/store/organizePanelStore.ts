import { create } from 'zustand'

interface OrganizePanelStore {
  isOpen: boolean
  togglePanel: () => void
}

export const useOrganizePanelStore = create<OrganizePanelStore>((set) => ({
  isOpen: false,
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen }))
}))
