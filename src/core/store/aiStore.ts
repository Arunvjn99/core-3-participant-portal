import { create } from 'zustand'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIStore {
  isChatOpen: boolean
  isSearchOpen: boolean
  chatHistory: ChatMessage[]
  openChat: () => void
  closeChat: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
  clearHistory: () => void
}

export const useAIStore = create<AIStore>((set) => ({
  isChatOpen: false,
  isSearchOpen: false,
  chatHistory: [],
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  addMessage: (msg) =>
    set((s) => ({
      chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }],
    })),
  clearHistory: () => set({ chatHistory: [] }),
}))
