import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, CheckCircle2, ChevronDown, Clock, Mail, Phone, Star, Video, X } from 'lucide-react'
import { supabase } from '@/core/supabase'
import { useDialogA11y } from '@/lib/useDialogA11y'
import { getAppDateLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/cn'
import { AppIcon, ICON_TILE_TONE } from '@/design-system/icons'
import { useSecondPlan } from '@/features/plan/secondPlan'
import { ADVISORS, SLOT_MINUTES, isTaken, isoDate, nextOpenSlots, nextWorkdays, slotLabel, type AdvisorPlan, type DirectoryAdvisor } from './advisorDirectory'

type View = 'list' | 'book' | 'success'
type MeetingType = 'video' | 'phone'
interface Slot { day: Date; minutes: number }

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const PRIMARY = `inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`
const LABEL = 'mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-secondary'
/** A choice chip: blue when picked, outlined otherwise, greyed and crossed out when it can't be picked */
const chip = (on: boolean, off = false) =>
  cn(
    'rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors',
    FOCUS,
    off
      ? 'cursor-not-allowed bg-slate-50 text-slate-400 line-through ring-1 ring-slate-100 dark:bg-white/[0.03] dark:text-slate-500 dark:ring-white/5'
      : on
        ? 'bg-blue-600 text-white ring-1 ring-blue-600'
        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-blue-400 hover:text-blue-700 dark:bg-white/5 dark:text-slate-200 dark:ring-white/15 dark:hover:text-blue-300',
  )

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('')

function Avatar({ advisor, size = 'md' }: { advisor: DirectoryAdvisor; size?: 'md' | 'sm' }) {
  const tone = advisor.plans.length > 1 ? ICON_TILE_TONE.violet : advisor.plans[0] === '457b' ? ICON_TILE_TONE.amber : ICON_TILE_TONE.blue
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full font-bold', tone, size === 'md' ? 'h-12 w-12 text-[15px]' : 'h-10 w-10 text-[13px]')} aria-hidden>
      {initials(advisor.name)}
    </span>
  )
}

function PlanTags({ plans }: { plans: AdvisorPlan[] }) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-wrap gap-1.5">
      {plans.map((p) => (
        <span key={p} className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', p === '401k' ? 'bg-blue-50 text-blue-800 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20' : 'bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20')}>
          {t(`advisor_modal.plan_tag_${p}`)}
        </span>
      ))}
    </span>
  )
}

// ─── List: advisors for your plans, each with their next free times ─────────────

