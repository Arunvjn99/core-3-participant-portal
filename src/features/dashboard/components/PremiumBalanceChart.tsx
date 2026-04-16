import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { curveMonotoneX, line as d3Line } from 'd3-shape'
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion'

export type BalancePoint = { value: number }

const PAD = { top: 14, right: 16, bottom: 14, left: 16 }
const STROKE = '#16A34A'
const STROKE_W = 2.5

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
}

export function PremiumBalanceChart({ data, className = '', isDark = false }: Props) {
  const uid = useId()
  const gradId = `pb-grad-${uid}`
  const blurFilterId = `pb-blur-${uid}`
  const dotGlowId = `pb-dotglow-${uid}`

  const containerRef = useRef<HTMLDivElement>(null)
  const measurePathRef = useRef<SVGPathElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const [width, setWidth] = useState(600)
  const [hover, setHover] = useState(false)
  const [drawDone, setDrawDone] = useState(false)
  const [idle, setIdle] = useState(false)

  const targetX = useMotionValue(0)
  const smoothX = useSpring(targetX, { stiffness: 280, damping: 34, mass: 0.5 })
  const [smoothXNum, setSmoothXNum] = useState(0)

  useMotionValueEvent(smoothX, 'change', (v) => setSmoothXNum(v))

  const values = useMemo(() => data.map((d) => d.value), [data])
  const minV = useMemo(() => Math.min(...values), [values])
  const maxV = useMemo(() => Math.max(...values), [values])
  const vmin = minV - (maxV - minV) * 0.06
  const vmax = maxV + (maxV - minV) * 0.06

  const viewH = 120
  const innerW = Math.max(1, width - PAD.left - PAD.right)
  const innerH = viewH - PAD.top - PAD.bottom

  const points = useMemo(
    () => buildPoints(values, innerW, innerH, vmin, vmax),
    [values, innerW, innerH, vmin, vmax]
  )

  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(17, 24, 39, 0.07)'
  const gridStrokeMuted = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(17, 24, 39, 0.05)'
  const areaGradientTop = isDark ? 'rgba(34, 197, 94, 0.42)' : 'rgba(34, 197, 94, 0.25)'
  const areaGradientMid = isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.12)'
  const hoverLineStroke = isDark ? 'rgba(34, 197, 94, 0.45)' : 'rgba(22, 163, 74, 0.22)'
  const dotFillOuter = isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.14)'
  const dotFillCenter = isDark ? '#111118' : '#ffffff'

  const linePathD = useMemo(() => {
    if (points.length < 2) return ''
    const gen = d3Line<{ x: number; y: number }>()
      .x((d) => d.x + PAD.left)
      .y((d) => d.y + PAD.top)
      .curve(curveMonotoneX)
    return gen(points) ?? ''
  }, [points])

  const areaPathD = useMemo(() => {
    if (!linePathD || points.length < 2) return ''
    const firstX = points[0].x + PAD.left
    const lastX = points[points.length - 1].x + PAD.left
    const bottomY = PAD.top + innerH
    return `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }, [linePathD, points, innerH])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 600))
    ro.observe(el)
    setWidth(el.clientWidth || 600)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDrawDone(true), 920)
    return () => clearTimeout(t)
  }, [linePathD])

  useEffect(() => {
    const t = window.setTimeout(() => setIdle(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const onMove = useCallback(
    (clientX: number) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * width
      const clamped = Math.max(PAD.left, Math.min(width - PAD.right, x))
      targetX.set(clamped)
    },
    [width, targetX]
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
    const innerX = smoothXNum - PAD.left
    const t = innerX / innerW
    const idx = Math.max(0, Math.min(values.length - 1, t * (values.length - 1)))
    const i0 = Math.floor(idx)
    const i1 = Math.min(values.length - 1, i0 + 1)
    const f = idx - i0
    const v = values[i0] * (1 - f) + values[i1] * f
    setTipValue(`$${Math.round(v).toLocaleString('en-US')}`)
  }, [smoothXNum, hover, innerW, values])

  return (
    <motion.div
      ref={containerRef}
      className={`relative h-[120px] w-full select-none ${className}`}
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
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaGradientTop} />
            <stop offset="45%" stopColor={areaGradientMid} />
            <stop offset="100%" stopColor="rgba(34,197,94,0)" />
          </linearGradient>
          <filter id={blurFilterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          </filter>
          <filter id={dotGlowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="g" />
            <feMerge>
              <feMergeNode in="g" />
            </feMerge>
          </filter>
        </defs>

        <line
          x1={PAD.left}
          y1={PAD.top + innerH}
          x2={width - PAD.right}
          y2={PAD.top + innerH}
          stroke={gridStroke}
          strokeWidth={1}
        />
        <line
          x1={PAD.left}
          y1={PAD.top + innerH * 0.55}
          x2={width - PAD.right}
          y2={PAD.top + innerH * 0.55}
          stroke={gridStrokeMuted}
          strokeWidth={1}
          strokeDasharray="5 7"
        />

        <motion.path
          d={areaPathD}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: drawDone ? 1 : 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Glow stroke underlay */}
        <path
          d={linePathD}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_W + 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.12}
          filter={`url(#${blurFilterId})`}
        />

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

        {/* Visible animated stroke + idle breathing */}
        <motion.g
          animate={
            idle
              ? { opacity: [0.92, 1, 0.92] }
              : { opacity: 1 }
          }
          transition={
            idle
              ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        >
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
        </motion.g>

        {hover && dotPt && (
          <>
            <line
              x1={smoothXNum}
              y1={PAD.top}
              x2={smoothXNum}
              y2={PAD.top + innerH}
              stroke={hoverLineStroke}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
            <circle
              cx={dotPt.x}
              cy={dotPt.y}
              r={11}
              fill={dotFillOuter}
              filter={`url(#${dotGlowId})`}
            />
            <circle cx={dotPt.x} cy={dotPt.y} r={7} fill={dotFillCenter} stroke={STROKE} strokeWidth={2.5} />
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

      {hover && tipValue && dotPt && (
        <motion.div
          className={`pointer-events-none absolute z-10 min-w-[4.5rem] rounded-[11px] border px-3 py-2 text-center text-xs font-semibold shadow-card backdrop-blur-[2px] ${
            isDark
              ? 'border-border-default bg-surface-elevated/95 text-text-primary'
              : 'border-border-default bg-white/95 text-text-primary'
          }`}
          style={{
            left: smoothXNum,
            top: 6,
            x: '-50%',
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {tipValue}
        </motion.div>
      )}
    </motion.div>
  )
}
