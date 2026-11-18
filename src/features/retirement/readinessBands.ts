/**
 * Readiness bands, shared by the dashboard's Readiness Score card and the Retirement readiness page so both show the
 * same score in the same colours: above 70 is on track (green), 50 to 70 needs attention (amber), under 50 is off
 * track (red). Each band has soft ring shades (close together, so a full ring shows no visible join at the top),
 * a faint track and its status pill.
 */
export const READINESS_BANDS = {
  good: {
    labelKey: 'dashboard.onTrack',
    ring: ['#8FD5A9', '#72C796', '#5DBA86'],
    track: { light: 'rgba(77,175,122,0.13)', dark: 'rgba(111,199,147,0.16)' },
    pill: 'bg-status-success-bg text-status-success',
    panel: 'bg-emerald-50/60 ring-emerald-100/80 dark:bg-emerald-500/10 dark:ring-emerald-400/15',
    accent: 'text-emerald-600 dark:text-emerald-300',
    dot: 'bg-status-success',
  },
  fair: {
    labelKey: 'postDashboard.status_needs_attention',
    ring: ['#F2CF8A', '#EBBE6C', '#E2AE55'],
    track: { light: 'rgba(221,162,74,0.15)', dark: 'rgba(237,190,106,0.16)' },
    pill: 'bg-status-warning-bg text-status-warning',
    panel: 'bg-amber-50/60 ring-amber-100/80 dark:bg-amber-500/10 dark:ring-amber-400/15',
    accent: 'text-amber-600 dark:text-amber-300',
    dot: 'bg-status-warning',
  },
  low: {
    labelKey: 'postDashboard.status_off_track',
    ring: ['#EFAAAA', '#E79393', '#DE7F7F'],
    track: { light: 'rgba(217,115,115,0.13)', dark: 'rgba(233,147,147,0.16)' },
    pill: 'bg-status-danger-bg text-status-danger',
    panel: 'bg-rose-50/60 ring-rose-100/80 dark:bg-rose-500/10 dark:ring-rose-400/15',
    accent: 'text-rose-600 dark:text-rose-300',
    dot: 'bg-status-danger',
  },
} as const
export type ReadinessBand = keyof typeof READINESS_BANDS
/** Lowest score that counts as on track (green) */
export const ON_TRACK_MIN = 71
export const readinessBandOf = (score: number): ReadinessBand => (score >= ON_TRACK_MIN ? 'good' : score >= 50 ? 'fair' : 'low')

/** Readiness ring inside a 148px box: centre, radius and line width */
export const RING_BOX = 148
export const RING_C = 74
export const RING_R = 67
export const RING_W = 13
const ringPoint = (turn: number, r = RING_R) => {
  const angle = turn * 2 * Math.PI - Math.PI / 2
  return `${(RING_C + r * Math.cos(angle)).toFixed(2)} ${(RING_C + r * Math.sin(angle)).toFixed(2)}`
}
/** Short arcs that make up the ring, each a step further from one colour to the other, so the colour runs around it */
export function ringArcs(stops: readonly string[], steps = 72) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  // Blend across the stops in turn, so a middle stop keeps the colour rich half way round
  const mix = (k: number) => {
    const pos = k * (stops.length - 1)
    const at = Math.min(stops.length - 2, Math.floor(pos))
    const f = pos - at
    const [a, b] = [stops[at], stops[at + 1]]
    return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * f)).join(',')})`
  }
  return Array.from({ length: steps }, (_, i) => ({
    // Each arc runs a hair past the next one's start so no seams show
    d: `M${ringPoint(i / steps)} A${RING_R} ${RING_R} 0 0 1 ${ringPoint(Math.min(1, (i + 1.6) / steps))}`,
    color: mix(i / (steps - 1)),
  }))
}
