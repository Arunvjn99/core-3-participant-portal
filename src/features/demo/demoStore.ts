import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useProfileStore } from '@/features/profile/profileStore'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { isEnrolledStatus, personaById, type DemoPersona } from './personas'

/** What a demo participant changes; saved once, before the first switch, so "Back to my own data" can put it back */
const OWN_KEYS = ['enrollment_draft', 'profile_details', 'plan_elections'] as const
const BACKUP_KEY = 'demo_own_backup'

interface DemoState {
  personaId: string | null
  /** Become one of the demo participants */
  switchTo: (id: string) => void
  /** Put back the data that was here before the first switch, then reload so every screen reads it */
  restoreOwn: () => void
}

const saveOwnOnce = () => {
  try {
    if (localStorage.getItem(BACKUP_KEY)) return
    const snap: Record<string, string | null> = {}
    for (const k of OWN_KEYS) snap[k] = localStorage.getItem(k)
    localStorage.setItem(BACKUP_KEY, JSON.stringify(snap))
  } catch {
    /* storage unavailable: the switch still works for this visit */
  }
}

/** Sets the profile, enrollment status and opt-out to match a participant */
const apply = (p: DemoPersona) => {
  useProfileStore.setState((s) => ({ personal: { ...s.personal, firstName: p.firstName, lastName: p.lastName, email: p.email, dob: p.dob } }))
  useEnrollmentDraftStore.setState((s) => ({
    enrollmentStatus: isEnrolledStatus(p.status) ? 'complete' : 'none',
    draftData: {
      ...s.draftData,
      savings: { ...(s.draftData.savings ?? {}), salary: p.salary },
      // Enrolled participants save at their own rate; auto-enrollment puts it all in Pre-Tax
      // The 457(b) only for two-plan participants; everyone else has no second plan
      secondPlan: p.twoPlans ? { offered: true, enrolled: true, rate: p.secondRate ?? 3, balance: p.secondBalance ?? 0 } : undefined,
      ...(p.rate !== undefined && {
        contribution: { ...(s.draftData.contribution ?? {}), percent: p.rate },
        source: { ...(s.draftData.source ?? {}), preTax: 100, roth: 0, afterTax: 0 },
      }),
    },
  }))
  useElectionsStore.setState({ optedOut: p.status === 'opted_out' })
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      personaId: null,
      switchTo: (id) => {
        const p = personaById(id)
        if (!p) return
        saveOwnOnce()
        apply(p)
        set({ personaId: id })
      },
      restoreOwn: () => {
        try {
          const raw = localStorage.getItem(BACKUP_KEY)
          if (raw) {
            const snap = JSON.parse(raw) as Record<string, string | null>
            for (const k of OWN_KEYS) {
              if (snap[k] === null || snap[k] === undefined) localStorage.removeItem(k)
              else localStorage.setItem(k, snap[k] as string)
            }
            localStorage.removeItem(BACKUP_KEY)
          }
        } catch {
          /* nothing to restore */
        }
        set({ personaId: null })
        window.location.assign('/dashboard')
      },
    }),
    { name: 'demo_participant', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ personaId: s.personaId }) },
  ),
)

/** The demo participant now signed in, or null when using your own data */
export const useDemoPersona = () => personaById(useDemoStore((s) => s.personaId))
