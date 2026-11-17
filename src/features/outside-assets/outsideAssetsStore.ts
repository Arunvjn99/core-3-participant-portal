import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AccountType, LinkedAccount } from './linkService'

/** What the participant types for an account they add by hand. */
export interface ManualAccountInput {
  nickname: string
  type: AccountType
  balance: number
}

interface OutsideAssetsState {
  accounts: LinkedAccount[]
  /** Adds an account returned by `linkService.connectAccount`. */
  addLinked: (account: LinkedAccount) => void
  addManual: (input: ManualAccountInput) => void
  updateBalance: (id: string, balance: number) => void
  removeAccount: (id: string) => void
}

/** Liabilities are stored positive too, so every balance is a non-negative amount in cents precision. */
const clean = (balance: number) => Math.max(0, Math.round(balance * 100) / 100)

export const useOutsideAssetsStore = create<OutsideAssetsState>()(
  persist(
    (set) => ({
      accounts: [],

      addLinked: (account) => set((s) => ({ accounts: [...s.accounts, { ...account, balance: clean(account.balance) }] })),
      addManual: ({ nickname, type, balance }) =>
        set((s) => ({
          accounts: [
            ...s.accounts,
            {
              id: `oa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
              institution: '',
              nickname: nickname.trim(),
              type,
              balance: clean(balance),
              source: 'manual',
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateBalance: (id, balance) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, balance: clean(balance), updatedAt: new Date().toISOString() } : a)),
        })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
    }),
    {
      name: 'outside_assets',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
