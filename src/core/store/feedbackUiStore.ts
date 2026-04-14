import { create } from 'zustand'

interface FeedbackUiState {
  modalOpen: boolean
  toastMessage: string | null
  setModalOpen: (open: boolean) => void
  showToast: (message: string) => void
  clearToast: () => void
}

export const useFeedbackUiStore = create<FeedbackUiState>((set) => ({
  modalOpen: false,
  toastMessage: null,
  setModalOpen: (modalOpen) => set({ modalOpen }),
  showToast: (toastMessage) => set({ toastMessage }),
  clearToast: () => set({ toastMessage: null }),
}))
