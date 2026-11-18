import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface NotificationState {
  dismissed: string[]
  read: string[]
  dismiss: (id: string) => void
  /** Clear several at once (the Notifications page's "Clear all"). */
  dismissMany: (ids: string[]) => void
  /** Bring cleared notifications back (Undo after "Clear all"). */
  restore: (ids: string[]) => void
  markRead: (ids: string[]) => void
}

export const useNotificationState = create<NotificationState>()(
  persist(
    (set) => ({
      dismissed: [],
      read: [],
      dismiss: (id) => set((s) => (s.dismissed.includes(id) ? s : { dismissed: [...s.dismissed, id], read: [...s.read, id] })),
      dismissMany: (ids) =>
        set((s) => ({ dismissed: Array.from(new Set([...s.dismissed, ...ids])), read: Array.from(new Set([...s.read, ...ids])) })),
      restore: (ids) => set((s) => ({ dismissed: s.dismissed.filter((id) => !ids.includes(id)) })),
      markRead: (ids) => set((s) => ({ read: Array.from(new Set([...s.read, ...ids])) })),
    }),
    { name: 'notification_state', storage: createJSONStorage(() => localStorage) },
  ),
)
