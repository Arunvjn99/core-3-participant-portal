import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** How long a passed identity check lets the participant make sensitive changes without being asked again. */
const IDENTITY_WINDOW_MS = 15 * 60 * 1000

export type BankVerification =
  | { status: 'unverified' }
  | { status: 'pending_deposits'; sentAt: string }
  | { status: 'verified'; method: 'instant' | 'deposits'; verifiedAt: string }

export type SpousalConsent = { status: 'not_requested' } | { status: 'waiting'; email: string; requestedAt: string } | { status: 'completed'; completedAt: string }

export interface DesignationSignature {
  /** Fingerprint of the beneficiaries and shares that were signed; a later change makes the signature out of date. */
  fingerprint: string
  signedName: string
  signedAt: string
}

interface VerificationState {
  /** In memory only: a reload asks again. */
  identityVerifiedAt: number | null
  identityAttempts: number
  addressVerifiedFor: string | null
  bank: BankVerification
  designation: DesignationSignature | null
  spousalConsent: SpousalConsent

  passIdentity: () => void
  failIdentity: () => void
  setAddressVerified: (addressKey: string | null) => void
  setBank: (bank: BankVerification) => void
  signDesignation: (signature: DesignationSignature) => void
  setSpousalConsent: (consent: SpousalConsent) => void
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set) => ({
      identityVerifiedAt: null,
      identityAttempts: 0,
      addressVerifiedFor: null,
      bank: { status: 'unverified' },
      designation: null,
      spousalConsent: { status: 'not_requested' },

      passIdentity: () => set({ identityVerifiedAt: Date.now(), identityAttempts: 0 }),
      failIdentity: () => set((s) => ({ identityAttempts: s.identityAttempts + 1 })),
      setAddressVerified: (addressVerifiedFor) => set({ addressVerifiedFor }),
      setBank: (bank) => set({ bank }),
      signDesignation: (designation) => set({ designation }),
      setSpousalConsent: (spousalConsent) => set({ spousalConsent }),
    }),
    {
      name: 'profile_verification',
      storage: createJSONStorage(() => localStorage),
      // The identity check itself is never stored: it lasts for the visit only.
      partialize: ({ addressVerifiedFor, bank, designation, spousalConsent }) => ({ addressVerifiedFor, bank, designation, spousalConsent }),
    },
  ),
)

export const isIdentityFresh = (verifiedAt: number | null, now: number) => verifiedAt !== null && now - verifiedAt < IDENTITY_WINDOW_MS

/** One string per address, so a saved "verified" mark can be matched to the address it was given for. */
export const addressKey = (a: { address1: string; address2: string; city: string; state: string; zip: string; country: string }) =>
  [a.address1, a.address2, a.city, a.state, a.zip, a.country].map((p) => p.trim().toLowerCase()).join('|')

/** The beneficiaries and shares a signature covers; any change to them produces a different value. */
export const designationFingerprint = (list: { id: string; type: string; relationship: string; share: number }[]) =>
  [...list]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.id}:${b.type}:${b.relationship}:${b.share}`)
    .join('|')
