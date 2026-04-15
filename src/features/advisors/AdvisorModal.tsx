import { useEffect, useState } from 'react'
import {
  X,
  ArrowLeft,
  Star,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Video,
  Mail,
} from 'lucide-react'
import { supabase } from '@/core/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Advisor {
  id: string
  name: string
  title: string
  specialization: string
  years_experience: number
  rating: number
  bio: string | null
  available: boolean
}

type View = 'list' | 'book' | 'success'
type MeetingType = 'video' | 'phone'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

function getNextSevenWorkdays(): Date[] {
  const days: Date[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1) // start from tomorrow
  while (days.length < 7) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AdvisorList({
  advisors,
  loading,
  onSelect,
}: {
  advisors: Advisor[]
  loading: boolean
  onSelect: (a: Advisor) => void
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  if (advisors.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        No advisors available at this time.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {advisors.map((advisor) => (
        <div
          key={advisor.id}
          className="group cursor-pointer rounded-2xl border border-gray-100 p-4 transition-all hover:border-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-light)] dark:border-gray-800 dark:hover:border-[color:var(--brand-primary)]"
          onClick={() => onSelect(advisor)}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {advisor.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 truncate dark:text-white">{advisor.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {advisor.rating}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{advisor.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {advisor.specialization} · {advisor.years_experience} yrs exp
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--brand-primary)]" />
          </div>
          {advisor.bio && (
            <p className="mt-3 line-clamp-2 text-xs text-gray-400">{advisor.bio}</p>
          )}
          <button
            type="button"
            className="btn-brand mt-3 w-full rounded-xl py-2 text-xs font-semibold"
          >
            Book a Session
          </button>
        </div>
      ))}
    </div>
  )
}

function BookingForm({
  advisor,
  onSuccess,
}: {
  advisor: Advisor
  onSuccess: (date: Date, time: string, type: MeetingType) => void
}) {
  const workdays = getNextSevenWorkdays()
  const [selectedDate, setSelectedDate] = useState<Date>(workdays[0])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [meetingType, setMeetingType] = useState<MeetingType>('video')
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!selectedTime) {
      setError('Please select a time slot.')
      return
    }
    setError('')
    setSubmitting(true)

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase.from('advisor_bookings').insert({
        user_id: user?.id,
        advisor_id: advisor.id,
        booking_date: toISODate(selectedDate),
        booking_time: selectedTime,
        meeting_type: meetingType,
        topic: topic || null,
        status: 'confirmed',
      })
      if (insertError) {
        console.error('[AdvisorModal] booking insert failed:', insertError.message, insertError)
        setError('Failed to confirm booking. Please try again.')
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    onSuccess(selectedDate, selectedTime!, meetingType)
  }

  return (
    <div className="space-y-5">
      {/* Advisor mini card */}
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {advisor.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{advisor.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{advisor.title}</p>
        </div>
      </div>

      {/* Date chips */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Select Date
        </p>
        <div className="flex flex-wrap gap-2">
          {workdays.map((d) => {
            const active = toISODate(d) === toISODate(selectedDate)
            return (
              <button
                key={toISODate(d)}
                type="button"
                onClick={() => setSelectedDate(d)}
                className="rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                style={
                  active
                    ? { backgroundColor: 'var(--brand-primary)', color: '#fff' }
                    : undefined
                }
                {...(!active && {
                  className:
                    'rounded-xl px-3 py-2 text-xs font-semibold transition-all border border-gray-200 text-gray-700 hover:border-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)] dark:border-gray-700 dark:text-gray-300',
                })}
              >
                {formatDate(d)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Select Time
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((t) => {
            const active = t === selectedTime
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTime(t)}
                className="rounded-xl py-2 text-xs font-semibold transition-all"
                style={
                  active
                    ? { backgroundColor: 'var(--brand-primary)', color: '#fff' }
                    : undefined
                }
                {...(!active && {
                  className:
                    'rounded-xl py-2 text-xs font-semibold transition-all border border-gray-200 text-gray-700 hover:border-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)] dark:border-gray-700 dark:text-gray-300',
                })}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Meeting type */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Meeting Type
        </p>
        <div className="flex gap-2">
          {(['video', 'phone'] as MeetingType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMeetingType(type)}
              className="flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-all"
              style={
                meetingType === type
                  ? { backgroundColor: 'var(--brand-primary)', color: '#fff' }
                  : undefined
              }
              {...(meetingType !== type && {
                className:
                  'flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-all border border-gray-200 text-gray-700 hover:border-[color:var(--brand-primary)] dark:border-gray-700 dark:text-gray-300',
              })}
            >
              {type} Call
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Topic (optional)
        </p>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What would you like to discuss?"
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary-ring)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={submitting || !selectedTime}
        className="btn-brand w-full rounded-xl py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Confirming…
          </span>
        ) : (
          'Confirm Booking'
        )}
      </button>
    </div>
  )
}

function BookingSuccess({
  advisor,
  selectedDate,
  selectedTime,
  meetingType,
  onClose,
}: {
  advisor: Advisor
  selectedDate: Date
  selectedTime: string
  meetingType: MeetingType
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-100 bg-green-50">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Booking Confirmed!</h2>
      <p className="mb-6 text-gray-500 dark:text-gray-400">
        Your session with{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{advisor.name}</span> is scheduled.
      </p>

      <div className="mb-6 w-full space-y-3 rounded-2xl bg-gray-50 p-4 text-left dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(selectedDate)} at {selectedTime}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Video className="h-4 w-4 text-gray-400" />
          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
            {meetingType} Call · 30 minutes
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Confirmation sent to your email
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-brand w-full rounded-xl py-3 font-semibold"
      >
        Done
      </button>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AdvisorModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('list')
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(true)
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null)
  const [bookedDate, setBookedDate] = useState<Date | null>(null)
  const [bookedTime, setBookedTime] = useState<string | null>(null)
  const [bookedMeetingType, setBookedMeetingType] = useState<MeetingType>('video')

  useEffect(() => {
    if (!supabase) {
      setAdvisors([
        { id: '1', name: 'Sarah Jenkins', title: 'Certified Financial Planner', specialization: 'Retirement Planning', years_experience: 12, rating: 4.9, bio: 'Specializes in 401(k) optimization and retirement income strategies.', available: true },
        { id: '2', name: 'Marcus Chen', title: 'Wealth Management Advisor', specialization: 'Investment Strategy', years_experience: 8, rating: 4.7, bio: 'Focuses on portfolio diversification and long-term growth strategies.', available: true },
        { id: '3', name: 'Priya Patel', title: 'Retirement Income Specialist', specialization: 'Income Planning', years_experience: 10, rating: 4.8, bio: 'Expert in sustainable withdrawal strategies and tax-efficient retirement income.', available: true },
      ])
      setLoadingAdvisors(false)
      return
    }
    void supabase
      .from('advisors')
      .select('*')
      .eq('available', true)
      .then(({ data, error }) => {
        if (error) console.error('[AdvisorModal] fetch advisors:', error.message)
        setAdvisors((data as Advisor[]) ?? [])
        setLoadingAdvisors(false)
      })
  }, [])

  const handleSelectAdvisor = (advisor: Advisor) => {
    setSelectedAdvisor(advisor)
    setView('book')
  }

  const handleBookingSuccess = (date: Date, time: string, type: MeetingType) => {
    setBookedDate(date)
    setBookedTime(time)
    setBookedMeetingType(type)
    setView('success')
  }

  const goBack = () => {
    if (view === 'book') setView('list')
    else if (view === 'success') setView('list')
  }

  const title =
    view === 'list'
      ? 'Available Advisors'
      : view === 'book'
        ? 'Book a Session'
        : 'Booking Confirmed'

  return (
    <div
      data-app-blocking-overlay
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
           style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button
                type="button"
                onClick={goBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {view === 'list' && (
            <AdvisorList
              advisors={advisors}
              loading={loadingAdvisors}
              onSelect={handleSelectAdvisor}
            />
          )}
          {view === 'book' && selectedAdvisor && (
            <BookingForm advisor={selectedAdvisor} onSuccess={handleBookingSuccess} />
          )}
          {view === 'success' && selectedAdvisor && bookedDate && bookedTime && (
            <BookingSuccess
              advisor={selectedAdvisor}
              selectedDate={bookedDate}
              selectedTime={bookedTime}
              meetingType={bookedMeetingType}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
