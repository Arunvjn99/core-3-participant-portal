import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AdviserMessage {
  id: string
  from: 'me' | 'adviser'
  text: string
  at: number
}

export type MeetingType = 'video' | 'phone'
export type MeetingTopic = 'general' | 'contribution' | 'investments' | 'retirement_income'

export interface Meeting {
  id: string
  /** Start time, ms */
  at: number
  type: MeetingType
  topic: MeetingTopic
}

export interface SharingConsent {
  enabled: boolean
  balance: boolean
  contributions: boolean
  investments: boolean
  /** When consent was last changed */
  updatedAt?: number
}

interface CollabState {
  messages: AdviserMessage[]
  meetings: Meeting[]
  sharing: SharingConsent
  doneRecs: string[]
  /** Adviser messages newer than this are unread */
  lastReadAt: number
  seeded: boolean
  seed: () => void
  send: (text: string) => void
  markRead: () => void
  schedule: (m: Omit<Meeting, 'id'>) => void
  cancelMeeting: (id: string) => void
  setSharing: (patch: Partial<SharingConsent>) => void
  toggleRec: (id: string) => void
}

const DAY = 86_400_000
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const useCollabStore = create<CollabState>()(
  persist(
    (set, get) => ({
      messages: [],
      meetings: [],
      sharing: { enabled: false, balance: true, contributions: true, investments: true },
      doneRecs: [],
      lastReadAt: 0,
      seeded: false,

      /** Demo only: an introductory message from the assigned adviser, so the thread is not empty. */
      seed: () => {
        if (get().seeded) return
        set({
          seeded: true,
          messages: [{ id: 'seed-welcome', from: 'adviser', at: Date.now() - 2 * DAY, text: 'welcome' }],
        })
      },
      send: (text) => {
        const trimmed = text.trim()
        if (!trimmed) return
        set((s) => ({ messages: [...s.messages, { id: uid('m'), from: 'me', text: trimmed.slice(0, 2000), at: Date.now() }] }))
      },
      markRead: () => set({ lastReadAt: Date.now() }),
      schedule: (m) => set((s) => ({ meetings: [...s.meetings, { id: uid('mt'), ...m }].sort((a, b) => a.at - b.at) })),
      cancelMeeting: (id) => set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),
      setSharing: (patch) => set((s) => ({ sharing: { ...s.sharing, ...patch, updatedAt: Date.now() } })),
      toggleRec: (id) =>
        set((s) => ({ doneRecs: s.doneRecs.includes(id) ? s.doneRecs.filter((r) => r !== id) : [...s.doneRecs, id] })),
    }),
    { name: 'adviser_collab', storage: createJSONStorage(() => localStorage) },
  ),
)