function AdvisorList({ advisors, myPlans, onBook }: { advisors: DirectoryAdvisor[]; myPlans: AdvisorPlan[]; onBook: (a: DirectoryAdvisor, slot?: Slot, plan?: AdvisorPlan) => void }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const [filter, setFilter] = useState<AdvisorPlan | 'all'>('all')
  /** The card whose day-and-time picker is open, and the day picked in it */
  const [openId, setOpenId] = useState<string | null>(null)
  const [pickDay, setPickDay] = useState<Date | null>(null)
  const days = useMemo(() => nextWorkdays(5), [])
  const shown = advisors.filter((a) => (filter === 'all' ? a.plans.some((p) => myPlans.includes(p)) : a.plans.includes(filter)))
  const plan = filter === 'all' ? undefined : filter
  const dayLabel = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short' })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-text-secondary">
          {myPlans.length > 1
            ? t('advisor_modal.intro_two', { a: t('advisor_modal.plan_tag_401k'), b: t('advisor_modal.plan_tag_457b') })
            : t('advisor_modal.intro_one', { plan: t(`advisor_modal.plan_tag_${myPlans[0]}`) })}
        </p>
        {/* Two plans: narrow the list to one, in a single short row */}
        {myPlans.length > 1 && (
          <div role="group" aria-label={t('advisor_modal.filter_label')} className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]">
            {(['all', ...myPlans] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn('h-8 rounded-full px-3 text-[12px] font-semibold transition-colors', FOCUS, filter === f ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white')}
              >
                {f === 'all' ? t('advisor_modal.filter_all') : t(`advisor_modal.plan_tag_${f}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-text-secondary">{t('advisor_modal.empty')}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {shown.map((a) => (
            <li key={a.id} className={cn('rounded-2xl bg-surface-card p-3.5 shadow-[0_6px_18px_-14px_rgba(11,21,51,0.45)] ring-1 transition-shadow hover:shadow-[0_10px_24px_-14px_rgba(11,21,51,0.5)]', openId === a.id ? 'ring-blue-300 dark:ring-blue-400/40' : 'ring-slate-200 dark:ring-white/10')}>
              {/* Who: name and rating, role and years, the plans they cover */}
              <div className="flex items-center gap-3">
                <Avatar advisor={a} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[15px] font-bold text-text-primary">
                    <span className="truncate">{a.name}</span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-text-secondary">
                      <AppIcon icon={Star} size="inline" className="text-amber-500 dark:text-amber-300" />
                      {a.rating}
                    </span>
                  </p>
                  <p className="truncate text-[12px] text-text-secondary">{t('advisor_modal.role_line', { title: t(`advisor_modal.dir.${a.id}.title`), years: a.years })}</p>
                  {/* Phones: the tags go under the role, so the name keeps its room */}
                  <span className="mt-1.5 flex sm:hidden"><PlanTags plans={a.plans} /></span>
                </div>
                <span className="hidden sm:flex"><PlanTags plans={a.plans} /></span>
              </div>
              {/* When: the next two free times, one tap books; or every time */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {nextOpenSlots(a.id, 2).map((sl) => (
                  <button
                    key={`${isoDate(sl.day)}-${sl.minutes}`}
                    type="button"
                    onClick={() => onBook(a, sl, plan)}
                    className={cn('inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:text-blue-700 hover:ring-blue-400 dark:bg-white/5 dark:text-slate-200 dark:ring-white/15', FOCUS)}
                  >
                    <AppIcon icon={Clock} size="inline" className="text-text-secondary" />
                    {t('advisor_modal.slot_short', { day: dayLabel(sl.day), time: slotLabel(sl.minutes, locale) })}
                  </button>
                ))}
                <button
                  type="button"
                  aria-expanded={openId === a.id}
                  aria-controls={`times-${a.id}`}
                  onClick={() => {
                    const opening = openId !== a.id
                    setOpenId(opening ? a.id : null)
                    setPickDay(opening ? (days.find((d) => SLOT_MINUTES.some((m) => !isTaken(a.id, d, m))) ?? days[0]) : null)
                  }}
                  className={cn('ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2 text-[13px] font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10', FOCUS)}
                >
                  {openId === a.id ? t('advisor_modal.hide_times') : t('advisor_modal.other_time')}
                  <AppIcon icon={ChevronDown} size="inline" className={cn('transition-transform motion-reduce:transition-none', openId === a.id && 'rotate-180')} />
                </button>
              </div>

              {/* Another day or time, right here: pick a day, then a time, and it goes straight to confirm */}
              {openId === a.id && pickDay && (
                <div id={`times-${a.id}`} className="mt-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                  <div role="group" aria-label={t('advisor_modal.select_date')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
                    {days.map((d) => {
                      const free = SLOT_MINUTES.filter((m) => !isTaken(a.id, d, m)).length
                      const on = isoDate(d) === isoDate(pickDay)
                      return (
                        <button
                          key={isoDate(d)}
                          type="button"
                          aria-pressed={on}
                          disabled={free === 0}
                          onClick={() => setPickDay(d)}
                          className={cn(chip(on, free === 0), 'min-w-[68px] shrink-0 px-2.5 py-1.5 text-center leading-tight focus-visible:ring-inset focus-visible:ring-offset-0', on && 'focus-visible:ring-white/70')}
                        >
                          <span className="block text-[12px]">{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                          <span className="block text-[11px] font-medium opacity-80">{d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div role="group" aria-label={t('advisor_modal.select_time')} className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {SLOT_MINUTES.filter((m) => !isTaken(a.id, pickDay, m)).map((m) => (
                      <button key={m} type="button" onClick={() => onBook(a, { day: pickDay, minutes: m }, plan)} className={cn(chip(false), 'px-2 py-1.5 text-[12px]')}>
                        {slotLabel(m, locale)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Booking: this advisor's own days and times, and what the call is about ──────

function BookingForm({ advisor, myPlans, preset, planHint, onSuccess }: { advisor: DirectoryAdvisor; myPlans: AdvisorPlan[]; preset?: Slot; planHint?: AdvisorPlan; onSuccess: (slot: Slot, type: MeetingType, plan: AdvisorPlan) => void }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const days = useMemo(() => nextWorkdays(7), [])
  const plans = advisor.plans.filter((p) => myPlans.includes(p))
  const firstOpen = useMemo(() => nextOpenSlots(advisor.id, 1)[0], [advisor.id])
  const [day, setDay] = useState<Date>(preset?.day ?? firstOpen?.day ?? days[0])
  const [minutes, setMinutes] = useState<number | null>(preset?.minutes ?? null)
  // The plan you were browsing for, if you narrowed the list to one
  const [plan, setPlan] = useState<AdvisorPlan>(planHint && plans.includes(planHint) ? planHint : (plans[0] ?? advisor.plans[0]))
  const [meetingType, setMeetingType] = useState<MeetingType>('video')
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const dayLabel = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  const openOn = (d: Date) => SLOT_MINUTES.filter((m) => !isTaken(advisor.id, d, m)).length

  const confirm = async () => {
    if (minutes === null) {
      setError(t('advisor_modal.err_time'))
      return
    }
    setError('')
    setSubmitting(true)
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase.from('advisor_bookings').insert({
        user_id: user?.id,
        advisor_id: advisor.id,
        booking_date: isoDate(day),
        booking_time: slotLabel(minutes, 'en-US'),
        meeting_type: meetingType,
        topic: [t(`advisor_modal.plan_${plan}`), topic].filter(Boolean).join(': ') || null,
        status: 'confirmed',
      })
      if (insertError) {
        setError(t('advisor_modal.err_save'))
        setSubmitting(false)
        return
      }
    }
    setSubmitting(false)
    onSuccess({ day, minutes }, meetingType, plan)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.05]">
        <Avatar advisor={advisor} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-text-primary">{advisor.name}</p>
          <p className="text-[12px] text-text-secondary">{t(`advisor_modal.dir.${advisor.id}.title`)}</p>
        </div>
        <PlanTags plans={advisor.plans} />
      </div>

      {/* Which plan the call is about, when the advisor covers more than one of yours */}
      {plans.length > 1 && (
        <div>
          <p className={LABEL}>{t('advisor_modal.select_plan')}</p>
          <div className="flex flex-wrap gap-2">
            {plans.map((p) => (
              <button key={p} type="button" aria-pressed={plan === p} onClick={() => setPlan(p)} className={chip(plan === p)}>
                {t(`advisor_modal.plan_${p}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={LABEL}>{t('advisor_modal.select_date')}</p>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => {
            const free = openOn(d)
            const on = isoDate(d) === isoDate(day)
            return (
              <button
                key={isoDate(d)}
                type="button"
                aria-pressed={on}
                disabled={free === 0}
                onClick={() => {
                  setDay(d)
                  setMinutes(null)
                }}
                className={cn(chip(on, free === 0), 'flex flex-col items-start leading-tight')}
              >
                <span>{dayLabel(d)}</span>
                <span className={cn('text-[11px] font-medium', on ? 'text-white/85' : 'text-text-secondary')}>{t('advisor_modal.open_count', { count: free })}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* This advisor's times that day: booked ones are shown but can't be picked */}
      <div>
        <p className={LABEL}>{t('advisor_modal.select_time')}</p>
        <div role="group" aria-label={t('advisor_modal.select_time')} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SLOT_MINUTES.map((m) => {
            const taken = isTaken(advisor.id, day, m)
            const label = slotLabel(m, locale)
            return (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                disabled={taken}
                aria-label={taken ? t('advisor_modal.slot_taken', { time: label }) : label}
                onClick={() => {
                  setMinutes(m)
                  setError('')
                }}
                className={chip(minutes === m, taken)}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[12px] text-text-secondary">{t('advisor_modal.time_note')}</p>
      </div>

      <div>
        <p className={LABEL}>{t('advisor_modal.meeting_type')}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['video', 'phone'] as MeetingType[]).map((type) => (
            <button key={type} type="button" aria-pressed={meetingType === type} onClick={() => setMeetingType(type)} className={cn(chip(meetingType === type), 'inline-flex items-center justify-center gap-1.5')}>
              <AppIcon icon={type === 'video' ? Video : Phone} size="inline" />
              {t(`advisor_modal.${type}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="advisor-topic" className={cn(LABEL, 'block')}>{t('advisor_modal.topic')}</label>
        <textarea
          id="advisor-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t('advisor_modal.topic_ph')}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

      <button type="button" onClick={() => void confirm()} disabled={submitting || minutes === null} className={PRIMARY}>
        {submitting ? t('advisor_modal.confirming') : minutes === null ? t('advisor_modal.confirm') : t('advisor_modal.confirm_at', { day: dayLabel(day), time: slotLabel(minutes, locale) })}
      </button>
    </div>
  )
}

// ─── Confirmed ──────────────────────────────────────────────────────────────────

function BookingSuccess({ advisor, slot, meetingType, plan, onClose }: { advisor: DirectoryAdvisor; slot: Slot; meetingType: MeetingType; plan: AdvisorPlan; onClose: () => void }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const when = slot.day.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col items-center px-2 py-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
        <AppIcon icon={CheckCircle2} size="nav" />
      </span>
      <h3 className="text-[22px] font-bold text-text-primary">{t('advisor_modal.done_title')}</h3>
      <p className="mt-1.5 text-[14px] text-text-secondary">
        <Trans i18nKey="advisor_modal.done_body" values={{ name: advisor.name }} components={{ b: <span className="font-semibold text-text-primary" /> }} />
      </p>
      <ul className="mt-5 w-full space-y-3 rounded-2xl bg-slate-50 p-4 text-left text-[14px] dark:bg-white/[0.05]">
        <li className="flex items-center gap-3 text-text-primary">
          <AppIcon icon={Calendar} className="text-text-secondary" />
          {t('advisor_modal.done_when', { date: when, time: slotLabel(slot.minutes, locale) })}
        </li>
        <li className="flex items-center gap-3 text-text-primary">
          <AppIcon icon={meetingType === 'video' ? Video : Phone} className="text-text-secondary" />
          {t(`advisor_modal.done_type_${meetingType}`)}
        </li>
        <li className="flex items-center gap-3 text-text-primary">
          <AppIcon icon={CheckCircle2} className="text-text-secondary" />
          {t('advisor_modal.done_plan', { plan: t(`advisor_modal.plan_${plan}`) })}
        </li>
        <li className="flex items-center gap-3 text-text-secondary">
          <AppIcon icon={Mail} />
          {t('advisor_modal.done_email')}
        </li>
      </ul>
      <button type="button" onClick={onClose} className={cn(PRIMARY, 'mt-6')}>{t('advisor_modal.done')}</button>
    </div>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────────

/** Book a call with an advisor for your plans: the list shows only advisors who cover a plan you have, with their open times. */
export default function AdvisorModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)
  const secondPlan = useSecondPlan()
  const myPlans: AdvisorPlan[] = secondPlan ? ['401k', '457b'] : ['401k']
  const [view, setView] = useState<View>('list')
  const [advisor, setAdvisor] = useState<DirectoryAdvisor | null>(null)
  const [preset, setPreset] = useState<Slot | undefined>()
  const [planHint, setPlanHint] = useState<AdvisorPlan | undefined>()
  const [booked, setBooked] = useState<{ slot: Slot; type: MeetingType; plan: AdvisorPlan } | null>(null)

  // The confirmation names itself in the body, so the header keeps the step's name
  // The page behind stays still while the window is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const title = view === 'list' ? t('advisor_modal.title_list') : t('advisor_modal.title_book')

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-app-blocking-overlay
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dark:bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] bg-surface-card shadow-2xl ring-1 ring-slate-200/70 dark:ring-white/10">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            {view === 'book' && (
              <button type="button" onClick={() => setView('list')} aria-label={t('advisor_modal.back')} className={cn('flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-slate-100 dark:hover:bg-white/10', FOCUS)}>
                <AppIcon icon={ArrowLeft} />
              </button>
            )}
            <h2 className="text-[18px] font-bold text-text-primary">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('advisor_modal.close')} className={cn('flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-slate-100 dark:hover:bg-white/10', FOCUS)}>
            <AppIcon icon={X} />
          </button>
        </div>

        <div className={cn('flex-1 overflow-y-auto px-6 py-5', view === 'list' && 'bg-slate-50 dark:bg-white/[0.02]')}>
          {view === 'list' && (
            <AdvisorList
              advisors={ADVISORS}
              myPlans={myPlans}
              onBook={(a, slot, plan) => {
                setAdvisor(a)
                setPreset(slot)
                setPlanHint(plan)
                setView('book')
              }}
            />
          )}
          {view === 'book' && advisor && (
            <BookingForm
              key={`${advisor.id}-${preset ? isoDate(preset.day) + preset.minutes : 'open'}`}
              advisor={advisor}
              myPlans={myPlans}
              preset={preset}
              planHint={planHint}
              onSuccess={(slot, type, plan) => {
                setBooked({ slot, type, plan })
                setView('success')
              }}
            />
          )}
          {view === 'success' && advisor && booked && <BookingSuccess advisor={advisor} slot={booked.slot} meetingType={booked.type} plan={booked.plan} onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
