import { useMemo } from 'react'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useContributionLimits } from '@/features/contributions/useContributionLimits'
import { useOutsideAssetsStore } from '@/features/outside-assets/outsideAssetsStore'
import { useProfileStore } from '@/features/profile/profileStore'
import { addressKey, designationFingerprint, useVerificationStore } from '@/features/verification/verificationStore'

export type NextActionId = 'add_beneficiary' | 'sign_beneficiary' | 'spouse_consent' | 'full_match' | 'verify_bank' | 'verify_address' | 'auto_increase' | 'link_accounts' | 'review_risk'

export interface NextAction {
  id: NextActionId
  href: string
  /** Something the plan needs from the participant, shown with a "Required" tag. */
  required?: boolean
  /** Values for the action's text, such as a dollar amount. */
  values?: Record<string, string>
}

/**
 * The participant's next best actions, most important first, worked out from their own record:
 * beneficiaries, employer match, verification status, auto-increase and linked accounts.
 * Each rule adds an action only while it still applies, so the list shrinks as things get done.
 */
export function useNextBestActions(): NextAction[] {
  const { data } = useEnrollment()
  const limits = useContributionLimits()
  const beneficiaries = useProfileStore((s) => s.beneficiaries)
  const personal = useProfileStore((s) => s.personal)
  const designation = useVerificationStore((s) => s.designation)
  const consent = useVerificationStore((s) => s.spousalConsent)
  const bank = useVerificationStore((s) => s.bank)
  const addressVerifiedFor = useVerificationStore((s) => s.addressVerifiedFor)
  const linkedCount = useOutsideAssetsStore((s) => s.accounts.length)

  return useMemo(() => {
    const actions: NextAction[] = []

    if (beneficiaries.length === 0) {
      actions.push({ id: 'add_beneficiary', href: '/profile?section=beneficiary&add=1', required: true })
    } else if (designation?.fingerprint !== designationFingerprint(beneficiaries)) {
      actions.push({ id: 'sign_beneficiary', href: '/profile?section=beneficiary', required: true })
    } else {
      const consentNeeded = personal.maritalStatus === 'married' && beneficiaries.some((b) => b.type === 'primary' && b.relationship !== 'spouse' && b.share > 0)
      if (consentNeeded && consent.status !== 'completed') actions.push({ id: 'spouse_consent', href: '/profile?section=beneficiary', required: true })
    }

    if (limits.match.gapPercent > 0) {
      actions.push({ id: 'full_match', href: '/enrollment/contribution', values: { amount: `$${limits.match.missedAnnual.toLocaleString()}` } })
    }
    if (bank.status !== 'verified') actions.push({ id: 'verify_bank', href: '/profile?section=bank' })
    if (addressKey(personal) !== addressVerifiedFor) actions.push({ id: 'verify_address', href: '/profile?section=personal' })
    if (!data.autoIncrease) actions.push({ id: 'auto_increase', href: '/enrollment/auto-increase' })
    if (linkedCount === 0) actions.push({ id: 'link_accounts', href: '/outside-assets' })

    // Always something useful to do, even when every item above is settled
    actions.push({ id: 'review_risk', href: '/investments' })
    return actions
  }, [beneficiaries, designation, personal, consent, limits, bank, addressVerifiedFor, data.autoIncrease, linkedCount])
}
