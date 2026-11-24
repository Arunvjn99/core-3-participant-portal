import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, FlaskConical, MessageSquarePlus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ENV } from '@/lib/constants'
import { useAuth } from '@/core/hooks/useAuth'
import { useFeedbackUiStore } from '@/core/store/feedbackUiStore'
import { AppIcon, ICON_TILE_TONE } from '@/design-system/icons'
import { useDemoStore } from './demoStore'
import { PERSONAS, initials, personaById } from './personas'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

// A tab docked to the right edge: shows its icon, slides its label out on hover or focus
const TAB =
  'group flex h-11 items-center gap-2 rounded-l-full bg-white pl-3.5 pr-3 text-[13px] font-semibold shadow-[0_8px_20px_-12px_rgba(11,21,51,0.45)] ring-1 transition-colors dark:bg-slate-900'
const TAB_LABEL = 'max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100'

/**
 * Prototype tools, docked mid-height on the right edge so they never cover a page's own buttons at the bottom:
 * - Prototype Demo (demo mode only): pick one of five participants to see the portal as they would. On the sign-in
 *   page it signs in as them; inside the portal it switches who you are.
 * - Leave Feedback: opens the feedback form.
 */
export function DemoParticipantPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, signInDemo } = useAuth()
  const personaId = useDemoStore((s) => s.personaId)
  const switchTo = useDemoStore((s) => s.switchTo)
  const restoreOwn = useDemoStore((s) => s.restoreOwn)
  const [open, setOpen] = useState(false)
  const openFeedback = useFeedbackUiStore((s) => s.setModalOpen)
  const feedbackOpen = useFeedbackUiStore((s) => s.modalOpen)
  const box = useRef<HTMLDivElement>(null)

  // Closes on a click outside or Escape
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

  const demo = ENV.LOCAL_DEMO_BYPASS
  if (feedbackOpen) return null

  const pick = (id: string) => {
    switchTo(id)
    if (!user) signInDemo()
    setOpen(false)
    navigate('/dashboard')
  }

  return (
    <div ref={box} className="fixed right-0 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-end gap-2">
      {demo && open && (
        <div role="menu" aria-label={t('demo.list_label')} className="absolute right-[calc(100%+10px)] top-1/2 w-[min(100vw-4.5rem,18.5rem)] -translate-y-1/2 overflow-hidden rounded-2xl bg-surface-card p-1.5 shadow-[0_24px_48px_-20px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/80 dark:ring-white/10">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{t('demo.list_label')}</p>
          {PERSONAS.map((p) => {
            const on = personaById(personaId)?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => pick(p.id)}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5', FOCUS, on && 'bg-slate-50 dark:bg-white/5')}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold', ICON_TILE_TONE[p.tone])} aria-hidden>
                  {initials(p)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-text-primary">{`${p.firstName} ${p.lastName}`}</span>
                  <span className="block text-[12px] text-text-secondary">{t(p.twoPlans ? `demo.status_two_${p.status}` : `demo.status_${p.status}`)}</span>
                </span>
                {on && <AppIcon icon={Check} size="inline" className="text-[#2563EB] dark:text-blue-300" />}
              </button>
            )
          })}
          {personaId && (
            <button
              type="button"
              role="menuitem"
              onClick={restoreOwn}
              className={cn('mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-200/80 px-3 py-2.5 text-left text-[13px] font-semibold text-text-secondary transition-colors hover:bg-slate-50 hover:text-text-primary dark:border-white/10 dark:hover:bg-white/5', FOCUS)}
            >
              <AppIcon icon={RotateCcw} size="inline" />
              {t('demo.own')}
            </button>
          )}
        </div>
      )}
      {demo && (
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t('demo.button_short')}
          title={t('demo.button_short')}
          onClick={() => setOpen((v) => !v)}
          className={cn(TAB, 'text-[#2563EB] ring-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:ring-blue-400/30 dark:hover:bg-slate-800', open && 'bg-blue-50 dark:bg-slate-800', FOCUS)}
        >
          <AppIcon icon={FlaskConical} />
          <span className={cn(TAB_LABEL, open && 'max-w-[220px] opacity-100')}>{user ? t('demo.button_short') : t('demo.button')}</span>
        </button>
      )}
      <button
        type="button"
        aria-label={t('feedback.leave_feedback')}
        title={t('feedback.leave_feedback')}
        onClick={() => {
          setOpen(false)
          openFeedback(true)
        }}
        className={cn(TAB, 'text-text-primary ring-slate-200 hover:bg-slate-50 dark:ring-white/15 dark:hover:bg-slate-800', FOCUS)}
      >
        <AppIcon icon={MessageSquarePlus} />
        <span className={TAB_LABEL}>{t('feedback.leave_feedback')}</span>
      </button>
    </div>
  )
}
