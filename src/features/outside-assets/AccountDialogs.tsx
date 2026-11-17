import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { BODY_TEXT, HEADING, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, chip } from '@/features/enrollment/enrollmentUi'
import { ACCOUNT_TYPES, LINKABLE_TYPES, connectAccount, isLiability, listInstitutions, type AccountType, type Institution, type LinkedAccount } from './linkService'
import { useOutsideAssetsStore } from './outsideAssetsStore'
import { ACCOUNT_GROUPS, accountName, groupOf, parseAmount } from './summary'

const MAX_BALANCE = 999_999_999
const NICKNAME_MAX = 40

const FIELD =
  'h-11 w-full rounded-xl bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 aria-[invalid=true]:ring-rose-500 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:aria-[invalid=true]:ring-rose-400'
/** Same pill as the primary button, in the destructive colour. */
const PILL_DANGER =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] transition-all hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/70 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 dark:bg-rose-700 dark:hover:bg-rose-600'
const ACTIONS = 'mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end'


function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={cn('mb-1.5 block text-[13px] font-semibold', HEADING)}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p id={`${id}-note`} className={cn('mt-1.5 text-xs', MUTED_TEXT)}>{hint}</p>
      )}
    </div>
  )
}

/** Account types in a select, grouped the same way as the page: Retirement, Other assets, Debts. */
function TypeSelect({ id, value, onChange, types }: { id: string; value: AccountType; onChange: (t: AccountType) => void; types: AccountType[] }) {
  const { t } = useTranslation()
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as AccountType)} className={FIELD}>
      {ACCOUNT_GROUPS.map((group) => (
        <optgroup key={group} label={t(`outside_assets.group.${group}`)}>
          {types.filter((type) => groupOf(type) === group).map((type) => (
            <option key={type} value={type}>{t(`outside_assets.type.${type}`)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function AmountInput({ id, value, onChange, invalid, described }: { id: string; value: string; onChange: (v: string) => void; invalid: boolean; described: boolean }) {
  return (
    <div className="relative">
      <span className={cn('pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm', MUTED_TEXT)} aria-hidden>$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={described ? `${id}-note` : undefined}
        className={cn(FIELD, 'pl-7 tabular-nums')}
      />
    </div>
  )
}

/** Returns the amount, or the message to show under the field. */
function readBalance(raw: string, t: TFunction): { value: number } | { error: string } {
  const value = parseAmount(raw)
  if (value === null) return { error: t('outside_assets.form.err_balance') }
  if (value > MAX_BALANCE) return { error: t('outside_assets.form.err_balance_max') }
  return { value }
}

// ─── Add account ─────────────────────────────────────────────────────────────

type AddMode = 'connect' | 'manual'

function ConnectForm({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const uid = useId()
  const addLinked = useOutsideAssetsStore((s) => s.addLinked)
  const [institutions, setInstitutions] = useState<Institution[] | null>(null)
  const [institutionId, setInstitutionId] = useState('')
  const [type, setType] = useState<AccountType>('retirement_401k')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listInstitutions()
      .then((list) => active && setInstitutions(list))
      .catch(() => active && setInstitutions([]))
    return () => {
      active = false
    }
  }, [])

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (busy) return
    if (!institutionId) {
      setError(t('outside_assets.form.err_institution'))
      document.getElementById(`${uid}-institution`)?.focus()
      return
    }
    setError('')
    setBusy(true)
    try {
      const account = await connectAccount(institutionId, type)
      addLinked(account)
      onDone(account.institution)
    } catch {
      setError(t('outside_assets.form.err_connect'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id={`${uid}-institution`} label={t('outside_assets.form.institution')} error={error}>
        <select
          id={`${uid}-institution`}
          value={institutionId}
          onChange={(e) => {
            setInstitutionId(e.target.value)
            setError('')
          }}
          disabled={!institutions}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${uid}-institution-note` : undefined}
          className={FIELD}
        >
          <option value="">{institutions ? t('outside_assets.form.institution_choose') : t('outside_assets.form.loading')}</option>
          {institutions?.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </Field>
      <Field id={`${uid}-type`} label={t('outside_assets.form.type')}>
        <TypeSelect id={`${uid}-type`} value={type} onChange={setType} types={LINKABLE_TYPES} />
      </Field>
      <p className={cn('text-xs leading-relaxed', BODY_TEXT)}>{t('outside_assets.form.connect_note')}</p>
      <div className={ACTIONS}>
        <button type="button" onClick={onCancel} className={PILL_SECONDARY}>{t('outside_assets.cancel')}</button>
        <button type="submit" disabled={busy || !institutions} className={PILL_PRIMARY}>
          {busy ? t('outside_assets.form.connecting') : t('outside_assets.form.connect')}
        </button>
      </div>
    </form>
  )
}

function ManualForm({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const uid = useId()
  const addManual = useOutsideAssetsStore((s) => s.addManual)
  const [nickname, setNickname] = useState('')
  const [type, setType] = useState<AccountType>('ira')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<{ nickname?: string; balance?: string }>({})

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const balance = readBalance(amount, t)
    const next = {
      nickname: nickname.trim() ? undefined : t('outside_assets.form.err_nickname'),
      balance: 'error' in balance ? balance.error : undefined,
    }
    setErrors(next)
    if (next.nickname) return document.getElementById(`${uid}-nickname`)?.focus()
    if ('error' in balance) return document.getElementById(`${uid}-balance`)?.focus()
    addManual({ nickname, type, balance: balance.value })
    onDone(nickname.trim())
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id={`${uid}-nickname`} label={t('outside_assets.form.nickname')} error={errors.nickname} hint={t('outside_assets.form.nickname_hint')}>
        <input
          id={`${uid}-nickname`}
          type="text"
          value={nickname}
          maxLength={NICKNAME_MAX}
          autoComplete="off"
          onChange={(e) => setNickname(e.target.value)}
          aria-invalid={Boolean(errors.nickname)}
          aria-describedby={`${uid}-nickname-note`}
          className={FIELD}
        />
      </Field>
      <Field id={`${uid}-type`} label={t('outside_assets.form.type')}>
        <TypeSelect id={`${uid}-type`} value={type} onChange={setType} types={ACCOUNT_TYPES} />
      </Field>
      <Field
        id={`${uid}-balance`}
        label={isLiability(type) ? t('outside_assets.form.balance_owed') : t('outside_assets.form.balance')}
        error={errors.balance}
      >
        <AmountInput id={`${uid}-balance`} value={amount} onChange={setAmount} invalid={Boolean(errors.balance)} described={Boolean(errors.balance)} />
      </Field>
      <div className={ACTIONS}>
        <button type="button" onClick={onCancel} className={PILL_SECONDARY}>{t('outside_assets.cancel')}</button>
        <button type="submit" className={PILL_PRIMARY}>{t('outside_assets.add')}</button>
      </div>
    </form>
  )
}

function AddAccountBody({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<AddMode>('connect')
  return (
    <>
      <div role="group" aria-label={t('outside_assets.form.mode_label')} className="mb-5 flex flex-wrap gap-2">
        {(['connect', 'manual'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={chip(mode === m)}>
            {t(`outside_assets.form.mode_${m}`)}
          </button>
        ))}
      </div>
      {mode === 'connect' ? <ConnectForm onDone={onDone} onCancel={onCancel} /> : <ManualForm onDone={onDone} onCancel={onCancel} />}
    </>
  )
}

export function AddAccountDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (name: string) => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={t('outside_assets.add')} className="rounded-[20px]">
      <AddAccountBody
        onCancel={onClose}
        onDone={(name) => {
          onAdded(name)
          onClose()
        }}
      />
    </Modal>
  )
}

// ─── Edit balance (accounts entered by hand) ─────────────────────────────────

function EditBalanceBody({ account, onClose, onSaved }: { account: LinkedAccount; onClose: () => void; onSaved: (name: string) => void }) {
  const { t } = useTranslation()
  const uid = useId()
  const updateBalance = useOutsideAssetsStore((s) => s.updateBalance)
  const [amount, setAmount] = useState(() => account.balance.toLocaleString(getAppDateLocale(), { useGrouping: false, maximumFractionDigits: 2 }))
  const [error, setError] = useState('')
  const name = accountName(account, t)

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const balance = readBalance(amount, t)
    if ('error' in balance) {
      setError(balance.error)
      document.getElementById(`${uid}-balance`)?.focus()
      return
    }
    updateBalance(account.id, balance.value)
    onSaved(name)
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field
        id={`${uid}-balance`}
        label={isLiability(account.type) ? t('outside_assets.form.balance_owed') : t('outside_assets.form.balance')}
        error={error}
        hint={`${name} · ${t(`outside_assets.type.${account.type}`)}`}
      >
        <AmountInput id={`${uid}-balance`} value={amount} onChange={setAmount} invalid={Boolean(error)} described />
      </Field>
      <div className={ACTIONS}>
        <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('outside_assets.cancel')}</button>
        <button type="submit" className={PILL_PRIMARY}>{t('outside_assets.save')}</button>
      </div>
    </form>
  )
}

export function EditBalanceDialog({ account, onClose, onSaved }: { account: LinkedAccount | null; onClose: () => void; onSaved: (name: string) => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={Boolean(account)} onClose={onClose} title={t('outside_assets.edit_title')} size="sm" className="rounded-[20px]">
      {account && <EditBalanceBody account={account} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

// ─── Remove (always confirmed) ───────────────────────────────────────────────

export function RemoveAccountDialog({ account, onClose, onRemoved }: { account: LinkedAccount | null; onClose: () => void; onRemoved: (name: string) => void }) {
  const { t } = useTranslation()
  const removeAccount = useOutsideAssetsStore((s) => s.removeAccount)
  return (
    <Modal open={Boolean(account)} onClose={onClose} title={t('outside_assets.remove_title')} size="sm" className="rounded-[20px]">
      {account && (
        <>
          <p className={cn('text-sm leading-relaxed', BODY_TEXT)}>
            {t(account.source === 'linked' ? 'outside_assets.remove_body_linked' : 'outside_assets.remove_body_manual', { name: accountName(account, t) })}
          </p>
          <div className={ACTIONS}>
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('outside_assets.keep')}</button>
            <button
              type="button"
              onClick={() => {
                removeAccount(account.id)
                onRemoved(accountName(account, t))
                onClose()
              }}
              className={PILL_DANGER}
            >
              {t('outside_assets.remove')}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
