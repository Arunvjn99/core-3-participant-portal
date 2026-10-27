/** Profile data model, demo defaults and validators. Placeholder data; replace with participant APIs. */

export type Gender = 'female' | 'male' | 'non_binary' | 'undisclosed'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partner'
export type AccountType = 'checking' | 'savings'
export type PayrollFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
export type BeneficiaryType = 'primary' | 'contingent'
export type Relationship = 'spouse' | 'non_spouse' | 'child' | 'parent' | 'sibling' | 'trust' | 'estate' | 'other'

export const GENDERS: Gender[] = ['female', 'male', 'non_binary', 'undisclosed']
export const MARITAL_STATUSES: MaritalStatus[] = ['single', 'married', 'divorced', 'widowed', 'domestic_partner']
export const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings']
export const PAYROLL_FREQUENCIES: PayrollFrequency[] = ['weekly', 'biweekly', 'semimonthly', 'monthly']
export const RELATIONSHIPS: Relationship[] = ['spouse', 'non_spouse', 'child', 'parent', 'sibling', 'trust', 'estate', 'other']

export interface PersonalDetails {
  firstName: string
  middleName: string
  lastName: string
  gender: Gender
  maritalStatus: MaritalStatus
  /** ISO date, YYYY-MM-DD */
  dob: string
  email: string
  phoneCode: string
  phone: string
  phone2Code: string
  phone2: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  country: string
}

export interface BankDetails {
  accountHolder: string
  bankName: string
  accountType: AccountType
}

export interface EmploymentDetails {
  employeeId: string
  employer: string
  jobTitle: string
  status: string
  payrollFrequency: PayrollFrequency
  hireDate: string
  ownershipPct: number
  rehireDate: string
  termDate: string
}

/** Plan-administered flags: shown to the participant, not editable by them. */
export interface StatusFlags {
  qdro: boolean
  familyMemberOfOwner: boolean
  officer: boolean
  hce: boolean
  keyEmployee: boolean
  insiderRestricted: boolean
}

export interface ClassificationEntry {
  code: string
  name: string
  start: string
  end: string
}
export interface ClassificationCategory {
  id: string
  label: string
  current: ClassificationEntry
  history: ClassificationEntry[]
}

export interface BeneficiaryContact {
  email: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  country: string
}
export interface BeneficiaryBank {
  accountHolder: string
  bankName: string
  accountType: AccountType
}
export interface Beneficiary {
  id: string
  type: BeneficiaryType
  name: string
  relationship: Relationship
  dob: string
  /** Percentage of the benefit within the beneficiary's type (primary or contingent) */
  share: number
  contact: BeneficiaryContact
  bank: BeneficiaryBank
}

/** Values that must never be written to browser storage. */
export interface SensitiveData {
  ssn: string
  accountNumber: string
  routing: string
  beneficiarySsn: Record<string, string>
  beneficiaryAccount: Record<string, { accountNumber: string; routing: string }>
}

const emptyContact: BeneficiaryContact = { email: '', phone: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'USA' }
const emptyBank: BeneficiaryBank = { accountHolder: '', bankName: '', accountType: 'checking' }

export const DEFAULT_PERSONAL: PersonalDetails = {
  firstName: 'Alex',
  middleName: '',
  lastName: 'Morgan',
  gender: 'undisclosed',
  maritalStatus: 'married',
  dob: '1988-09-21',
  email: 'alex.morgan@example.com',
  phoneCode: '+1',
  phone: '206-555-0100',
  phone2Code: '+1',
  phone2: '',
  address1: '100 Example Street',
  address2: 'Unit 4',
  city: 'Seattle',
  state: 'Washington',
  zip: '98101',
  country: 'USA',
}

export const DEFAULT_BANK: BankDetails = { accountHolder: 'Alex Morgan', bankName: 'Example Bank', accountType: 'checking' }

export const DEFAULT_EMPLOYMENT: EmploymentDetails = {
  employeeId: 'EMP-00001',
  employer: 'Example Corp',
  jobTitle: 'Analyst',
  status: 'Active',
  payrollFrequency: 'monthly',
  hireDate: '2018-06-04',
  ownershipPct: 0,
  rehireDate: '2022-01-01',
  termDate: '2021-11-04',
}

