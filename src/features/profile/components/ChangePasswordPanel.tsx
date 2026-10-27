import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { Input } from '@/design-system/components/Input'
import { cn } from '@/lib/cn'
import { ENV } from '@/lib/constants'
import { updatePassword } from '@/core/auth/authService'
import { PASSWORD_RULES, type PasswordRuleKey } from '../passwordRules'
import { ProfileCard } from './ProfileCard'

export function ChangePasswordPanel() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'demo' | 'error'; text: string } | null>(null)

  const rules = (Object.keys(PASSWORD_RULES) as PasswordRuleKey[]).map((k) => ({ k, ok: PASSWORD_RULES[k](next) }))

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!current) e.current = t('profile.d.err_required')
    if (!rules.every((r) => r.ok)) e.next = t('profile.d.err_pwd_rules')
    else if (next === current) e.next = t('profile.d.err_pwd_same')
    if (confirm !== next) e.confirm = t('profile.d.err_pwd_match')
    setErrors(e)
    setMessage(null)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    // With no Supabase configured there is no server to change a password on.
    if (ENV.DEMO_MODE) {
      setMessage({ kind: 'demo', text: t('profile.d.pwd_demo') })
      return
    }
    setBusy(true)
    const { error } = await updatePassword(next)
    setBusy(false)
    if (error) {
      setMessage({ kind: 'error', text: error.message })
      return
    }
    setMessage({ kind: 'ok', text: t('profile.d.pwd_ok') })
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  const inv = (k: string) => ({ error: errors[k], 'aria-invalid': errors[k] ? (true as const) : undefined })

  return (
    <ProfileCard title={t('profile.d.password_title')} subtitle={t('profile.d.password_sub')}>
      <form onSubmit={submit} noValidate className="max-w-md space-y-4">
        <Input id="pw-current" type="password" label={`${t('profile.security_current_password')} *`} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" {...inv('current')} />
        <Input id="pw-new" type="password" label={`${t('profile.security_new_password')} *`} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" {...inv('next')} />
        <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-label={t('profile.d.pwd_rules')}>
          {rules.map(({ k, ok }) => (
            <li key={k} className={cn('flex items-center gap-1.5', ok ? 'text-green-600' : 'text-gray-500 dark:text-gray-400')}>
              {ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
              {t(`profile.d.pwd_rule_${k}`)}
            </li>
          ))}
        </ul>
        <Input id="pw-confirm" type="password" label={`${t('profile.d.pwd_confirm')} *`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" {...inv('confirm')} />
        {message && (
          <p role="status" className={cn('rounded-lg px-3 py-2 text-sm', message.kind === 'ok' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : message.kind === 'demo' ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400')}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-60">
          {t('profile.security_update')}
        </button>
      </form>
    </ProfileCard>
  )
}
