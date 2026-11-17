import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { curveLinear, line as d3Line } from 'd3-shape'
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
const STROKE_W = 2.25

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

  const viewH = axes ? 190 : 120
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
  // Brand blue line; the hover guide is a quiet neutral
  const STROKE = isDark ? '#60a5fa' : '#1e40af'
  const fillTop = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(30, 64, 175, 0.12)'
  const gradId = `pb-fill-${useId().replace(/:/g, '')}`
  const hoverLineStroke = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.3)'
  const dotFillCenter = isDark ? 'var(--surface-card)' : 'var(--surface-card)'

  const linePathD = useMemo(() => {
    if (points.length < 2) return ''
    const gen = d3Line<{ x: number; y: number }>()
      .x((d) => d.x + pad.left)
      .y((d) => d.y + pad.top)
      .curve(curveLinear)
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
      className={`relative w-full select-none ${axes ? 'h-[212px]' : 'h-[120px]'} ${className}`}
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

        {/* A soft fill under the line that fades out toward the bottom */}
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} />
            <stop offset="100%" stopColor={fillTop} stopOpacity={0} />
          </linearGradient>
        </defs>
        <motion.path d={areaPathD} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />

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
            r={4}
            fill={STROKE}
            stroke={dotFillCenter}
            strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 20 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        )}

        {hover && dotPt && (
          <>
            <line
              x1={smoothXNum}
              y1={pad.top}
              x2={smoothXNum}
              y2={pad.top + innerH}
              stroke={hoverLineStroke}
              strokeWidth={1}
            />
            <circle cx={dotPt.x} cy={dotPt.y} r={4} fill={STROKE} stroke={dotFillCenter} strokeWidth={1.5} />
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
              className="pointer-events-none absolute bottom-0 whitespace-nowrap text-[11px] leading-none text-text-muted"
              style={{ left: pad.left + (i / Math.max(lastIdx, 1)) * innerW, transform: `translateX(${i === 0 ? '0' : i === lastIdx ? '-100%' : '-50%'})` }}
              aria-hidden
            >
              {axes.xLabels[i]}
            </span>
          ))}
        </>
      )}

      {hover && tipValue && dotPt && (
        <motion.div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border-default bg-surface-card px-2 py-1 text-[11px] shadow-[0_4px_12px_-6px_rgba(11,21,51,0.25)]"
          style={{ left: smoothXNum, top: Math.max(0, dotPt.y - 32), x: smoothXNum > width - 90 ? '-100%' : smoothXNum < pad.left + 60 ? '0%' : '-50%' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tipValue.includes(' · ') ? (
            <>
              <span className="text-text-secondary">{tipValue.split(' · ')[0]} · </span>
              <span className="font-semibold text-[#1e40af] dark:text-blue-300">{tipValue.split(' · ')[1]}</span>
            </>
          ) : (
            <span className="font-semibold text-[#1e40af] dark:text-blue-300">{tipValue}</span>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
