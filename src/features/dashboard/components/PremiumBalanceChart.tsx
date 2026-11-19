import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { curveMonotoneX, line as d3Line } from 'd3-shape'
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion'

export type BalancePoint = { value: number }

const PAD = { top: 14, right: 16, bottom: 14, left: 16 }
/** With axes: room on the left for dollar labels */
const PAD_AXES = { top: 10, right: 12, bottom: 6, left: 52 }

/** Round tick step: 1, 2, 2.5 or 5 times a power of ten, giving about three steps across `range` */
function niceStep(range: number): number {
  const raw = Math.max(range, 1) / 3
  const p = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((x) => x >= raw) ?? raw
}
const STROKE_W = 2.5
/** The line's colour runs from warm on the left to the brand blue on the right */
const SWEEP = ['#F59E0B', '#F43F5E', '#A855F7', '#3B82F6']

function buildPoints(
  values: number[],
  innerW: number,
  innerH: number,
  vmin: number,
  vmax: number
): { x: number; y: number }[] {
  const n = values.length
  if (n < 2) return []
  const range = vmax - vmin || 1
  return values.map((v, i) => ({
    x: (i / (n - 1)) * innerW,
    y: innerH - ((v - vmin) / range) * innerH,
  }))
}

function lengthAtX(pathEl: SVGPathElement | null, targetX: number, totalLen: number): number | null {
  if (!pathEl || totalLen <= 0) return null
  let lo = 0
  let hi = totalLen
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2
    const px = pathEl.getPointAtLength(mid).x
    if (Math.abs(px - targetX) < 0.4) return mid
    if (px < targetX) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

type Props = {
  data: BalancePoint[]
  className?: string
  /** When true, grid/area gradient/tooltip match dark surfaces (from `useTheme().resolvedMode`). */
  isDark?: boolean
  /** Draws a dollar axis (round values) and a time axis; `xLabels` has one label per point */
  axes?: { xLabels: string[]; formatY: (v: number) => string }
}

export function PremiumBalanceChart({ data, className = '', isDark = false, axes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measurePathRef = useRef<SVGPathElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const [width, setWidth] = useState(600)
  const [hover, setHover] = useState(false)

  const targetX = useMotionValue(0)
  const smoothX = useSpring(targetX, { stiffness: 280, damping: 34, mass: 0.5 })
  const [smoothXNum, setSmoothXNum] = useState(0)

  useMotionValueEvent(smoothX, 'change', (v) => setSmoothXNum(v))

  const values = useMemo(() => data.map((d) => d.value), [data])
  const minV = useMemo(() => Math.min(...values), [values])
  const maxV = useMemo(() => Math.max(...values), [values])
  const pad = axes ? PAD_AXES : PAD
  // With axes the scale runs between round values, so the labels sit exactly on their gridlines
  const step = niceStep(maxV - minV)
  const vmin = axes ? Math.floor(minV / step) * step : minV - (maxV - minV) * 0.06
  const vmax = axes ? Math.ceil(maxV / step) * step : maxV + (maxV - minV) * 0.06
  const yTicks = axes ? Array.from({ length: Math.round((vmax - vmin) / step) + 1 }, (_, i) => vmin + i * step) : []

  const viewH = axes ? 168 : 120
  const innerW = Math.max(1, width - pad.left - pad.right)
  const innerH = viewH - pad.top - pad.bottom
  const yOf = (v: number) => pad.top + innerH - ((v - vmin) / (vmax - vmin || 1)) * innerH
  // Four evenly spread time labels: first, two in between, last
  const lastIdx = values.length - 1
  const xTicks = axes ? [...new Set([0, Math.round(lastIdx / 3), Math.round((2 * lastIdx) / 3), lastIdx])] : []

  const points = useMemo(
    () => buildPoints(values, innerW, innerH, vmin, vmax),
    [values, innerW, innerH, vmin, vmax]
  )

  const gridStroke = 'var(--chart-grid)'
  const gridStrokeMuted = 'var(--chart-grid-muted)'
  // A warm-to-blue sweep along the line and a soft tint of the same colours under it; the hover guide is a solid dark rule
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const strokeId = `pb-stroke-${uid}`
  const gradId = `pb-fill-${uid}`
  const fadeId = `pb-fade-${uid}`
  const maskId = `pb-mask-${uid}`
  const STROKE = `url(#${strokeId})`
  const END_DOT = SWEEP[SWEEP.length - 1]
  const hoverLineStroke = isDark ? 'rgba(226, 232, 240, 0.7)' : '#0B1533'
  const dotFillCenter = 'var(--surface-card)'

  const linePathD = useMemo(() => {
    if (points.length < 2) return ''
    const gen = d3Line<{ x: number; y: number }>()
      .x((d) => d.x + pad.left)
      .y((d) => d.y + pad.top)
      .curve(curveMonotoneX)
    return gen(points) ?? ''
  }, [points, pad])

  const areaPathD = useMemo(() => {
    if (!linePathD || points.length < 2) return ''
    const bottomY = pad.top + innerH
    return `${linePathD} L ${points[points.length - 1].x + pad.left} ${bottomY} L ${points[0].x + pad.left} ${bottomY} Z`
  }, [linePathD, points, innerH, pad])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 600))
    ro.observe(el)
    setWidth(el.clientWidth || 600)
    return () => ro.disconnect()
  }, [])

  const onMove = useCallback(
    (clientX: number) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * width
      const clamped = Math.max(pad.left, Math.min(width - pad.right, x))
      targetX.set(clamped)
    },
    [width, targetX, pad]
  )

  const [dotPt, setDotPt] = useState<{ x: number; y: number } | null>(null)
  const [tipValue, setTipValue] = useState('')

  useEffect(() => {
    const path = measurePathRef.current
    if (!path || !hover) {
      setDotPt(null)
      setTipValue('')
      return
    }
    const len = path.getTotalLength()
    const s = lengthAtX(path, smoothXNum, len)
    if (s == null) {
      setDotPt(null)
      setTipValue('')
      return
    }
    const pt = path.getPointAtLength(s)
    setDotPt({ x: pt.x, y: pt.y })
    const innerX = smoothXNum - pad.left
    const t = innerX / innerW
    const idx = Math.max(0, Math.min(values.length - 1, t * (values.length - 1)))
    const i0 = Math.floor(idx)
    const i1 = Math.min(values.length - 1, i0 + 1)
    const f = idx - i0
    const v = values[i0] * (1 - f) + values[i1] * f
    const amount = `$${Math.round(v).toLocaleString('en-US')}`
    setTipValue(axes ? `${axes.xLabels[Math.round(idx)] ?? ''} · ${amount}` : amount)
  }, [smoothXNum, hover, innerW, values, pad, axes])

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full select-none ${axes ? 'h-[190px]' : 'h-[120px]'} ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={(e) => {
        setHover(true)
        onMove(e.clientX)
      }}
      onMouseMove={(e) => {
        setHover(true)
        onMove(e.clientX)
      }}
      onMouseLeave={() => {
        setHover(false)
        setDotPt(null)
        setTipValue('')
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={viewH}
        viewBox={`0 0 ${width} ${viewH}`}
        preserveAspectRatio="none"
        className="overflow-visible"
        aria-hidden
      >

        {axes ? (
          yTicks.map((v, i) => (
            <line key={v} x1={pad.left} y1={yOf(v)} x2={width - pad.right} y2={yOf(v)} stroke={i === 0 ? gridStroke : gridStrokeMuted} strokeWidth={1} strokeDasharray={i === 0 ? undefined : '3 5'} opacity={i === 0 ? 0.8 : 0.6} />
          ))
        ) : (
          <>
            <line x1={pad.left} y1={pad.top + innerH} x2={width - pad.right} y2={pad.top + innerH} stroke={gridStroke} strokeWidth={1} />
            <line x1={pad.left} y1={pad.top + innerH * 0.55} x2={width - pad.right} y2={pad.top + innerH * 0.55} stroke={gridStrokeMuted} strokeWidth={1} strokeDasharray="5 7" />
          </>
        )}

        {/* The sweep for the line, and the same colours under it fading out toward the bottom */}
        <defs>
          <linearGradient id={strokeId} x1={pad.left} y1="0" x2={width - pad.right} y2="0" gradientUnits="userSpaceOnUse">
            {SWEEP.map((c, i) => (
              <stop key={c} offset={`${(i / (SWEEP.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </linearGradient>
          <linearGradient id={gradId} x1={pad.left} y1="0" x2={width - pad.right} y2="0" gradientUnits="userSpaceOnUse">
            {SWEEP.map((c, i) => (
              <stop key={c} offset={`${(i / (SWEEP.length - 1)) * 100}%`} stopColor={c} stopOpacity={isDark ? 0.32 : 0.22} />
            ))}
          </linearGradient>
          <linearGradient id={fadeId} x1="0" y1={pad.top} x2="0" y2={pad.top + innerH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={viewH}>
            <rect x={0} y={0} width={width} height={viewH} fill={`url(#${fadeId})`} />
          </mask>
        </defs>
        <motion.path d={areaPathD} fill={`url(#${gradId})`} mask={`url(#${maskId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />

        {/* Invisible path for geometry + hit testing */}
        <path
          ref={measurePathRef}
          d={linePathD}
          fill="none"
          stroke="transparent"
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />

        {/* The line draws itself once, then holds still */}
        <g>
          <motion.path
            d={linePathD}
            fill="none"
            stroke={STROKE}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          />
        </g>

        {/* Today's balance, marked at the end of the line */}
        {points.length > 1 && !hover && (
          <motion.circle
            cx={points[points.length - 1].x + pad.left}
            cy={points[points.length - 1].y + pad.top}
            r={4.5}
            fill={END_DOT}
            stroke={dotFillCenter}
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 20 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        )}

        {hover && dotPt && (
          <>
            {/* A solid guide from the point down to the axis, as in a pinned reading */}
            <line x1={smoothXNum} y1={dotPt.y} x2={smoothXNum} y2={pad.top + innerH} stroke={hoverLineStroke} strokeWidth={1.25} />
            <circle cx={dotPt.x} cy={dotPt.y} r={5} fill={dotFillCenter} stroke={hoverLineStroke} strokeWidth={2} />
          </>
        )}

        <rect
          x={0}
          y={0}
          width={width}
          height={viewH}
          fill="transparent"
          style={{ cursor: hover ? 'crosshair' : 'default' }}
        />
      </svg>

      {axes && (
        <>
          {yTicks.map((v) => (
            <span key={v} className="pointer-events-none absolute left-0 w-[44px] -translate-y-1/2 text-right text-[11px] leading-none tabular-nums text-text-muted" style={{ top: yOf(v) }} aria-hidden>
              {axes.formatY(v)}
            </span>
          ))}
          {xTicks.map((i) => (
            <span
              key={i}
              className="pointer-events-none absolute bottom-0 whitespace-nowrap text-[11px] leading-none text-text-muted transition-opacity duration-150"
              // Steps aside while the hovered month's pill sits over it
              style={{ left: pad.left + (i / Math.max(lastIdx, 1)) * innerW, transform: `translateX(${i === 0 ? '0' : i === lastIdx ? '-100%' : '-50%'})`, opacity: hover && dotPt && Math.abs(pad.left + (i / Math.max(lastIdx, 1)) * innerW - smoothXNum) < 48 ? 0 : 1 }}
              aria-hidden
            >
              {axes.xLabels[i]}
            </span>
          ))}
        </>
      )}

      {hover && tipValue && dotPt && (
        <motion.div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-[#0B1533] px-2.5 py-1 text-[11px] text-white shadow-[0_8px_18px_-8px_rgba(11,21,51,0.6)] dark:bg-white dark:text-[#0B1533]"
          style={{ left: smoothXNum, top: Math.max(0, dotPt.y - 36), x: smoothXNum > width - 90 ? '-100%' : smoothXNum < pad.left + 60 ? '0%' : '-50%' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tipValue.includes(' · ') ? (
            <>
              <span className="text-white/75 dark:text-[#0B1533]/70">{tipValue.split(' · ')[0]} · </span>
              <span className="font-semibold">{tipValue.split(' · ')[1]}</span>
            </>
          ) : (
            <span className="font-semibold">{tipValue}</span>
          )}
        </motion.div>
      )}
      {/* The month under the cursor, lifted onto a white pill over the time axis */}
      {axes && hover && dotPt && (() => {
        const idx = Math.round(((smoothXNum - pad.left) / innerW) * lastIdx)
        const label = axes.xLabels[Math.max(0, Math.min(lastIdx, idx))]
        return label ? (
          <span
            className="pointer-events-none absolute bottom-[-4px] z-10 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold leading-none text-text-primary shadow-[0_4px_10px_-4px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/15"
            style={{ left: smoothXNum, transform: `translateX(${smoothXNum > width - 50 ? '-100%' : smoothXNum < pad.left + 30 ? '0' : '-50%'})` }}
            aria-hidden
          >
            {label}
          </span>
        ) : null
      })()}
    </motion.div>
  )
}
