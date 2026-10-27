import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Info } from 'lucide-react'
import { Input } from '@/design-system/components/Input'
import { Select } from '@/design-system/components/Select'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import {
  ACCOUNT_TYPES, RELATIONSHIPS, digitsOnly, formatSsn, isAbaRouting, isAccountNumber, isEmail, isPastDate, isPhone, isSsn, isZip,
  type Beneficiary, type BeneficiaryType,
} from '../profileData'
import { useProfileStore } from '../profileStore'
import { useOptions } from './useOptions'

const SECTIONS = ['basic', 'contact', 'bank'] as const
type Section = (typeof SECTIONS)[number]

const EMPTY = {
  type: 'primary' as BeneficiaryType,
  name: '',
  relationship: '' as Beneficiary['relationship'] | '',
  ssn: '',
  dob: '',
  email: '', phone: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'USA',
  accountHolder: '', bankName: '', accountType: 'checking' as Beneficiary['bank']['accountType'], accountNumber: '', routing: '',
}
type Draft = typeof EMPTY

/** Three-section add form. Nothing is saved until the final section is submitted. */
export function BeneficiaryForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const uid = useId()
  const addBeneficiary = useProfileStore((s) => s.addBeneficiary)
  const maritalStatus = useProfileStore((s) => s.personal.maritalStatus)
  const beneficiaries = useProfileStore((s) => s.beneficiaries)

  const [step, setStep] = useState<Section>('basic')
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [leaving, setLeaving] = useState(false)
  const [done, setDone] = useState<Section[]>([])

  const relOptions = useOptions('profile.d.rel_', RELATIONSHIPS, t('profile.d.select'))
  const typeOptions = useOptions('profile.d.acct_', ACCOUNT_TYPES)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(EMPTY)

  const validate = (s: Section): Record<string, string> => {
    const e: Record<string, string> = {}
    const now = Date.now()
    if (s === 'basic') {
      if (!draft.name.trim()) e.name = t('profile.d.err_name')
      if (!draft.relationship) e.relationship = t('profile.d.err_required')
      if (!isSsn(draft.ssn)) e.ssn = t('profile.d.err_ssn')
      if (!draft.dob || !isPastDate(draft.dob, now)) e.dob = t('profile.d.err_dob_ben')
    } else if (s === 'contact') {
      const addr = [draft.address1, draft.city, draft.state, draft.zip].some((v) => v.trim())
      if (!draft.email.trim() && !draft.phone.trim()) e.email = t('profile.d.err_contact')
      if (draft.email.trim() && !isEmail(draft.email)) e.email = t('profile.d.err_email')
      if (draft.phone.trim() && !isPhone(draft.phone)) e.phone = t('profile.d.err_phone')
      if (addr) {
        if (!draft.address1.trim()) e.address1 = t('profile.d.err_required')
        if (!draft.city.trim()) e.city = t('profile.d.err_required')
        if (!draft.state.trim()) e.state = t('profile.d.err_required')
        if (!isZip(draft.zip, draft.country)) e.zip = t('profile.d.err_zip')
      }
    } else {
      const any = [draft.accountHolder, draft.bankName, draft.accountNumber, draft.routing].some((v) => v.trim())
      if (any) {
        if (!draft.accountHolder.trim()) e.accountHolder = t('profile.d.err_required')
        if (!draft.bankName.trim()) e.bankName = t('profile.d.err_required')
        if (!isAccountNumber(draft.accountNumber)) e.accountNumber = t('profile.d.err_account')
        if (!isAbaRouting(draft.routing)) e.routing = t('profile.d.err_routing')
      }
    }
    return e
  }

  const focusFirstError = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())

  const next = () => {
    const e = validate(step)
    setErrors(e)
    if (Object.keys(e).length) return focusFirstError()
    setDone((d) => (d.includes(step) ? d : [...d, step]))
    setStep(SECTIONS[SECTIONS.indexOf(step) + 1])
  }

  const submit = () => {
    // Re-validate every section so a section cannot be skipped by jumping around.
    for (const s of SECTIONS) {
      const e = validate(s)
      if (Object.keys(e).length) {
        setStep(s)
        setErrors(e)
        return focusFirstError()
      }
    }
    const hasBank = !!draft.accountNumber.trim()
    const sameType = beneficiaries.filter((b) => b.type === draft.type)
    addBeneficiary(
      {
        type: draft.type,
        name: draft.name.trim(),
        relationship: draft.relationship as Beneficiary['relationship'],
        dob: draft.dob,
        // First beneficiary of a type gets the full share; otherwise the participant sets the split.
        share: sameType.length === 0 ? 100 : 0,
        contact: { email: draft.email.trim(), phone: draft.phone.trim(), address1: draft.address1.trim(), address2: draft.address2.trim(), city: draft.city.trim(), state: draft.state.trim(), zip: draft.zip.trim(), country: draft.country.trim() },
        bank: { accountHolder: draft.accountHolder.trim(), bankName: draft.bankName.trim(), accountType: draft.accountType },
      },
      digitsOnly(draft.ssn),
      hasBank ? { accountNumber: digitsOnly(draft.accountNumber), routing: digitsOnly(draft.routing) } : { accountNumber: '', routing: '' },
    )
    onDone()
  }

  const inv = (k: string) => ({ error: errors[k], 'aria-invalid': errors[k] ? (true as const) : undefined })
  const spouseConsent = maritalStatus === 'married' && draft.type === 'primary' && draft.relationship && draft.relationship !== 'spouse'
  const stepIdx = SECTIONS.indexOf(step)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <button
        type="button"
        onClick={() => (dirty ? setLeaving(true) : onDone())}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('profile.d.back')}
      </button>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.d.add_beneficiary')}</h2>

      <ol className="mt-4 grid gap-2 sm:grid-cols-3" aria-label={t('profile.d.ben_sections')}>
        {SECTIONS.map((s, i) => {
          const isDone = done.includes(s)
          const current = s === step
          return (
            <li key={s}>
              <button
                type="button"
                disabled={!isDone && !current}
                onClick={() => setStep(s)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default',
                  current ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700',
                )}
              >
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', isDone ? 'bg-green-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300')}>
                  {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t(`profile.d.sec_${s}`)}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t(`profile.d.sec_${s}_sub`)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <form
        className="mt-6"
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault()
          if (step === 'bank') submit()
          else next()
        }}
      >
        {step === 'basic' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-sm font-medium text-gray-900 dark:text-white">{t('profile.d.ben_type')}</legend>
              <div className="flex gap-2" role="radiogroup">
                {(['primary', 'contingent'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={draft.type === v}
                    onClick={() => set('type', v)}
                    className={cn('rounded-lg border px-4 py-2 text-sm font-medium transition-colors', draft.type === v ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800')}
                  >
                    {t(`profile.d.type_${v}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <Input id={`${uid}-name`} label={`${t('profile.d.ben_name')} *`} value={draft.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" {...inv('name')} />
            <Select id={`${uid}-rel`} label={`${t('profile.d.relationship')} *`} options={relOptions} value={draft.relationship} onChange={(e) => set('relationship', e.target.value as Draft['relationship'])} error={errors.relationship} aria-invalid={errors.relationship ? true : undefined} />
            <Input id={`${uid}-ssn`} type="password" inputMode="numeric" label={`${t('profile.d.ssn')} *`} value={draft.ssn} onChange={(e) => set('ssn', formatSsn(e.target.value))} placeholder="•••-••-••••" autoComplete="off" {...inv('ssn')} />
            <Input id={`${uid}-dob`} type="date" label={`${t('profile.d.dob')} *`} value={draft.dob} onChange={(e) => set('dob', e.target.value)} {...inv('dob')} />
            {spouseConsent && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 sm:col-span-2" role="note">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('profile.d.spouse_consent')}
              </p>
            )}
          </div>
        )}

        {step === 'contact' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id={`${uid}-email`} type="email" label={t('profile.d.email')} value={draft.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" {...inv('email')} />
            <Input id={`${uid}-phone`} type="tel" label={t('profile.d.phone')} value={draft.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="off" {...inv('phone')} />
            <Input id={`${uid}-a1`} label={t('profile.d.address1')} value={draft.address1} onChange={(e) => set('address1', e.target.value)} autoComplete="off" {...inv('address1')} />
            <Input id={`${uid}-a2`} label={t('profile.d.address2')} value={draft.address2} onChange={(e) => set('address2', e.target.value)} autoComplete="off" />
            <Input id={`${uid}-city`} label={t('profile.d.city')} value={draft.city} onChange={(e) => set('city', e.target.value)} autoComplete="off" {...inv('city')} />
            <Input id={`${uid}-state`} label={t('profile.d.state')} value={draft.state} onChange={(e) => set('state', e.target.value)} autoComplete="off" {...inv('state')} />
            <Input id={`${uid}-zip`} label={t('profile.d.zip')} value={draft.zip} onChange={(e) => set('zip', e.target.value)} autoComplete="off" {...inv('zip')} />
            <Input id={`${uid}-country`} label={t('profile.d.country')} value={draft.country} onChange={(e) => set('country', e.target.value)} autoComplete="off" />
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">{t('profile.d.contact_hint')}</p>
          </div>
        )}

        {step === 'bank' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">{t('profile.d.ben_bank_hint')}</p>
            <Input id={`${uid}-holder`} label={t('profile.d.acct_holder')} value={draft.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} autoComplete="off" {...inv('accountHolder')} />
            <Input id={`${uid}-bank`} label={t('profile.d.bank_name')} value={draft.bankName} onChange={(e) => set('bankName', e.target.value)} autoComplete="off" {...inv('bankName')} />
            <Select id={`${uid}-type`} label={t('profile.d.acct_type')} options={typeOptions} value={draft.accountType} onChange={(e) => set('accountType', e.target.value as Draft['accountType'])} />
            <Input id={`${uid}-acct`} type="password" inputMode="numeric" label={t('profile.d.acct_number')} value={draft.accountNumber} onChange={(e) => set('accountNumber', digitsOnly(e.target.value).slice(0, 17))} autoComplete="off" {...inv('accountNumber')} />
            <Input id={`${uid}-routing`} inputMode="numeric" label={t('profile.d.routing')} value={draft.routing} onChange={(e) => set('routing', digitsOnly(e.target.value).slice(0, 9))} autoComplete="off" hint={t('profile.d.routing_hint')} {...inv('routing')} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button type="button" onClick={() => (dirty ? setLeaving(true) : onDone())} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
            {t('profile.d.cancel')}
          </button>
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button type="button" onClick={() => setStep(SECTIONS[stepIdx - 1])} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                {t('profile.d.previous')}
              </button>
            )}
            <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">
              {step === 'bank' ? t('profile.d.save_beneficiary') : t('profile.d.next')}
            </button>
          </div>
        </div>
      </form>

      <Modal open={leaving} onClose={() => setLeaving(false)} title={t('profile.d.leave_title')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('profile.d.leave_body')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setLeaving(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
            {t('profile.d.keep_editing')}
          </button>
          <button type="button" onClick={onDone} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            {t('profile.d.leave')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
