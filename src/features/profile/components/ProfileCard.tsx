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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {saved && !editing && (
            <span role="status" className="flex items-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t('profile.d.saved')}
            </span>
          )}
          {actions}
          {onEdit && !editing && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
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
  return <dl className={cn('grid gap-x-8 gap-y-4', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>{children}</dl>
}

export function ReadField({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-white">{children || <span className="text-gray-400">—</span>}</dd>
    </div>
  )
}

export function FormActions({ onCancel, saveLabel, cancelLabel }: { onCancel: () => void; saveLabel: string; cancelLabel: string }) {
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
      <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
        {cancelLabel}
      </button>
      <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">
        {saveLabel}
      </button>
    </div>
  )
}
