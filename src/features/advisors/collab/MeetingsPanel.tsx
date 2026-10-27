import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Phone, Video, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { MeetingTopic, MeetingType } from './collabStore'
import { useAdviser } from './useAdviser'
import { MEETING_SLOTS, nextWorkdays, slotToTimestamp } from './adviser'

const TOPICS: MeetingTopic[] = ['general', 'contribution', 'investments', 'retirement_income']

export function MeetingsPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { upcoming, schedule, cancelMeeting } = useAdviser()

  const [days] = useState(() => nextWorkdays(7, new Date()))
  const [dayIdx, setDayIdx] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [type, setType] = useState<MeetingType>('video')
  const [topic, setTopic] = useState<MeetingTopic>('general')
  const [booked, setBooked] = useState(false)

  const dayLabel = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  const whenLabel = (ms: number) =>
    new Date(ms).toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const taken = new Set(upcoming.map((m) => m.at))
  const slotTime = (s: string) => slotToTimestamp(days[dayIdx], s)

  const book = () => {
    if (!slot) return
    schedule({ at: slotTime(slot), type, topic })
    setSlot(null)
    setBooked(true)
  }

  const chip = (active: boolean) =>
    cn(
      'rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
      active ? 'border-primary bg-primary text-text-inverse' : 'border-border-default bg-surface-card text-text-secondary hover:bg-surface-elevated',
    )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-text-primary">{t('adviser.meetings.upcoming')}</h3>
        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-default py-5 text-center text-[13px] text-text-muted">
            {t('adviser.meetings.none')}
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-card p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-status-info-bg text-primary">
                  {m.type === 'video' ? <Video className="h-4 w-4" aria-hidden /> : <Phone className="h-4 w-4" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text-primary">{whenLabel(m.at)}</p>
                  <p className="text-[12px] text-text-secondary">
                    {t(`adviser.meetings.type_${m.type}`)} · {t(`adviser.meetings.topic_${m.topic}`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cancelMeeting(m.id)}
                  aria-label={`${t('adviser.meetings.cancel')}: ${whenLabel(m.at)}`}
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  {t('adviser.meetings.cancel')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border-default bg-surface-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text-primary">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
          {t('adviser.meetings.book')}
        </h3>

        <p className="mb-1.5 text-[12px] font-medium text-text-secondary">{t('adviser.meetings.pick_day')}</p>
        <div className="flex flex-wrap gap-1.5">
          {days.map((d, i) => (
            <button key={d.toISOString()} type="button" aria-pressed={dayIdx === i} className={chip(dayIdx === i)} onClick={() => { setDayIdx(i); setSlot(null); setBooked(false) }}>
              {dayLabel(d)}
            </button>
          ))}
        </div>

        <p className="mb-1.5 mt-4 text-[12px] font-medium text-text-secondary">{t('adviser.meetings.pick_time')}</p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
          {MEETING_SLOTS.map((s) => (
            <button key={s} type="button" aria-pressed={slot === s} disabled={taken.has(slotTime(s))} className={chip(slot === s)} onClick={() => { setSlot(s); setBooked(false) }}>
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-text-secondary">{t('adviser.meetings.how')}</p>
            <div className="flex gap-1.5" role="radiogroup" aria-label={t('adviser.meetings.how')}>
              {(['video', 'phone'] as const).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={type === v} className={chip(type === v)} onClick={() => setType(v)}>
                  {t(`adviser.meetings.type_${v}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="meeting-topic" className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              {t('adviser.meetings.topic')}
            </label>
            <select
              id="meeting-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as MeetingTopic)}
              className="h-9 w-full rounded-md border border-border-default bg-surface-card px-2 text-[13px] text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {TOPICS.map((v) => (
                <option key={v} value={v}>
                  {t(`adviser.meetings.topic_${v}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!slot}
            onClick={book}
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-text-inverse transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {slot ? t('adviser.meetings.confirm', { when: whenLabel(slotTime(slot)) }) : t('adviser.meetings.select_time')}
          </button>
          {booked && (
            <p role="status" className="text-[12px] font-medium text-status-success">
              {t('adviser.meetings.booked')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
