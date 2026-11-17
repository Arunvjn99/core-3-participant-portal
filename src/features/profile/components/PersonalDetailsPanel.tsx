import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/design-system/components/Input'
import { Select } from '@/design-system/components/Select'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { GENDERS, MARITAL_STATUSES, ageFrom, formatSsn, isEmail, isPastDate, isPhone, isSsn, isZip, maskSsn, type PersonalDetails } from '../profileData'
import { useProfileStore } from '../profileStore'
import { FormActions, ProfileCard, ReadField, ReadGrid } from './ProfileCard'
import { useOptions } from './useOptions'
import { AddressCheckDialog } from '@/features/verification/AddressCheckDialog'
import { validateAddress, type AddressResult, type PostalAddress } from '@/features/verification/verificationService'
import { addressKey, useVerificationStore } from '@/features/verification/verificationStore'

type Errors = Partial<Record<keyof PersonalDetails | 'ssn', string>>

export function PersonalDetailsPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const personal = useProfileStore((s) => s.personal)
  const ssn = useProfileStore((s) => s.sensitive.ssn)
  const save = useProfileStore((s) => s.savePersonal)

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSsn, setShowSsn] = useState(false)
  const [draft, setDraft] = useState<PersonalDetails>(personal)
  const [draftSsn, setDraftSsn] = useState(formatSsn(ssn))
  const [errors, setErrors] = useState<Errors>({})
  const verifiedFor = useVerificationStore((s) => s.addressVerifiedFor)
  const setAddressVerified = useVerificationStore((s) => s.setAddressVerified)
  /** An address check that needs the participant's answer before the form can be saved. */
  const [addressCheck, setAddressCheck] = useState<Exclude<AddressResult, { status: 'verified' }> | null>(null)

  const genderOptions = useOptions('profile.d.gender_', GENDERS)
  const maritalOptions = useOptions('profile.d.marital_', MARITAL_STATUSES)

  const fmtDate = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '')
  const age = ageFrom(personal.dob, now)

  const set = <K extends keyof PersonalDetails>(k: K, v: PersonalDetails[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const startEdit = () => {
    setDraft(personal)
    setDraftSsn(formatSsn(ssn))
    setErrors({})
    setSaved(false)
    setEditing(true)
  }

  const validate = (): Errors => {
    const e: Errors = {}
    const req = (k: keyof PersonalDetails) => { if (!draft[k].toString().trim()) e[k] = t('profile.d.err_required') }
    ;(['firstName', 'lastName', 'address1', 'city', 'state', 'country'] as const).forEach(req)
    if (!draft.dob || !isPastDate(draft.dob, Date.now())) e.dob = t('profile.d.err_dob')
    if (!isSsn(draftSsn)) e.ssn = t('profile.d.err_ssn')
    if (!isEmail(draft.email)) e.email = t('profile.d.err_email')
    if (!isPhone(draft.phone)) e.phone = t('profile.d.err_phone')
    if (draft.phone2.trim() && !isPhone(draft.phone2)) e.phone2 = t('profile.d.err_phone')
    if (!isZip(draft.zip, draft.country)) e.zip = t('profile.d.err_zip')
    return e
  }

  const draftAddress: PostalAddress = { address1: draft.address1, address2: draft.address2, city: draft.city, state: draft.state, zip: draft.zip, country: draft.country }

  /** Saves the form with the given address, and records whether that address passed the check. */
  const commit = (address: PostalAddress, verified: boolean) => {
    const next = { ...draft, ...address, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), middleName: draft.middleName.trim() }
    save(next, draftSsn.replace(/\D/g, ''))
    setAddressVerified(verified ? addressKey(next) : null)
    setAddressCheck(null)
    setEditing(false)
    setSaved(true)
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    // An address that already passed, and has not been touched, is not checked again
    if (addressKey(draftAddress) === verifiedFor) return commit(draftAddress, true)
    const result = await validateAddress(draftAddress)
    if (result.status === 'verified') commit(result.address, true)
    else setAddressCheck(result)
  }

  const fullName = [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(' ')

  if (!editing) {
    return (
      <ProfileCard title={t('profile.d.personal_title')} onEdit={startEdit} saved={saved}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.about_you')}</h3>
        <ReadGrid>
          <ReadField label={t('profile.d.name')}>{fullName}</ReadField>
          <ReadField label={t('profile.d.gender')}>{t(`profile.d.gender_${personal.gender}`)}</ReadField>
          <ReadField label={t('profile.d.marital')}>{t(`profile.d.marital_${personal.maritalStatus}`)}</ReadField>
          <ReadField label={t('profile.d.dob')}>
            {fmtDate(personal.dob)}
            {age && <span className="ml-2 text-gray-500">{t('profile.d.age_value', { years: age.years, months: age.months })}</span>}
          </ReadField>
          <ReadField label={t('profile.d.ssn')}>
            <span className="inline-flex items-center gap-2">
              <span className="tabular-nums">{showSsn ? formatSsn(ssn) : maskSsn(ssn)}</span>
              <button
                type="button"
                onClick={() => setShowSsn((v) => !v)}
                aria-label={showSsn ? t('profile.d.hide_ssn') : t('profile.d.show_ssn')}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {showSsn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </ReadField>
        </ReadGrid>

        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.contact')}</h3>
        <ReadGrid>
          <ReadField label={t('profile.d.email')}>{personal.email}</ReadField>
          <ReadField label={t('profile.d.phone')}>{`${personal.phoneCode} ${personal.phone}`}</ReadField>
          <ReadField label={t('profile.d.phone2')}>{personal.phone2 ? `${personal.phone2Code} ${personal.phone2}` : ''}</ReadField>
          <ReadField label={t('profile.d.address')} wide>
            {[personal.address1, personal.address2].filter(Boolean).join(', ')}
            <br />
            {[personal.city, personal.state, personal.zip, personal.country].filter(Boolean).join(', ')}
            <span
              className={`mt-1.5 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                addressKey(personal) === verifiedFor
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20'
                  : 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20'
              }`}
            >
              {addressKey(personal) === verifiedFor && <BadgeCheck className="h-3 w-3" aria-hidden />}
              {t(addressKey(personal) === verifiedFor ? 'verify.address.badge_verified' : 'verify.address.badge_unverified')}
            </span>
          </ReadField>
        </ReadGrid>
      </ProfileCard>
    )
  }

  const inv = (k: keyof Errors) => ({ error: errors[k], 'aria-invalid': errors[k] ? (true as const) : undefined })

  return (
    <ProfileCard title={t('profile.d.personal_title')} editing>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.about_you')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="pd-first" label={`${t('profile.d.first_name')} *`} value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" {...inv('firstName')} />
          <Input id="pd-middle" label={t('profile.d.middle_name')} value={draft.middleName} onChange={(e) => set('middleName', e.target.value)} autoComplete="additional-name" />
          <Input id="pd-last" label={`${t('profile.d.last_name')} *`} value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" {...inv('lastName')} />
          <Select id="pd-gender" label={t('profile.d.gender')} options={genderOptions} value={draft.gender} onChange={(e) => set('gender', e.target.value as PersonalDetails['gender'])} />
          <Select id="pd-marital" label={t('profile.d.marital')} options={maritalOptions} value={draft.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value as PersonalDetails['maritalStatus'])} />
          <Input id="pd-dob" type="date" label={`${t('profile.d.dob')} *`} value={draft.dob} onChange={(e) => set('dob', e.target.value)} autoComplete="bday" {...inv('dob')} />
          <Input
            id="pd-ssn"
            type="password"
            inputMode="numeric"
            label={`${t('profile.d.ssn')} *`}
            value={draftSsn}
            onChange={(e) => setDraftSsn(formatSsn(e.target.value))}
            autoComplete="off"
            placeholder="•••-••-••••"
            {...inv('ssn')}
          />
        </div>

        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.contact')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="pd-email" type="email" label={`${t('profile.d.email')} *`} value={draft.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" {...inv('email')} />
          <div />
          <div className="grid grid-cols-[5.5rem_1fr] gap-2">
            <Input id="pd-code" label={t('profile.d.country_code')} value={draft.phoneCode} onChange={(e) => set('phoneCode', e.target.value)} />
            <Input id="pd-phone" type="tel" label={`${t('profile.d.phone')} *`} value={draft.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel-national" {...inv('phone')} />
          </div>
          <div className="grid grid-cols-[5.5rem_1fr] gap-2">
            <Input id="pd-code2" label={t('profile.d.country_code')} value={draft.phone2Code} onChange={(e) => set('phone2Code', e.target.value)} />
            <Input id="pd-phone2" type="tel" label={t('profile.d.phone2')} value={draft.phone2} onChange={(e) => set('phone2', e.target.value)} {...inv('phone2')} />
          </div>
          <Input id="pd-a1" label={`${t('profile.d.address1')} *`} value={draft.address1} onChange={(e) => set('address1', e.target.value)} autoComplete="address-line1" {...inv('address1')} />
          <Input id="pd-a2" label={t('profile.d.address2')} value={draft.address2} onChange={(e) => set('address2', e.target.value)} autoComplete="address-line2" />
          <Input id="pd-city" label={`${t('profile.d.city')} *`} value={draft.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" {...inv('city')} />
          <Input id="pd-state" label={`${t('profile.d.state')} *`} value={draft.state} onChange={(e) => set('state', e.target.value)} autoComplete="address-level1" {...inv('state')} />
          <Input id="pd-zip" label={`${t('profile.d.zip')} *`} value={draft.zip} onChange={(e) => set('zip', e.target.value)} autoComplete="postal-code" {...inv('zip')} />
          <Input id="pd-country" label={`${t('profile.d.country')} *`} value={draft.country} onChange={(e) => set('country', e.target.value)} autoComplete="country-name" {...inv('country')} />
        </div>
        <FormActions onCancel={() => setEditing(false)} saveLabel={t('profile.d.save')} cancelLabel={t('profile.d.cancel')} />
      </form>
      <AddressCheckDialog result={addressCheck} entered={draftAddress} onUse={commit} onEdit={() => setAddressCheck(null)} />
    </ProfileCard>
  )
}
