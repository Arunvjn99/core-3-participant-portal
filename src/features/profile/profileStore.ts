import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_BANK, DEFAULT_BENEFICIARIES, DEFAULT_CLASSIFICATION, DEFAULT_EMPLOYMENT, DEFAULT_FLAGS, DEFAULT_PERSONAL, DEFAULT_SENSITIVE,
  type BankDetails, type Beneficiary, type ClassificationCategory, type EmploymentDetails, type PersonalDetails, type SensitiveData, type StatusFlags,
} from './profileData'

interface ProfileState {
  personal: PersonalDetails
  bank: BankDetails
  employment: EmploymentDetails
  flags: StatusFlags
  classification: ClassificationCategory[]
  beneficiaries: Beneficiary[]
  /** In memory only: never written to browser storage (see `partialize`). */
  sensitive: SensitiveData

  savePersonal: (p: PersonalDetails, ssn: string) => void
  saveBank: (b: BankDetails, accountNumber: string, routing: string) => void
  saveEmployment: (e: Pick<EmploymentDetails, 'hireDate' | 'ownershipPct' | 'rehireDate' | 'termDate'>) => void
  addBeneficiary: (b: Omit<Beneficiary, 'id'>, ssn: string, account: { accountNumber: string; routing: string }) => void
  setShares: (shares: Record<string, number>) => void
  removeBeneficiary: (id: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      personal: DEFAULT_PERSONAL,
      bank: DEFAULT_BANK,
      employment: DEFAULT_EMPLOYMENT,
      flags: DEFAULT_FLAGS,
      classification: DEFAULT_CLASSIFICATION,
      beneficiaries: DEFAULT_BENEFICIARIES,
      sensitive: DEFAULT_SENSITIVE,

      savePersonal: (personal, ssn) => set((s) => ({ personal, sensitive: { ...s.sensitive, ssn } })),
      saveBank: (bank, accountNumber, routing) => set((s) => ({ bank, sensitive: { ...s.sensitive, accountNumber, routing } })),
      saveEmployment: (e) => set((s) => ({ employment: { ...s.employment, ...e } })),
      addBeneficiary: (b, ssn, account) =>
        set((s) => {
          const id = `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
          return {
            beneficiaries: [...s.beneficiaries, { ...b, id }],
            sensitive: {
              ...s.sensitive,
              beneficiarySsn: { ...s.sensitive.beneficiarySsn, [id]: ssn },
              beneficiaryAccount: account.accountNumber ? { ...s.sensitive.beneficiaryAccount, [id]: account } : s.sensitive.beneficiaryAccount,
            },
          }
        }),
      setShares: (shares) => set((s) => ({ beneficiaries: s.beneficiaries.map((b) => (b.id in shares ? { ...b, share: shares[b.id] } : b)) })),
      removeBeneficiary: (id) => set((s) => ({ beneficiaries: s.beneficiaries.filter((b) => b.id !== id) })),
    }),
    {
      name: 'profile_details',
      storage: createJSONStorage(() => localStorage),
      // SSNs, bank account and routing numbers stay in memory only.
      partialize: ({ personal, bank, employment, flags, classification, beneficiaries }) => ({ personal, bank, employment, flags, classification, beneficiaries }),
    },
  ),
)
