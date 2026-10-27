import type { PersonalizationDraftData } from '@/core/store/enrollmentDraftStore'

/** The "about you" questions, in the order the pop-up asks them. */
export const QUESTIONS = ['birth', 'retire', 'location', 'salary', 'savings', 'comfort'] as const
export type WizardQuestion = (typeof QUESTIONS)[number]

/** Which questions still need an answer, from what's already in the enrolment draft (e.g. the dashboard popup). */
export function missingQuestions(p: PersonalizationDraftData, salary: number | undefined): WizardQuestion[] {
  return QUESTIONS.filter((q) =>
    q === 'birth' ? p.birthYear == null && p.currentAge == null
    : q === 'retire' ? p.retirementAge == null
    : q === 'location' ? p.selectedLocation == null
    : q === 'salary' ? !salary
    : q === 'savings' ? p.savingsAmount == null
    : p.riskTolerance == null,
  )
}
