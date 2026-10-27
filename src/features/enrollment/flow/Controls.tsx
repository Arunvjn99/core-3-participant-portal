import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { chipCls, fieldCls } from './styles'

/** Small, focused inputs used inside the flow's pop-ups. */

export function ChipGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={chipCls(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Radio options with a short description each. */
export function RadioList<T extends string>({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string
  value: T
  options: { value: T; title: string; desc?: string; badge?: string; icon?: string }[]
  onChange: (v: T) => void
  /** Smaller rows for pop-ups with several choices */
  compact?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex w-full items-center rounded-xl border text-left transition-colors',
              compact ? 'gap-2.5 px-3 py-2' : 'items-start gap-3 rounded-2xl p-3.5',
              active ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30' : 'border-slate-200 hover:border-blue-300 dark:border-gray-700',
            )}
          >
            <span className={cn('flex shrink-0 items-center justify-center rounded-full border-2', compact ? 'h-4 w-4' : 'mt-0.5 h-5 w-5', active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-gray-600')} aria-hidden>
              {active && <Check className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} strokeWidth={3} />}
            </span>
            {o.icon && (
              <span className={cn('flex shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-800', compact ? 'h-7 w-7 text-sm' : 'h-9 w-9 rounded-xl text-lg')} aria-hidden>
                {o.icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-slate-900 dark:text-white" style={{ fontSize: compact ? '0.85rem' : '0.9rem', fontWeight: 600 }}>
                {o.title}
                {o.badge && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" style={{ fontSize: '0.7rem' }}>{o.badge}</span>}
              </span>
              {o.desc && <span className="mt-0.5 block text-slate-500 dark:text-gray-400" style={{ fontSize: compact ? '0.75rem' : '0.8rem', lineHeight: 1.35 }}>{o.desc}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function MoneyField({ value, onChange, label, placeholder }: { value: number; onChange: (v: number) => void; label: string; placeholder: string }) {
  const locale = getAppDateLocale()
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9rem] font-semibold text-slate-400">$</span>
      <input
        inputMode="numeric"
        autoComplete="off"
        value={value ? value.toLocaleString(locale) : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
        aria-label={label}
        className={cn(fieldCls, 'pl-7 font-semibold tabular-nums')}
      />
    </span>
  )
}

/** A slider with the chosen value shown large above it. */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="text-center tabular-nums text-slate-900 dark:text-white" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }} aria-hidden>
        {format(value)}
      </p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={format(value)}
        className="mt-3 h-2 w-full cursor-pointer accent-blue-600"
      />
      <div className="mt-1 flex justify-between text-slate-400" style={{ fontSize: '0.75rem' }} aria-hidden>
        <span>{format(min)}</span>
        <span>{t('enrollment.flow.drag_hint')}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}
