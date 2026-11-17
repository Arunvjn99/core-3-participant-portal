import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, FileSignature, Hourglass } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { Input } from '@/design-system/components/Input'
import { Checkbox } from '@/design-system/components/Checkbox'
import { cn } from '@/lib/cn'
import { BODY_TEXT, DIVIDE, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, RULE } from '@/features/enrollment/enrollmentUi'
import { getAppDateLocale } from '@/lib/dateLocale'
import { isEmail } from '@/features/profile/profileData'
import { useProfileStore } from '@/features/profile/profileStore'
import { getSpousalConsentStatus, requestSpousalConsent } from './verificationService'
import { designationFingerprint, useVerificationStore } from './verificationStore'

const sameName = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Makes a beneficiary designation official: the participant signs it electronically, and when a married
 * participant leaves any of the primary share to someone other than their spouse, the spouse's notarized
 * consent is collected too. A later change to the beneficiaries asks for a new signature.
 */
export function BeneficiaryAuthorization() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const beneficiaries = useProfileStore((s) => s.beneficiaries)
  const personal = useProfileStore((s) => s.personal)
  const designation = useVerificationStore((s) => s.designation)
  const consent = useVerificationStore((s) => s.spousalConsent)
  const signDesignation = useVerificationStore((s) => s.signDesignation)
  const setConsent = useVerificationStore((s) => s.setSpousalConsent)

  const [open, setOpen] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [spouseEmail, setSpouseEmail] = useState('')
  const [emailError, setEmailError] = useState(false)

  const fingerprint = useMemo(() => designationFingerprint(beneficiaries), [beneficiaries])
  const fullName = [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(' ')
  const shortName = `${personal.firstName} ${personal.lastName}`

  const signed = designation?.fingerprint === fingerprint
  const consentNeeded = personal.maritalStatus === 'married' && beneficiaries.some((b) => b.type === 'primary' && b.relationship !== 'spouse' && b.share > 0)
  const consentDone = !consentNeeded || consent.status === 'completed'
  const complete = signed && consentDone

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })

  if (beneficiaries.length === 0) return null

  const openDialog = () => {
    setSignedName('')
    setAgreed(false)
    setNameError(false)
    setSpouseEmail('')
    setEmailError(false)
    setOpen(true)
  }

  const sign = (ev: FormEvent) => {
    ev.preventDefault()
    if (!sameName(signedName, fullName) && !sameName(signedName, shortName)) return setNameError(true)
    signDesignation({ fingerprint, signedName: signedName.trim(), signedAt: new Date().toISOString() })
    // A new signature covers a new set of choices, so any earlier consent no longer applies
    setConsent({ status: 'not_requested' })
    if (!consentNeeded) setOpen(false)
  }

  const sendConsent = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!isEmail(spouseEmail)) return setEmailError(true)
    const { requestedAt } = await requestSpousalConsent(spouseEmail.trim())
    setConsent({ status: 'waiting', email: spouseEmail.trim(), requestedAt })
    setOpen(false)
  }

  const refreshConsent = async () => {
    if (consent.status !== 'waiting') return
    if ((await getSpousalConsentStatus(consent.requestedAt)) === 'completed') setConsent({ status: 'completed', completedAt: new Date().toISOString() })
  }

  // One status line and at most one action
  let Icon = FileSignature
  let tone: 'amber' | 'emerald' = 'amber'
  let title = t('verify.bene.unsigned_title')
  let body = t(designation ? 'verify.bene.changed_body' : 'verify.bene.unsigned_body')
  let action: { label: string; run: () => void } | null = { label: t('verify.bene.sign_cta'), run: openDialog }

  if (complete && designation) {
    Icon = BadgeCheck
    tone = 'emerald'
    title = t('verify.bene.complete_title')
    body = consentNeeded && consent.status === 'completed'
      ? t('verify.bene.complete_body_consent', { signed: fmt(designation.signedAt), consent: fmt(consent.completedAt) })
      : t('verify.bene.complete_body', { signed: fmt(designation.signedAt) })
    action = null
  } else if (signed && consent.status === 'waiting') {
    Icon = Hourglass
    title = t('verify.bene.waiting_title')
    body = t('verify.bene.waiting_body', { email: consent.email, date: fmt(consent.requestedAt) })
    action = { label: t('verify.bene.check_status'), run: () => void refreshConsent() }
  } else if (signed) {
    title = t('verify.bene.consent_title')
    body = t('verify.bene.consent_body')
    action = { label: t('verify.bene.consent_cta'), run: openDialog }
  }

  return (
    <>
      <div className={cn('mt-5 flex flex-wrap items-center gap-3 border-t pt-4', RULE)}>
        <IconChip Icon={Icon} tone={tone} />
        <div className="min-w-0 flex-1" role="status">
          <p className={cn('text-sm font-bold', HEADING)}>{title}</p>
          <p className={cn('mt-0.5 text-xs', BODY_TEXT)}>{body}</p>
        </div>
        {action && (
          <button type="button" onClick={action.run} className={cn(PILL_PRIMARY, 'h-10')}>{action.label}</button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t(signed ? 'verify.bene.consent_title' : 'verify.bene.dialog_title')} size="lg">
        {!signed ? (
          <form onSubmit={sign} noValidate>
            <p className={cn('text-sm', BODY_TEXT)}>{t('verify.bene.dialog_intro')}</p>
            <ul className={cn('mt-4 divide-y border-y', RULE, DIVIDE)}>
              {[...beneficiaries].sort((a, b) => (a.type === b.type ? 0 : a.type === 'primary' ? -1 : 1)).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className={cn('block truncate text-sm font-semibold', HEADING)}>{b.name}</span>
                    <span className={cn('block text-xs', MUTED_TEXT)}>{t(`profile.d.type_${b.type}`)} · {t(`profile.d.rel_${b.relationship}`)}</span>
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', HEADING)}>{b.share}%</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Input
                id="bene-sign-name"
                autoComplete="off"
                label={t('verify.bene.sign_label')}
                hint={t('verify.bene.sign_hint', { name: fullName })}
                value={signedName}
                onChange={(e) => { setSignedName(e.target.value); setNameError(false) }}
                error={nameError ? t('verify.bene.sign_error') : undefined}
                aria-invalid={nameError || undefined}
              />
            </div>
            <div className="mt-4">
              <Checkbox id="bene-sign-agree" label={t('verify.bene.agree')} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={PILL_SECONDARY}>{t('verify.cancel')}</button>
              <button type="submit" disabled={!agreed || !signedName.trim()} className={PILL_PRIMARY}>{t('verify.bene.sign')}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void sendConsent(e)} noValidate>
            <p className={cn('text-sm', BODY_TEXT)}>{t('verify.bene.consent_dialog_body')}</p>
            <div className="mt-4">
              <Input
                id="bene-spouse-email"
                type="email"
                autoComplete="off"
                label={t('verify.bene.spouse_email')}
                value={spouseEmail}
                onChange={(e) => { setSpouseEmail(e.target.value); setEmailError(false) }}
                error={emailError ? t('profile.d.err_email') : undefined}
                aria-invalid={emailError || undefined}
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={PILL_SECONDARY}>{t('verify.bene.later')}</button>
              <button type="submit" disabled={!spouseEmail.trim()} className={PILL_PRIMARY}>{t('verify.bene.send')}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

export default BeneficiaryAuthorization
