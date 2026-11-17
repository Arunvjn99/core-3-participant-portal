/**
 * Account aggregation seam: THIS FILE IS WHERE THE AGGREGATION PROVIDER GETS CONNECTED.
 *
 * Everything the portal knows about outside institutions comes through the functions exported here. Today they
 * resolve locally (no network calls): a fixed institution list and a balance derived from the institution and
 * account type. To go live, keep the signatures and replace the bodies with calls to the backend, which in turn
 * talks to the aggregation vendor (institution search, the vendor's consent/link flow, balance refresh).
 */

export type AccountType =
  | 'retirement_401k'
  | 'ira'
  | 'roth_ira'
  | 'brokerage'
  | 'savings'
  | 'checking'
  | 'property'
  | 'mortgage'
  | 'loan'
  | 'credit_card'

export type AccountSource = 'linked' | 'manual'

export interface Institution {
  id: string
  name: string
}

export interface LinkedAccount {
  id: string
  /** Institution display name; empty for accounts entered by hand. */
  institution: string
  nickname: string
  type: AccountType
  /** Always positive. Whether it counts for or against net worth comes from `type` (see `isLiability`). */
  balance: number
  source: AccountSource
  /** ISO timestamp of the last balance update. */
  updatedAt: string
}

export const ACCOUNT_TYPES: AccountType[] = [
  'retirement_401k', 'ira', 'roth_ira', 'brokerage', 'savings', 'checking', 'property', 'mortgage', 'loan', 'credit_card',
]

/** Types an institution can report. Property is a value the participant enters, so it is manual only. */
export const LINKABLE_TYPES: AccountType[] = ACCOUNT_TYPES.filter((t) => t !== 'property')

const LIABILITY_TYPES: AccountType[] = ['mortgage', 'loan', 'credit_card']
export const isLiability = (type: AccountType) => LIABILITY_TYPES.includes(type)

const INSTITUTIONS: Institution[] = [
  { id: 'fidelity', name: 'Fidelity' },
  { id: 'vanguard', name: 'Vanguard' },
  { id: 'schwab', name: 'Charles Schwab' },
  { id: 'empower', name: 'Empower' },
  { id: 'troweprice', name: 'T. Rowe Price' },
  { id: 'chase', name: 'Chase' },
  { id: 'bankofamerica', name: 'Bank of America' },
  { id: 'wellsfargo', name: 'Wells Fargo' },
  { id: 'capitalone', name: 'Capital One' },
  { id: 'citi', name: 'Citi' },
]

/** Typical balance range per account type, so a local connection returns a believable figure. */
const BALANCE_RANGE: Record<AccountType, [min: number, max: number]> = {
  retirement_401k: [18_000, 160_000],
  ira: [8_000, 90_000],
  roth_ira: [5_000, 60_000],
  brokerage: [3_000, 75_000],
  savings: [1_500, 40_000],
  checking: [800, 9_000],
  property: [180_000, 520_000],
  mortgage: [90_000, 340_000],
  loan: [2_000, 28_000],
  credit_card: [150, 6_500],
}

/** Stable 32-bit hash (FNV-1a): the same institution and type always give the same balance. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Institutions the participant can connect. Backend: the vendor's institution search. */
export async function listInstitutions(): Promise<Institution[]> {
  return INSTITUTIONS
}

/**
 * Connects one account at an institution and returns it with its current balance.
 * Backend: run the vendor's link flow for `institutionId`, then return the account of `accountType` it reports.
 */
export async function connectAccount(institutionId: string, accountType: AccountType): Promise<LinkedAccount> {
  const institution = INSTITUTIONS.find((i) => i.id === institutionId)
  if (!institution) throw new Error(`Unknown institution: ${institutionId}`)
  await wait(500)

  const [min, max] = BALANCE_RANGE[accountType]
  const seed = hash(`${institutionId}:${accountType}`)
  const balance = Math.round((min + (seed % 10_000) / 10_000 * (max - min)) * 100) / 100

  return {
    id: `${institutionId}-${accountType}-${Date.now().toString(36)}`,
    institution: institution.name,
    nickname: '',
    type: accountType,
    balance,
    source: 'linked',
    updatedAt: new Date().toISOString(),
  }
}
