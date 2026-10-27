import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import { Info, Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { clamp, round2 } from './model'

/**
 * Building blocks for the Core enrollment agent. One type scale (12 / 13 / 14 / 15 / 16 / 28px), one radius scale
 * (8 / 12 / 16 / 20px), slate ink and a single blue accent, so every surface reads as the same product.
 */

/** The agent's mark. While it works, the gradient turns slowly. */
export function AgentMark({ size = 28, working = false }: { size?: number; working?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-flex shrink-0 overflow-hidden rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.9)]" style={{ width: size, height: size }} aria-hidden>
      <motion.span
        className="absolute inset-[-25%] bg-[conic-gradient(from_0deg,#1d4ed8,#3b82f6,#818cf8,#38bdf8,#1d4ed8)]"
        animate={working && !reduce ? { rotate: 360 } : { rotate: 0 }}
        transition={working && !reduce ? { duration: 2.4, ease: 'linear', repeat: Infinity } : { duration: 0.6 }}
      />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.55),transparent_55%)]" />
      <svg viewBox="0 0 24 24" className="relative m-auto" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z" fill="white" />
      </svg>
    </span>
  )
}

/** Text with a soft moving highlight, for whatever the agent is doing right now. */
export function Shimmer({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{children}</span>
  return (
    <motion.span
      className={cn('bg-clip-text text-transparent', className)}
      style={{ backgroundImage: 'linear-gradient(90deg,#64748b 0%,#64748b 35%,#0f172a 50%,#64748b 65%,#64748b 100%)', backgroundSize: '250% 100%', WebkitBackgroundClip: 'text' }}
      animate={{ backgroundPosition: ['100% 0%', '-150% 0%'] }}
      transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
    >
      {children}
    </motion.span>
  )
}

/** A number that glides to its new value when it changes. With `countUp` it starts from zero the first time it's shown. */
export function AnimatedNumber({ value, format, countUp = false, delay = 0 }: { value: number; format: (v: number) => string; countUp?: boolean; delay?: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(countUp && !reduce ? 0 : value)
  const from = useRef(countUp && !reduce ? 0 : value)
  const first = useRef(true)
  useEffect(() => {
    if (reduce) {
      from.current = value
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    const isFirst = first.current
    first.current = false
    const controls = animate(from.current, value, {
      duration: isFirst && countUp ? 1.1 : 0.6,
      delay: isFirst ? delay : 0,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        from.current = v
        setShown(v)
      },
    })
    return () => controls.stop()
  }, [value, reduce, countUp, delay])
  return <span className="tabular-nums">{format(shown)}</span>
}

/** Agent text that arrives word by word the first time it's shown. */
export function StreamText({ text, stream = true, className }: { text: string; stream?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  let i = 0
  return (
    <p className={className}>
      {parts.map((part, pi) => {
        const bold = part.startsWith('**')
        const words = (bold ? part.slice(2, -2) : part).split(/(\s+)/)
        return (
          <span key={pi} className={bold ? 'font-semibold text-slate-900 dark:text-white' : undefined}>
            {words.map((w, wi) => {
              if (/^\s+$/.test(w) || !w) return w
              const d = i++ * 0.022
              return stream && !reduce ? (
                <motion.span key={wi} initial={{ opacity: 0, filter: 'blur(3px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ delay: d, duration: 0.28 }}>
                  {w}
                </motion.span>
              ) : (
                <span key={wi}>{w}</span>
              )
            })}
          </span>
        )
      })}
    </p>
  )
}

export function StatusPill({ tone, children }: { tone: 'blue' | 'amber' | 'green' | 'red'; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const dot = { blue: 'bg-blue-600', amber: 'bg-amber-500', green: 'bg-emerald-500', red: 'bg-red-500' }[tone]
  const ring = {
    blue: 'bg-blue-50 text-blue-800 ring-blue-200/70 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
    green: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900',
    red: 'bg-red-50 text-red-800 ring-red-200/70 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900',
  }[tone]
  return (
    <span className={cn('inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-[12px] font-medium ring-1', ring)}>
      <span className="relative flex h-1.5 w-1.5">
        {tone === 'blue' && !reduce && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', dot)} />}
        <span className={cn('relative h-1.5 w-1.5 rounded-full', dot)} />
      </span>
      {children}
    </span>
  )
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50',
        checked ? 'justify-end bg-blue-600' : 'justify-start bg-slate-300 dark:bg-gray-600',
      )}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.25)]" />
    </button>
  )
}

/** A segmented control with a sliding selection. */
export function Segmented<T extends string | number>({ value, options, onChange, label, size = 'md' }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-gray-800">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 rounded-lg px-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              size === 'sm' ? 'h-8 text-[13px]' : 'h-9 text-[14px]',
              active ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-gray-400',
            )}
          >
            {active && <motion.span layoutId={`seg-${id}`} transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)] dark:bg-gray-900" />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Small selectable pills for quick values. */
export function Pills<T extends string | number>({ value, options, onChange, label }: { value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <motion.button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 rounded-lg border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              active ? 'border-blue-600 bg-blue-600 text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
            )}
          >
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}

