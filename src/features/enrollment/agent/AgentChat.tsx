import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowUp, Check, ChevronDown, Loader2, PieChart, RotateCw, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Building blocks for the conversational one-click enrolment: assistant messages, user replies and plan steps. */

function Appear({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

export function AgentAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm" aria-hidden>
      <Sparkles className="h-4 w-4" />
    </span>
  )
}

/** A message from the assistant. `card` gives it a full-width body for controls. */
export function AgentMessage({ children, card = false }: { children: React.ReactNode; card?: boolean }) {
  return (
    <Appear className="flex items-start gap-3">
      <AgentAvatar />
      <div
        className={cn(
          'min-w-0 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] text-slate-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
          card ? 'flex-1 p-4 sm:p-5' : 'max-w-[85%] px-4 py-3',
        )}
        style={{ fontSize: '1rem', lineHeight: 1.6 }}
      >
        {children}
      </div>
    </Appear>
  )
}

/** The participant's answer, right-aligned. */
export function UserReply({ children }: { children: React.ReactNode }) {
  return (
    <Appear className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-700 px-4 py-2.5 text-white" style={{ fontSize: '1rem' }}>
        {children}
      </div>
    </Appear>
  )
}

/** Three animated dots while the assistant "thinks". */
export function Typing() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3" role="status" aria-label={t('enrollment.agent.typing')}>
      <AgentAvatar />
      <span className="flex gap-1 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
    </div>
  )
}

export interface PlanTile {
  step: 1 | 2 | 3
  title: string
  headline: string
  detail: string
}

