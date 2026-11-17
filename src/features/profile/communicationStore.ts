import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** What the plan writes to the participant about, in the order shown on the Preferences tab. */
export const TOPICS = ['notices', 'statements', 'transactions', 'contributions', 'education', 'market'] as const
export type Topic = (typeof TOPICS)[number]

/** Notices the plan is required to deliver: they can move between email and mail, never be switched off. */
export const REQUIRED_TOPICS: readonly Topic[] = ['notices', 'statements']

export type Delivery = 'paperless' | 'mail'

export interface CommunicationPreferences {
  /** How required notices, statements and tax forms reach the participant. */
  delivery: Delivery
  email: Record<Topic, boolean>
  text: Record<Topic, boolean>
  /** When the participant last agreed to receive text messages; `null` while no topic uses text. */
  textConsentAt: string | null
}

export const DEFAULT_COMMUNICATION: CommunicationPreferences = {
  delivery: 'paperless',
  email: { notices: true, statements: true, transactions: true, contributions: true, education: true, market: false },
  text: { notices: false, statements: false, transactions: false, contributions: false, education: false, market: false },
  textConsentAt: null,
}

interface CommunicationState {
  preferences: CommunicationPreferences
  savedAt: string | null
  save: (preferences: CommunicationPreferences) => void
}

export const useCommunicationStore = create<CommunicationState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_COMMUNICATION,
      savedAt: null,
      save: (preferences) => set({ preferences, savedAt: new Date().toISOString() }),
    }),
    { name: 'communication_preferences', storage: createJSONStorage(() => localStorage) },
  ),
)

/** Whether a notification about `topic` should be delivered on `channel` under the saved preferences. */
export function wantsChannel(preferences: CommunicationPreferences, topic: Topic, channel: 'email' | 'text'): boolean {
  if (channel === 'email' && REQUIRED_TOPICS.includes(topic)) return preferences.delivery === 'paperless'
  return preferences[channel][topic]
}
