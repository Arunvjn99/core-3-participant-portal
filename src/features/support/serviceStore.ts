import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ContactPreference, ServiceCategory, ServiceRequest } from './serviceCatalog'

interface ServiceState {
  requests: ServiceRequest[]
  counter: number
  seeded: boolean
  seed: () => void
  create: (input: { category: ServiceCategory; subject: string; details: string; contact: ContactPreference }) => ServiceRequest
  addNote: (id: string, text: string) => void
  cancel: (id: string) => void
}

const HOUR = 3_600_000
const MAX_DETAILS = 2000

export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      requests: [],
      counter: 1000,
      seeded: false,

      /** Demo only: one in-flight request so the list is not empty. */
      seed: () => {
        if (get().seeded) return
        const counter = get().counter + 1
        set((s) => ({
          seeded: true,
          counter,
          requests: [
            ...s.requests,
            {
              id: 'demo-sr',
              ref: `SR-${new Date().getFullYear()}-${counter}`,
              category: 'personal_info',
              subject: 'Update my mailing address',
              details: 'I recently moved and need my mailing address changed so statements and checks go to the right place.',
              contact: 'email',
              submittedAt: Date.now() - 30 * HOUR,
              notes: [],
            },
          ],
        }))
      },

      create: (input) => {
        const counter = get().counter + 1
        const req: ServiceRequest = {
          id: `sr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          ref: `SR-${new Date().getFullYear()}-${counter}`,
          category: input.category,
          subject: input.subject.trim(),
          details: input.details.trim().slice(0, MAX_DETAILS),
          contact: input.contact,
          submittedAt: Date.now(),
          notes: [],
        }
        set((s) => ({ counter, requests: [req, ...s.requests] }))
        return req
      },

      addNote: (id, text) => {
        const trimmed = text.trim().slice(0, MAX_DETAILS)
        if (!trimmed) return
        set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, notes: [...r.notes, { at: Date.now(), text: trimmed }] } : r)) }))
      },

      cancel: (id) => set((s) => ({ requests: s.requests.map((r) => (r.id === id && !r.cancelledAt ? { ...r, cancelledAt: Date.now() } : r)) })),
    }),
    { name: 'service_requests', storage: createJSONStorage(() => localStorage) },
  ),
)
