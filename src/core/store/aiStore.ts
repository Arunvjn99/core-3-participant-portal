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
  /** A question to send as soon as the chat panel opens (e.g. from a glossary popover) */
  pendingQuestion: string | null
  openChat: () => void
  askAI: (question: string) => void
  takePendingQuestion: () => string | null
  closeChat: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
  clearHistory: () => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  isChatOpen: false,
  isSearchOpen: false,
  chatHistory: [],
  pendingQuestion: null,
  openChat: () => set({ isChatOpen: true }),
  askAI: (question) => set({ isChatOpen: true, pendingQuestion: question }),
  takePendingQuestion: () => {
    const q = get().pendingQuestion
    if (q) set({ pendingQuestion: null })
    return q
  },
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
