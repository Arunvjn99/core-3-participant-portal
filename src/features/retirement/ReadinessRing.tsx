import { useId, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/core/hooks/useTheme'
import { READINESS_BANDS, readinessBandOf, RING_BOX, RING_C, RING_R, RING_W, ringArcs } from './readinessBands'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * The readiness ring: the score out of 100 in the middle, its band's colour running round the ring up to the score,
 * and a faint track for the rest. The same ring on the dashboard card and the Retirement readiness page.
 */
export function ReadinessRing({ score, className }: { score: number; className?: string }) {
  const { t } = useTranslation()
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'
  const reduceMotion = useReducedMotion()
  const shown = Math.max(0, Math.min(100, Math.round(score)))
  const band = READINESS_BANDS[readinessBandOf(shown)]
  // useId adds characters that break url(#…), so keep letters, digits and dashes only
  const ringId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  // Soft shades of the band's colour run round the ring; a full ring is one even shade, so there is no join at the top
  const full = shown >= 100
  const segments = useMemo(() => ringArcs(full ? [band.ring[1], band.ring[1]] : band.ring), [band, full])

  return (
    <div className={`relative h-[148px] w-[148px] shrink-0 ${className ?? ''}`} role="img" aria-label={`${t('dashboard.readinessScore')}: ${shown}/100, ${t(band.labelKey)}`}>
      <svg viewBox={`0 0 ${RING_BOX} ${RING_BOX}`} className="block h-full w-full overflow-visible" aria-hidden>
        <defs>
          {/* Reveals the coloured ring up to the score; animates on load and whenever the score changes */}
          <mask id={`${ringId}-mask`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={RING_BOX + 20} height={RING_BOX + 20}>
            <motion.circle
              cx={RING_C}
              cy={RING_C}
              r={RING_R}
              fill="none"
              stroke="#fff"
              strokeWidth={RING_W}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_C} ${RING_C})`}
              pathLength={1}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: shown / 100 }}
              transition={{ duration: reduceMotion ? 0 : 1.1, ease }}
            />
          </mask>
        </defs>
        {/* The empty part of the ring: the same colour, faint */}
        <circle cx={RING_C} cy={RING_C} r={RING_R} fill="none" strokeWidth={RING_W} stroke={isDark ? band.track.dark : band.track.light} />
        {/* The colour runs round the ring, light at the top and deeper as it goes */}
        <g mask={`url(#${ringId}-mask)`}>
          {segments.map((seg) => (
            <path key={seg.d} d={seg.d} fill="none" stroke={seg.color} strokeWidth={RING_W} />
          ))}
        </g>
        {/* Rounded start in the starting colour; a full ring has no start to round off */}
        {shown > 0 && !full && <circle cx={RING_C} cy={RING_C - RING_R} r={RING_W / 2} fill={segments[0].color} />}
      </svg>
      {/* Score in the middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[38px] font-medium leading-none tracking-tight tabular-nums text-text-primary">{shown}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{t('postDashboard.readiness_of')}</span>
      </div>
    </div>
  )
}

/** The band's status pill (On track, Needs attention, Off track), shown with the ring. */
export function ReadinessStatus({ score, className }: { score: number; className?: string }) {
  const { t } = useTranslation()
  const band = READINESS_BANDS[readinessBandOf(Math.round(score))]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${band.pill} ${className ?? ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} aria-hidden />
      {t(band.labelKey)}
    </span>
  )
}
