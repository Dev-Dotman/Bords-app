import { create } from 'zustand'

interface ExportStore {
  isExportModalOpen: boolean
  openExportModal: () => void
  closeExportModal: () => void
}

export const useExportStore = create<ExportStore>((set) => ({
  isExportModalOpen: false,
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
}))