/** The plan at a glance: three tiles side by side. Tapping one opens its settings underneath. */
export function PlanTiles({ tiles, open, onToggle }: { tiles: PlanTile[]; open: number | null; onToggle: (step: 1 | 2 | 3) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {tiles.map((tile, i) => {
        const { Icon, tile: tone } = STEP_STYLE[tile.step]!
        const active = open === tile.step
        return (
          <motion.button
            key={tile.step}
            type="button"
            onClick={() => onToggle(tile.step)}
            aria-expanded={active}
            aria-controls={`plan-panel-${tile.step}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.25 }}
            className={cn(
              'group flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all',
              active
                ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 dark:bg-blue-950/30'
                : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-white dark:border-gray-700 dark:bg-gray-800/40',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tone)} aria-hidden>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', active && 'rotate-180 text-blue-600')} aria-hidden />
            </span>
            <span className="mt-2.5 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tile.title}</span>
            <span className="mt-0.5 text-slate-900 dark:text-white" style={{ fontSize: '1.02rem', lineHeight: 1.35 }}>
              <Rich text={tile.headline} />
            </span>
            <span className="mt-1 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.82rem', lineHeight: 1.35 }}>{tile.detail}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

/** The full settings for one part of the plan, opened from its tile. */
export function PlanPanel({ step, title, onClose, children }: { step: 1 | 2 | 3; title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useTranslation()
  const { Icon, tile } = STEP_STYLE[step]!
  return (
    <motion.section
      id={`plan-panel-${step}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-5"
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-slate-900 dark:text-white" style={{ fontSize: '1rem', fontWeight: 700 }}>
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tile)} aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        <button type="button" onClick={onClose} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-blue-600 px-4 text-[0.9rem] font-semibold text-white hover:bg-blue-700">
          <Check className="h-4 w-4" aria-hidden />
          {t('enrollment.agent.done')}
        </button>
      </div>
      {children}
    </motion.section>
  )
}

/** Each plan step gets its own icon and soft colour, so the three are easy to tell apart at a glance. */
const STEP_STYLE: Record<1 | 2 | 3, { Icon: typeof Wallet; tile: string }> = {
  1: { Icon: Wallet, tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  2: { Icon: TrendingUp, tile: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  3: { Icon: PieChart, tile: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
}

/** Renders `**bold**` segments from translated strings. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

/**
 * Types the text out once, the way a streamed reply arrives. Later changes to `text` (e.g. the summary
 * updating after an edit) show immediately. `**bold**` is kept intact while typing.
 */
export function TypeText({ text, speed = 14, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? Infinity : 0)
  const doneRef = useRef(false)

  // Infinity marks "finished": from then on the full text shows, even if it changes
  const finished = shown === Infinity
  useEffect(() => {
    if (finished) {
      if (!doneRef.current) {
        doneRef.current = true
        onDone?.()
      }
      return
    }
    const id = setTimeout(() => setShown((n) => (n + 3 >= text.length ? Infinity : n + 3)), speed)
    return () => clearTimeout(id)
  }, [shown, finished, text.length, speed, onDone])

  if (finished) return <Rich text={text} />
  let partial = text.slice(0, shown)
  if ((partial.match(/\*\*/g)?.length ?? 0) % 2 === 1) partial += '**'
  return (
    <>
      <span className="sr-only">{text.replace(/\*\*/g, '')}</span>
      <span aria-hidden>
        <Rich text={partial} />
        <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-blue-500 align-middle" />
      </span>
    </>
  )
}

/**
 * The agent's preparation, kept to one line: the step it's on while working, then "Plan ready" with the checks
 * behind a Details toggle. If something fails, the steps and what to do next are shown in full.
 */
export function PrepLog({
  items,
  status,
  errorText,
  onRetry,
}: {
  items: { key: string; label: string; status: 'pending' | 'running' | 'done' | 'error' }[]
  status: 'idle' | 'running' | 'ready' | 'ineligible' | 'error'
  errorText?: string
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const failed = status === 'error' || status === 'ineligible'
  const current = items.find((i) => i.status === 'running')
  const n = items.findIndex((i) => i.status === 'running') + 1

  const list = (
    <ol className="mt-3 space-y-2">
      {items
        .filter((i) => i.status !== 'pending')
        .map((i) => (
          <li key={i.key} className={cn('flex items-start gap-2.5', i.status === 'error' ? 'text-amber-800 dark:text-amber-300' : 'text-gray-700 dark:text-gray-200')} style={{ fontSize: '0.92rem' }}>
            <span className="mt-0.5 shrink-0">
              {i.status === 'done' && <Check className="h-4 w-4 text-green-600" aria-label={t('enrollment.agent.step_done')} />}
              {i.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label={t('enrollment.agent.step_running')} />}
              {i.status === 'error' && <AlertCircle className="h-4 w-4 text-amber-600" aria-label={t('enrollment.agent.step_failed')} />}
            </span>
            <span>
              <Rich text={i.label} />
            </span>
          </li>
        ))}
    </ol>
  )

  return (
    <AgentMessage card={failed}>
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <p className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
          {status === 'ready' ? (
            <Check className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
          ) : failed ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden />
          )}
          <span>
            {status === 'ready' ? (
              <Rich text={t('enrollment.agent.work_ready')} />
            ) : failed ? (
              t('enrollment.agent.work_stopped')
            ) : current ? (
              <>
                <Rich text={current.label} />
                <span className="ml-1.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>
                  {t('enrollment.agent.work_count', { n, total: items.length })}
                </span>
              </>
            ) : (
              t('enrollment.agent.work_title')
            )}
          </span>
        </p>
        {status === 'ready' && (
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-blue-700 hover:underline dark:text-blue-300" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('enrollment.agent.work_details')}
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>
      {(failed || (status === 'ready' && open)) && list}
      {errorText && (
        <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200" style={{ fontSize: '0.92rem' }}>
          <Rich text={errorText} />
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-4 font-semibold text-blue-700 shadow-sm ring-1 ring-amber-200 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-300 dark:ring-amber-900">
              <RotateCw className="h-4 w-4" aria-hidden />
              {t('enrollment.agent.retry')}
            </button>
          )}
        </div>
      )}
    </AgentMessage>
  )
}

/** The agent's shortcuts: the main task first, then the most common follow-ups. */
export function QuickActions({
  label,
  items,
  disabled,
}: {
  label: string
  items: { label: string; Icon: typeof Sparkles; onClick: () => void; primary?: boolean }[]
  disabled?: boolean
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label={label}>
      {items.map(({ label: text, Icon, onClick, primary }) => (
        <button
          key={text}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 transition-colors disabled:opacity-50',
            primary
              ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
              : 'border-slate-200/80 bg-white text-slate-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100',
          )}
          style={{ fontSize: '0.86rem', fontWeight: 600 }}
        >
          <Icon className={cn('h-4 w-4 shrink-0', primary ? 'text-white' : 'text-blue-600 dark:text-blue-400')} aria-hidden />
          {text}
        </button>
      ))}
    </div>
  )
}

/** One-tap replies shown under an assistant message. */
export function Chips({ items, disabled }: { items: { label: string; onClick: () => void }[]; disabled?: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((c) => (
        <button
          key={c.label}
          type="button"
          disabled={disabled}
          onClick={c.onClick}
          className="min-h-[44px] rounded-full border border-slate-200 bg-white px-4 py-2 text-[0.92rem] font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800"
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

/** Where the participant tells the assistant what to change, in their own words. */
export function Composer({ onSend, suggestions = [], disabled }: { onSend: (text: string) => void; suggestions?: string[]; disabled?: boolean }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const send = (text: string) => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setValue('')
  }
  return (
    <div>
      {suggestions.length > 0 && (
      <div className="mb-2 hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => send(s)}
            className="min-h-[40px] shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[0.88rem] text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {s}
          </button>
        ))}
      </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(value)
        }}
        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('enrollment.agent.composer_placeholder')}
          aria-label={t('enrollment.agent.composer_label')}
          className="min-h-[40px] min-w-0 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          aria-label={t('enrollment.agent.send')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  )
}
