import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Pencil } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Card shell shared by the profile sections: title, optional Edit button and a saved confirmation. */
export function ProfileCard({
  title,
  subtitle,
  onEdit,
  editing,
  saved,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  onEdit?: () => void
  editing?: boolean
  saved?: boolean
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section className="rounded-[20px] bg-surface-card p-5 shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 sm:p-6 dark:ring-white/10">
      <div className="-mx-5 mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-5 pb-4 sm:-mx-6 sm:px-6 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-tight text-text-primary">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] leading-snug text-text-secondary">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {saved && !editing && (
            <span role="status" className="flex items-center gap-1 text-[13px] font-semibold text-status-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t('profile.d.saved')}
            </span>
          )}
          {actions}
          {onEdit && !editing && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-primary ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-blue-300 dark:ring-blue-400/30 dark:hover:bg-blue-500/10"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t('profile.d.edit')}
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

export function ReadGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <dl className={cn('grid gap-x-8 gap-y-5', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>{children}</dl>
}

export function ReadField({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="text-[12px] font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-medium leading-snug text-text-primary">{children || <span className="font-normal text-text-muted">—</span>}</dd>
    </div>
  )
}

export function FormActions({ onCancel, saveLabel, cancelLabel }: { onCancel: () => void; saveLabel: string; cancelLabel: string }) {
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
      <button type="button" onClick={onCancel} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-slate-800 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10">
        {cancelLabel}
      </button>
      <button type="submit" className="btn-brand inline-flex h-10 items-center rounded-full px-5 text-[14px] font-semibold">
        {saveLabel}
      </button>
    </div>
  )
}
