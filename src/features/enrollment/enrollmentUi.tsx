import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The dashboards' look, shared by every enrollment step so the flow reads as part of the same portal:
 * navy headings, 20px cards with a soft ring, colour washes, pill buttons and solid icon badges.
 */

export const HEADING = 'text-[#0B1533] dark:text-white'
export const BODY_TEXT = 'text-slate-600 dark:text-slate-300'
export const MUTED_TEXT = 'text-slate-500 dark:text-slate-400'
/** Hairline used instead of nesting a box inside a card. */
export const RULE = 'border-slate-200/80 dark:border-white/10'
export const DIVIDE = 'divide-slate-200/80 dark:divide-white/10'
export const SECTION_LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'
export const CARD_TITLE = cn('text-base font-bold leading-tight', HEADING)

const CARD_SHAPE = 'rounded-[20px] shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)]'

/** Card surfaces from the dashboards. */
export const CARD_TONES = {
  plain: 'bg-surface-card ring-1 ring-slate-200/70 dark:ring-white/10',
  blue: 'bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(70%_130%_at_100%_100%,#DCE1FB_0%,rgba(220,225,251,0)_65%),linear-gradient(#F8F9FE,#F8F9FE)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(70%_130%_at_100%_100%,#262F86_0%,rgba(38,47,134,0)_65%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  sky: 'bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] ring-1 ring-blue-100 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20',
  green: 'bg-[radial-gradient(80%_120%_at_100%_100%,#EFFAF2_0%,rgba(239,250,242,0)_50%),linear-gradient(#FFFFFF,#FFFFFF)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(80%_120%_at_100%_100%,rgba(18,63,70,0.45)_0%,rgba(18,63,70,0)_50%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  warm: 'bg-[radial-gradient(70%_120%_at_0%_0%,#F1FAF5_0%,rgba(241,250,245,0)_50%),radial-gradient(60%_120%_at_100%_0%,#FFF3DC_0%,rgba(255,243,220,0)_60%),linear-gradient(#F8F9FE,#F8F9FE)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(70%_120%_at_0%_0%,rgba(16,185,129,0.07)_0%,rgba(16,185,129,0)_50%),radial-gradient(60%_120%_at_100%_0%,rgba(245,158,11,0.14)_0%,rgba(245,158,11,0)_60%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  /** The option the participant has picked: brand ring over a blue tint. */
  selected: 'bg-blue-50 ring-2 ring-primary dark:bg-blue-500/10 dark:ring-blue-400',
} as const

export type CardTone = keyof typeof CARD_TONES

/** Class string for a card, for elements that cannot use `<Card>` (buttons, motion wrappers). */
export const card = (tone: CardTone = 'plain', padded = true) => cn(CARD_SHAPE, CARD_TONES[tone], padded && 'p-5 sm:p-6')

export function Card({ tone = 'plain', padded = true, className, children }: { tone?: CardTone; padded?: boolean; className?: string; children: ReactNode }) {
  return <div className={cn(card(tone, padded), className)}>{children}</div>
}

const PILL_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100'
export const PILL_PRIMARY = cn(
  PILL_BASE,
  'h-11 bg-primary px-5 text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] hover:brightness-110 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]',
)
export const PILL_SECONDARY = cn(
  PILL_BASE,
  'h-11 bg-white px-4 text-slate-900 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:hover:bg-slate-800',
)
/** Small round button for plus / minus steppers. */
export const ROUND_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_-12px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/15 dark:hover:bg-slate-800'
export const TEXT_LINK = 'inline-flex items-center gap-0.5 font-semibold text-primary hover:underline dark:text-blue-300'

/** A small pill the participant picks from a row of choices. */
export const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-[36px] items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70',
    active
      ? 'bg-primary text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]'
      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-blue-300 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:ring-blue-400/50',
  )

/** A tile the participant picks: a soft ring at rest, the brand ring and a blue tint once chosen. */
export const choice = (selected: boolean) =>
  cn(
    'rounded-2xl transition-shadow',
    selected
      ? 'bg-blue-50 ring-2 ring-primary dark:bg-blue-500/10 dark:ring-blue-400'
      : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-blue-400/50',
  )

const BADGE_TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10',
} as const

export type BadgeTone = keyof typeof BADGE_TONES

/** Small label pill ("Recommended", "Most common"). */
export const badge = (tone: BadgeTone = 'blue') =>
  cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1', BADGE_TONES[tone])

type IconType = ComponentType<{ className?: string }>

/** Solid icon badge beside a card title, like the dashboard cards. */
export function TitleBadge({ Icon, color = 'bg-blue-600' }: { Icon: IconType; color?: string }) {
  return (
    <span
      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)]', color)}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  )
}

/** Round tinted icon chip, like the ones in the dashboard's plan widget. */
export function IconChip({ Icon, tone = 'blue', small }: { Icon: IconType; tone?: BadgeTone; small?: boolean }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full ring-1', small ? 'h-7 w-7' : 'h-9 w-9', BADGE_TONES[tone])} aria-hidden>
      <Icon className={small ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'} />
    </span>
  )
}

/** Step title and one-line explanation, set like the dashboard's page header. */
export function StepHeader({ title, subtitle, aside, className }: { title: ReactNode; subtitle?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className={cn('text-[28px] font-bold leading-tight', HEADING)}>{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] leading-snug text-text-secondary">{subtitle}</p>}
      </div>
      {aside}
    </header>
  )
}
