import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MousePointerClick, Sparkles, TrendingUp, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AgentMark, DrawnCheck } from '@/features/enrollment/flow/core/ui'

const ease = [0.22, 1, 0.36, 1] as const
/** Quick start, soft landing: the column moves promptly and settles gently */
const glide = [0.32, 0.72, 0, 1] as const
const GLIDE_S = 0.6
/** How long a card rests in focus before the column moves down */
const HOLD_MS = 3200
/** Card height */
const CARD_H = 276
/** Crossfade between cards: long enough to be gentle, short enough not to drag */
const FADE_S = 0.7
const soft = [0.4, 0, 0.2, 1] as const

type FeatureKey = 's1' | 's2' | 's3' | 's4'
const FEATURES: { key: FeatureKey; Icon: LucideIcon; tag: boolean }[] = [
  { key: 's1', Icon: TrendingUp, tag: false },
  { key: 's2', Icon: Sparkles, tag: true },
  { key: 's3', Icon: Zap, tag: true },
  { key: 's4', Icon: MousePointerClick, tag: true },
]

/** Savings that compound: each year grows on the last, with small market wobbles */
const GROWTH = Array.from({ length: 12 }, (_, i) => Math.pow(1.24, i) * (1 + (i % 3 === 1 ? -0.035 : i % 3 === 2 ? 0.02 : 0)))

/** Area chart of the projected balance: gridlines, a smooth curve that draws in, and a dot at today's end */
function GrowthChart({ live, reduce }: { live: boolean; reduce: boolean }) {
  const gid = useId().replace(/:/g, '')
  const W = 350
  const H = 52
  const pad = 4
  const max = Math.max(...GROWTH)
  const min = Math.min(...GROWTH)
  const pts = GROWTH.map((v, i) => [pad + (i / (GROWTH.length - 1)) * (W - pad * 2), H - pad - ((v - min) / (max - min)) * (H - pad * 2 - 6)] as const)
  // Smooth curve through the points (Catmull-Rom to Bézier)
  const line = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`
    const [x0, y0] = pts[i - 2] ?? pts[i - 1]
    const [x1, y1] = pts[i - 1]
    const [x3, y3] = pts[i + 1] ?? [x, y]
    const c1 = [x1 + (x - x0) / 6, y1 + (y - y0) / 6]
    const c2 = [x - (x3 - x1) / 6, y - (y3 - y1) / 6]
    return `${d} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x} ${y}`
  }, '')
  const [ex, ey] = pts[pts.length - 1]
  const area = `${line} L${ex} ${H} L${pts[0][0]} ${H} Z`
  const show = live || reduce
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-slate-200 dark:stroke-white/10" strokeDasharray="3 4" strokeWidth="1" />
      ))}
      <motion.path d={area} fill={`url(#fill-${gid})`} initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ delay: show && !reduce ? 0.6 : 0, duration: 0.4 }} />
      <motion.path
        d={line}
        fill="none"
        className="stroke-blue-600 dark:stroke-blue-400"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ delay: show && !reduce ? 0.35 : 0, duration: reduce ? 0 : 0.8, ease: glide, opacity: { delay: show && !reduce ? 0.35 : 0, duration: 0.15 } }}
      />
      <motion.circle cx={ex} cy={ey} r="4" className="fill-blue-600 dark:fill-blue-400" initial={false} animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.4 }} transition={{ delay: show && !reduce ? 1.1 : 0, duration: 0.25 }} />
      {show && !reduce && (
        <motion.circle cx={ex} cy={ey} r="4" className="fill-blue-500/40" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 2.8], opacity: [0.6, 0] }} transition={{ delay: 1.3, duration: 1.4, repeat: Infinity }} />
      )}
    </svg>
  )
}

// ─── The small live visual at the foot of each card ──────────────────────────

function Visual({ k, live, reduce }: { k: FeatureKey; live: boolean; reduce: boolean }) {
  const { t } = useTranslation()
  if (k === 's1') {
    return (
      <GrowthChart live={live} reduce={reduce} />
    )
  }
  if (k === 's2') {
    return (
      <div className="flex items-center gap-2">
        <AgentMark size={28} face working={live} />
        <span className="flex items-center gap-1 rounded-full rounded-bl-sm bg-blue-50 px-3 py-2 ring-1 ring-blue-100 dark:bg-white/5 dark:ring-white/10" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300"
              animate={live && !reduce ? { opacity: [0.3, 1, 0.3], y: [0, -2, 0] } : { opacity: 0.6 }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </div>
    )
  }
  if (k === 's3') {
    return (
      <div className="flex h-[44px] items-end gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400 dark:from-blue-500 dark:to-indigo-300"
            style={{ opacity: 0.4 + i * 0.12 }}
            initial={false}
            animate={{ height: live || reduce ? `${30 + i * 14}%` : '18%' }}
            transition={{ delay: live ? 0.35 + i * 0.06 : 0, duration: 0.4, ease }}
          />
        ))}
      </div>
    )
  }
  // One click: Core AI ticks off the setup
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-slate-600 dark:text-slate-300">
      {(['s4_step1', 's4_step2', 's4_step3'] as const).map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-white transition-colors', live ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')}>
            {live ? <DrawnCheck className="h-3 w-3" delay={0.4 + i * 0.15} /> : null}
          </span>
          {t(`carousel.${s}`)}
        </li>
      ))}
    </ul>
  )
}

