import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/design-system/components/Input'
import { Select } from '@/design-system/components/Select'
import { ACCOUNT_TYPES, digitsOnly, isAbaRouting, isAccountNumber, maskAccount, type BankDetails } from '../profileData'
import { useProfileStore } from '../profileStore'
import { FormActions, ProfileCard, ReadField, ReadGrid } from './ProfileCard'
import { useOptions } from './useOptions'
import { BankVerifyDialog } from '@/features/verification/BankVerifyDialog'
import { useIdentityGate } from '@/features/verification/useIdentityGate'
import { useVerificationStore } from '@/features/verification/verificationStore'
import { getAppDateLocale } from '@/lib/dateLocale'

export function BankDetailsPanel() {
  const { t } = useTranslation()
  const bank = useProfileStore((s) => s.bank)
  const accountNumber = useProfileStore((s) => s.sensitive.accountNumber)
  const routing = useProfileStore((s) => s.sensitive.routing)
  const save = useProfileStore((s) => s.saveBank)

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [draft, setDraft] = useState<BankDetails>(bank)
  const [draftAcct, setDraftAcct] = useState(accountNumber)
  const [draftRouting, setDraftRouting] = useState(routing)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const lastName = useProfileStore((s) => s.personal.lastName)
  const verification = useVerificationStore((s) => s.bank)
  const setVerification = useVerificationStore((s) => s.setBank)
  const [verifying, setVerifying] = useState(false)
  const { guard, dialog: identityDialog } = useIdentityGate()

  const typeOptions = useOptions('profile.d.acct_', ACCOUNT_TYPES)

  const startEdit = () => {
    setDraft(bank)
    setDraftAcct(accountNumber)
    setDraftRouting(routing)
    setErrors({})
    setSaved(false)
    setEditing(true)
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!draft.accountHolder.trim()) e.accountHolder = t('profile.d.err_required')
    if (!draft.bankName.trim()) e.bankName = t('profile.d.err_required')
    if (!isAccountNumber(draftAcct)) e.account = t('profile.d.err_account')
    if (!isAbaRouting(draftRouting)) e.routing = t('profile.d.err_routing')
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    // A different account has to be verified again before money can be sent to it
    const accountChanged = digitsOnly(draftAcct) !== accountNumber || digitsOnly(draftRouting) !== routing || draft.accountHolder.trim() !== bank.accountHolder
    save({ ...draft, accountHolder: draft.accountHolder.trim(), bankName: draft.bankName.trim() }, digitsOnly(draftAcct), digitsOnly(draftRouting))
    setEditing(false)
    setSaved(true)
    if (accountChanged) {
      setVerification({ status: 'unverified' })
      setVerifying(true)
    }
  }

  const inv = (k: string) => ({ error: errors[k], 'aria-invalid': errors[k] ? (true as const) : undefined })

  if (!editing) {
    return (
      <ProfileCard title={t('profile.d.bank_title')} subtitle={t('profile.d.bank_sub')} onEdit={() => guard(startEdit)} saved={saved}>
        <ReadGrid>
          <ReadField label={t('profile.d.acct_holder')}>{bank.accountHolder}</ReadField>
          <ReadField label={t('profile.d.bank_name')}>{bank.bankName}</ReadField>
          <ReadField label={t('profile.d.acct_type')}>{t(`profile.d.acct_${bank.accountType}`)}</ReadField>
          <ReadField label={t('profile.d.acct_number')}>
            <span className="inline-flex items-center gap-2">
              <span className="tabular-nums">{reveal ? accountNumber : maskAccount(accountNumber)}</span>
              <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? t('profile.d.hide_acct') : t('profile.d.show_acct')} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </ReadField>
          <ReadField label={t('profile.d.routing')}><span className="tabular-nums">{routing}</span></ReadField>
          <ReadField label={t('verify.bank.status')}>
            {verification.status === 'verified' ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                {t('verify.bank.status_verified', { date: new Date(verification.verifiedAt).toLocaleDateString(getAppDateLocale(), { year: 'numeric', month: 'short', day: 'numeric' }) })}
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-amber-700 dark:text-amber-300">{t(verification.status === 'pending_deposits' ? 'verify.bank.status_pending' : 'verify.bank.status_unverified')}</span>
                <button type="button" onClick={() => setVerifying(true)} className="font-semibold text-primary hover:underline dark:text-blue-300">
                  {t(verification.status === 'pending_deposits' ? 'verify.bank.enter_amounts' : 'verify.bank.verify_cta')}
                </button>
              </span>
            )}
          </ReadField>
        </ReadGrid>
        {identityDialog}
        <BankVerifyDialog open={verifying} onClose={() => setVerifying(false)} accountHolder={bank.accountHolder} routing={routing} participantLastName={lastName} />
      </ProfileCard>
    )
  }

  return (
    <ProfileCard title={t('profile.d.bank_title')} editing>
      <form onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="bk-holder" label={`${t('profile.d.acct_holder')} *`} value={draft.accountHolder} onChange={(e) => setDraft({ ...draft, accountHolder: e.target.value })} autoComplete="off" {...inv('accountHolder')} />
          <Input id="bk-name" label={`${t('profile.d.bank_name')} *`} value={draft.bankName} onChange={(e) => setDraft({ ...draft, bankName: e.target.value })} autoComplete="off" {...inv('bankName')} />
          <Select id="bk-type" label={t('profile.d.acct_type')} options={typeOptions} value={draft.accountType} onChange={(e) => setDraft({ ...draft, accountType: e.target.value as BankDetails['accountType'] })} />
          <Input id="bk-acct" type="password" inputMode="numeric" label={`${t('profile.d.acct_number')} *`} value={draftAcct} onChange={(e) => setDraftAcct(digitsOnly(e.target.value).slice(0, 17))} autoComplete="off" {...inv('account')} />
          <Input
            id="bk-routing"
            inputMode="numeric"
            label={`${t('profile.d.routing')} *`}
            value={draftRouting}
            onChange={(e) => setDraftRouting(digitsOnly(e.target.value).slice(0, 9))}
            autoComplete="off"
            hint={t('profile.d.routing_hint')}
            {...inv('routing')}
          />
        </div>
        <FormActions onCancel={() => setEditing(false)} saveLabel={t('profile.d.save')} cancelLabel={t('profile.d.cancel')} />
      </form>
    </ProfileCard>
  )
}
