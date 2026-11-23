import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppIcon } from '@/design-system/icons'

export interface SwitcherPlan<K extends string> {
  key: K
  name: string
  status: string
  /** Included in this enrollment */
  on: boolean
  /** One short line: the rate and plan type */
  detail: string
}

/**
 * The plan the card is showing, by its full name, with "Plan 1 of 2" and a list to switch. Full names only appear
 * where there is room for them (the button truncates, the list wraps), so long plan names never crowd the header.
 */
export function PlanSwitcher<K extends string>({ plans, active, onChange }: { plans: SwitcherPlan<K>[]; active: K; onChange: (k: K) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const current = plans.find((p) => p.key === active) ?? plans[0]
  const index = plans.indexOf(current) + 1

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative min-w-0 flex-1 basis-[220px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/5"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{current.name}</span>
          <span className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-gray-400">
            <span>{t('plan2.n_of', { n: index, total: plans.length })}</span>
            <span aria-hidden>·</span>
            <span className={cn('inline-flex items-center gap-1', current.on ? 'text-emerald-700 dark:text-emerald-400' : '')}>
              <span className={cn('h-1.5 w-1.5 rounded-full', current.on ? 'bg-emerald-500' : 'bg-slate-400')} aria-hidden />
              {current.status}
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          {t('plan2.switch')}
          <AppIcon icon={ChevronDown} size="inline" className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <ul role="listbox" aria-label={t('plan2.tabs_label')} className="absolute left-0 top-full z-30 mt-1.5 w-[min(420px,calc(100vw-48px))] overflow-hidden rounded-2xl bg-surface-card p-1.5 shadow-[0_18px_40px_-16px_rgba(11,21,51,0.4)] ring-1 ring-slate-200 dark:ring-white/10">
          {plans.map((p, i) => {
            const on = p.key === active
            return (
              <li key={p.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(p.key)
                    setOpen(false)
                  }}
                  className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500', on ? 'bg-blue-50/70 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5')}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-snug text-slate-900 dark:text-white">{p.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-slate-500 dark:text-gray-400">
                      <span className={cn('inline-flex items-center gap-1', p.on ? 'text-emerald-700 dark:text-emerald-400' : '')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', p.on ? 'bg-emerald-500' : 'bg-slate-400')} aria-hidden />
                        {p.status}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{p.detail}</span>
                    </span>
                  </span>
                  {on && <AppIcon icon={Check} size="inline" className="mt-1 text-[#2563EB] dark:text-blue-300" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