// ─── One card in the column ──────────────────────────────────────────────────

function FeatureCard({ k, Icon, tag, focus, reduce }: { k: FeatureKey; Icon: LucideIcon; tag: boolean; focus: boolean; reduce: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white/55 p-5 ring-1 ring-white/60 dark:bg-white/[0.04] dark:ring-white/10">
      {/* The solid "in focus" surface fades in as the card glides to the middle, rather than snapping */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-[24px] bg-white ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-white/10"
        initial={false}
        animate={{ opacity: focus ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : GLIDE_S * 0.75, ease: 'easeOut' }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white" aria-hidden>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{t(`carousel.${k}_chip_label`)}</span>
        </span>
        {tag && <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">{t(`carousel.${k}_title`)}</span>}
      </div>
      <p className="relative mt-3 truncate text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white">{t(`carousel.${k}_chip_value`)}</p>
      <p className="relative mt-1.5 text-[15px] font-semibold text-slate-800 dark:text-slate-100">{t(`carousel.${k}_card_title`)}</p>
      <p className="relative mt-0.5 line-clamp-3 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{t(`carousel.${k}_card_desc`)}</p>
      <div className="relative mt-auto pt-3">
        <Visual k={k} live={focus} reduce={reduce} />
      </div>
    </div>
  )
}

// ─── The column: steps down one card at a time (new cards enter from the top), the middle card in focus ───────

function FeatureColumn() {
  const { t } = useTranslation()
  const reduce = !!useReducedMotion()
  /** Which feature is showing; the cards take turns in one place rather than sliding past */
  const [n, setN] = useState(0)
  /** Rests while the browser tab is in the background, so it doesn't race ahead when you come back */
  const [paused, setPaused] = useState(() => typeof document !== 'undefined' && document.hidden)
  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (paused || reduce) return
    const id = window.setTimeout(() => setN((v) => v + 1), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [n, paused, reduce])

  const len = FEATURES.length
  const i = n % len
  const f = FEATURES[i]

  return (
    <div className="relative flex h-full w-full items-center justify-center" role="region" aria-roledescription="carousel" aria-label={t('carousel.label')}>
      <p className="sr-only" aria-live="polite">{t(`carousel.${f.key}_card_title`)}</p>
      <div className="relative w-[min(390px,86%)]" style={{ height: CARD_H }}>
        {/* A still deck behind the card for depth; it never moves, so the eye stays on the card */}
        <span className="absolute inset-x-6 -bottom-4 top-4 rounded-[24px] bg-white/35 ring-1 ring-white/50 dark:bg-white/[0.03] dark:ring-white/10" aria-hidden />
        <span className="absolute inset-x-3 -bottom-2 top-2 rounded-[24px] bg-white/50 ring-1 ring-white/60 dark:bg-white/[0.05] dark:ring-white/10" aria-hidden />
        <AnimatePresence initial={false}>
          <motion.div
            key={n}
            className="absolute inset-0"
            style={{ willChange: 'transform, opacity' }}
            // In from just above, out just below: a short, soft top-to-bottom drift
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: reduce ? 0 : FADE_S, ease: soft }}
          >
            <FeatureCard k={f.key} Icon={f.Icon} tag={f.tag} focus reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Where you are in the set */}
      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2" aria-hidden>
        {FEATURES.map((x, j) => (
          <span key={x.key} className={cn('w-1.5 rounded-full transition-all duration-500', j === i ? 'h-5 bg-blue-600 dark:bg-blue-400' : 'h-1.5 bg-slate-400/40 dark:bg-white/25')} />
        ))}
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* ── LEFT PANEL — a full-height, softly blue panel with a scrolling column of features (desktop only) ── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%]">
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[linear-gradient(160deg,#EFF5FF_0%,#DCE8FF_45%,#C9DAFF_100%)] border-r border-blue-100 dark:border-white/10 dark:bg-[linear-gradient(160deg,#0B1533_0%,#0F1F4A_50%,#13296B_100%)]">
          {/* Soft blue lights */}
          <span className="pointer-events-none absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-300/40 blur-[110px] dark:bg-blue-600/25" aria-hidden />
          <span className="pointer-events-none absolute -right-20 bottom-0 h-[24rem] w-[24rem] rounded-full bg-indigo-300/40 blur-[110px] dark:bg-indigo-500/20" aria-hidden />

          {/* Heading */}
          <div className="relative z-10 px-10 pt-10">
            <h2 className="text-[28px] font-bold leading-tight text-slate-900 dark:text-white">{t('carousel.s1_title')}</h2>
            <p className="mt-1 max-w-[420px] text-[15px] text-slate-600 dark:text-slate-300">{t('carousel.subtitle')}</p>
          </div>

          {/* Features */}
          <div className="relative z-10 flex-1">
            <FeatureColumn />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto min-h-screen">
        {children}
      </div>
    </div>
  )
}
