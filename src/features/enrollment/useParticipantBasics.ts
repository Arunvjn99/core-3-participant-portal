import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { PERIODS } from '@/features/plan/electionsData'
import { useProfileStore } from '@/features/profile/profileStore'
import { ageFromBirth } from './quickEnrollmentDefaults'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** What the record already holds about the participant, shared so every enrollment surface shows the same numbers. */
export function useParticipantBasics() {
  const draft = useEnrollmentDraftStore((s) => s.draftData)
  const personal = useProfileStore((s) => s.personal)
  const employment = useProfileStore((s) => s.employment)

  const p = draft.personalization ?? {}
  const dob = personal.dob ? new Date(`${personal.dob}T00:00:00`) : null
  const birthYear = dob?.getFullYear() ?? p.birthYear ?? 1975
  const birthMonth = dob ? MONTHS[dob.getMonth()] : (p.birthMonth ?? 'January')
  const birthDay = dob?.getDate() ?? p.birthDay ?? 1
  const age = ageFromBirth(birthYear, birthMonth, birthDay)
  const knownSalary = draft.savings?.salary ?? p.salary
  const retireAge = Math.max(p.retirementAge ?? 65, age + 1)

  return {
    draft,
    employer: employment.employer,
    periods: PERIODS[employment.payrollFrequency] ?? 12,
    birthYear,
    birthMonth,
    birthDay,
    age,
    knownSalary,
    salary: knownSalary || 85_000,
    retireAge,
    years: retireAge - age,
    savings: p.savingsAmount ?? 0,
  }
}
