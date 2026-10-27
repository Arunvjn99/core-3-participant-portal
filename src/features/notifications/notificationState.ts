import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface NotificationState {
  dismissed: string[]
  read: string[]
  dismiss: (id: string) => void
  markRead: (ids: string[]) => void
}

export const useNotificationState = create<NotificationState>()(
  persist(
    (set) => ({
      dismissed: [],
      read: [],
      dismiss: (id) => set((s) => (s.dismissed.includes(id) ? s : { dismissed: [...s.dismissed, id], read: [...s.read, id] })),
      markRead: (ids) => set((s) => ({ read: Array.from(new Set([...s.read, ...ids])) })),
    }),
    { name: 'notification_state', storage: createJSONStorage(() => localStorage) },
  ),
)
