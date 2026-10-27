import { cn } from '@/lib/cn'

/** Shared styles for the enrolment flow's pop-ups and controls. */
export const primaryBtn =
  'ml-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-blue-700 px-5 text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:bg-slate-200 disabled:text-slate-500'
export const ghostBtn = 'inline-flex min-h-[48px] items-center gap-2 rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'

export const chipCls = (active: boolean) =>
  cn(
    'min-h-[40px] rounded-full border px-3.5 text-[0.85rem] font-semibold transition-all',
    active
      ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
  )

export const fieldCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9rem] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900/50'
