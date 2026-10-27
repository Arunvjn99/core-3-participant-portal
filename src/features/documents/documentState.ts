import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DocumentState {
  opened: string[]
  markOpened: (id: string) => void
}

export const useDocumentState = create<DocumentState>()(
  persist(
    (set) => ({
      opened: [],
      markOpened: (id) => set((s) => (s.opened.includes(id) ? s : { opened: [...s.opened, id] })),
    }),
    { name: 'document_state', storage: createJSONStorage(() => localStorage) },
  ),
)