export function Stepper({ value, onChange, min, max, step = 1, label, prefix, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; label: string; prefix?: string; suffix?: string }) {
  const { t } = useTranslation()
  const btn = 'flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800 dark:hover:text-white'
  return (
    <div className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-blue-900/40" role="group" aria-label={label}>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(clamp(round2(value - step), min, max))} aria-label={`${t('enrollment.quick.decrease')}: ${label}`}>
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="flex h-full items-center border-x border-slate-200 px-1 dark:border-gray-700">
        {prefix && <span className="pl-1.5 text-[14px] text-slate-400">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (Number.isFinite(n)) onChange(clamp(n, min, max))
          }}
          className="h-full w-12 bg-transparent text-center text-[14px] font-semibold tabular-nums text-slate-900 [appearance:textfield] focus:outline-none dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-1.5 text-[14px] text-slate-400">{suffix}</span>}
      </span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(clamp(round2(value + step), min, max))} aria-label={`${t('enrollment.quick.increase')}: ${label}`}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

/** A short explanation on hover, focus or tap. */
export function InfoTip({ label, text, side = 'top' }: { label: string; text: string; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="group relative inline-flex align-middle" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-gray-200"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-30 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[12px] font-normal leading-[1.5] text-white shadow-xl group-hover:block group-focus-within:block dark:bg-gray-800',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'block' : 'hidden',
        )}
      >
        {text}
      </span>
    </span>
  )
}

/** A side panel on wide screens and a bottom sheet on phones, for focused edits. */
export function Sheet({ open, onClose, title, subtitle, children, footer, wide = false, stacked = false }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; stacked?: boolean }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFirst = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      // Only the panel that holds focus responds, so a stacked panel closes on its own
      if (!panel.current?.contains(document.activeElement)) return
      if (e.key === 'Escape') closeRef.current()
      if (e.key !== 'Tab') return
      const items = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className={cn('fixed inset-0 flex items-end justify-end sm:items-stretch', stacked ? 'z-[80]' : 'z-[70]')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label={t('enrollment.core.close')} onClick={onClose} className="absolute inset-0 cursor-default bg-slate-900/25 backdrop-blur-[2px]" />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduce ? { opacity: 0 } : { x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className={cn('relative flex w-full flex-col rounded-t-[20px] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:m-3 sm:max-h-none sm:rounded-[20px] dark:bg-gray-900', wide ? 'max-h-[94vh] sm:w-[min(980px,calc(100vw-24px))]' : 'max-h-[88vh] sm:w-[440px]')}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-5 dark:border-gray-800">
              <div className="min-w-0">
                <h2 id={titleId} className="text-[16px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-gray-400">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label={t('enrollment.core.close')} className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-gray-800">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** A soft area chart that draws itself in. */
export function Sparkline({ points, height = 64, delay = 0 }: { points: number[]; height?: number; delay?: number }) {
  const reduce = useReducedMotion()
  const gid = useId().replace(/:/g, '')
  if (points.length < 2) return null
  const w = 600
  const max = Math.max(...points) || 1
  const xy = points.map((v, i) => [(i / (points.length - 1)) * w, height - 4 - (v / max) * (height - 10)] as const)
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${height} L0 ${height} Z`
  const [ex, ey] = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block h-16 w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gid})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5, duration: 0.6 }} />
      <motion.path d={line} fill="none" stroke="#2563eb" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      <motion.circle cx={ex} cy={ey} r={4} fill="#2563eb" stroke="white" strokeWidth={2} vectorEffect="non-scaling-stroke" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 1.1, type: 'spring', stiffness: 400, damping: 18 }} />
    </svg>
  )
}

/** A tick that draws itself, for completed work. */
export function DrawnCheck({ className, delay = 0 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <motion.path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay, duration: 0.4, ease: 'easeOut' }} />
    </svg>
  )
}

/** A soft, even glow around the edges of the screen that breathes while the agent is working. */
export function EdgeGlow({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div key="glow" className="pointer-events-none fixed inset-0 z-[65]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} aria-hidden>
          <motion.div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 0 2px rgba(37,99,235,0.55), inset 0 0 18px 2px rgba(37,99,235,0.28), inset 0 0 60px 8px rgba(59,130,246,0.12)' }}
            animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

const CONFETTI = ['#2563eb', '#38bdf8', '#818cf8', '#10b981', '#f59e0b', '#ec4899']

/** A short burst of confetti from a point, once. */
export function Confetti({ pieces = 28 }: { pieces?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2 + (i % 3) * 0.2
        const dist = 70 + ((i * 37) % 60)
        const x = Math.cos(angle) * dist
        const y = Math.sin(angle) * dist * 0.75 - 20
        return (
          <motion.span
            key={i}
            className="absolute block rounded-[2px]"
            style={{ width: i % 2 ? 6 : 4, height: i % 2 ? 10 : 6, background: CONFETTI[i % CONFETTI.length], left: -3, top: -5 }}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
            animate={{ x, y: [0, y, y + 60], opacity: [0, 1, 0], rotate: (i % 2 ? 1 : -1) * (180 + i * 12), scale: 1 }}
            transition={{ duration: 1.4, delay: 0.25 + (i % 6) * 0.02, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] }}
          />
        )
      })}
    </span>
  )
}