export const DEFAULT_FLAGS: StatusFlags = {
  qdro: false,
  familyMemberOfOwner: false,
  officer: false,
  hce: false,
  keyEmployee: false,
  insiderRestricted: false,
}

export const DEFAULT_CLASSIFICATION: ClassificationCategory[] = [
  { id: 'location', label: 'Location', current: { code: 'WA', name: 'Washington', start: '2018-06-04', end: '2028-11-28' }, history: [{ code: 'WA', name: 'Washington', start: '2018-06-04', end: '2028-11-28' }] },
  { id: 'division', label: 'Division', current: { code: 'ENG', name: 'Engineering', start: '2018-06-04', end: '' }, history: [{ code: 'OPS', name: 'Operations', start: '2018-06-04', end: '2021-11-04' }, { code: 'ENG', name: 'Engineering', start: '2022-01-01', end: '' }] },
  { id: 'department', label: 'Department', current: { code: 'D-100', name: 'Platform', start: '2022-01-01', end: '' }, history: [{ code: 'D-100', name: 'Platform', start: '2022-01-01', end: '' }] },
  { id: 'paycode', label: 'Paycode', current: { code: 'PC-1', name: 'Standard', start: '2018-06-04', end: '' }, history: [{ code: 'PC-1', name: 'Standard', start: '2018-06-04', end: '' }] },
]

export const DEFAULT_BENEFICIARIES: Beneficiary[] = [
  { id: 'b1', type: 'primary', name: 'Sam Morgan', relationship: 'spouse', dob: '1987-03-14', share: 100, contact: { ...emptyContact }, bank: { ...emptyBank } },
  { id: 'b2', type: 'contingent', name: 'Taylor Morgan', relationship: 'sibling', dob: '1991-07-02', share: 100, contact: { ...emptyContact }, bank: { ...emptyBank } },
]

export const DEFAULT_SENSITIVE: SensitiveData = {
  ssn: '000000000',
  accountNumber: '000000000000',
  routing: '021000021',
  beneficiarySsn: { b1: '000000001', b2: '000000002' },
  beneficiaryAccount: {},
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export const digitsOnly = (s: string) => s.replace(/\D/g, '')

/** 123456789 → 123-45-6789 as the user types. */
export function formatSsn(raw: string): string {
  const d = digitsOnly(raw).slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

export const maskSsn = (ssn: string) => (ssn.length >= 4 ? `•••-••-${digitsOnly(ssn).slice(-4)}` : '•••-••-••••')
export const maskAccount = (n: string) => (n.length > 4 ? `${'•'.repeat(Math.max(n.length - 4, 4))}${n.slice(-4)}` : '••••')

export function ageFrom(dob: string, now: number): { years: number; months: number } | null {
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const n = new Date(now)
  let months = (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth())
  if (n.getDate() < d.getDate()) months -= 1
  return months < 0 ? null : { years: Math.floor(months / 12), months: months % 12 }
}

// ─── Validators: each returns an error key suffix, or null when valid ────────

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
export const isPhone = (v: string) => {
  const n = digitsOnly(v).length
  return n >= 7 && n <= 15
}
export const isSsn = (v: string) => {
  const d = digitsOnly(v)
  return d.length === 9
}
export const isZip = (v: string, country: string) =>
  /^(usa|us|united states)$/i.test(country.trim()) ? /^\d{5}(-?\d{4})?$/.test(v.trim()) : v.trim().length >= 3

/** US ABA routing number: 9 digits with the 3-7-1 weighted checksum. */
export function isAbaRouting(v: string): boolean {
  const d = digitsOnly(v)
  if (d.length !== 9) return false
  const n = d.split('').map(Number)
  const sum = 3 * (n[0] + n[3] + n[6]) + 7 * (n[1] + n[4] + n[7]) + (n[2] + n[5] + n[8])
  return sum % 10 === 0
}

export const isAccountNumber = (v: string) => {
  const n = digitsOnly(v).length
  return n >= 4 && n <= 17
}

export const isPastDate = (v: string, now: number) => {
  const t = new Date(v).getTime()
  return !Number.isNaN(t) && t <= now
}
