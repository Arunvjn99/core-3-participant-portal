import type { CSSProperties, InputHTMLAttributes } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn } from '@/lib/cn'

type RangeSliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'min' | 'max' | 'step' | 'onChange' | 'size'> & {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Fill colour. Defaults to the brand blue. */
  color?: string
  /** `md` for a slider that leads its section, `sm` for sliders stacked in a list. */
  size?: 'md' | 'sm'
  className?: string
}

/** Band height and thumb diameter in px; the gap between them is the coloured rim around the thumb. */
const SIZES = { md: { band: 24, thumb: 18 }, sm: { band: 20, thumb: 14 } }
const TICKS = 25

/**
 * A banded slider: a soft band with tick marks, a fill that fades in from the left and wraps the thumb, and a large
 * white round thumb with a drag icon. The real control is a native range input laid invisibly over the band, so
 * keyboard, touch and screen readers work as usual.
 */
export function RangeSlider({ value, min, max, step = 1, onChange, color = 'var(--color-primary)', size = 'md', className, disabled, ...rest }: RangeSliderProps) {
  const { band, thumb } = SIZES[size]
  const pad = (band - thumb) / 2
  const pct = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0

  return (
    <div
      className={cn('relative w-full touch-none select-none', disabled && 'opacity-50', className)}
      style={{ height: band, '--range-thumb': `${band}px` } as CSSProperties}
    >
      {/* Band and ticks */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/80 dark:bg-white/5 dark:ring-white/10" aria-hidden>
        <div className="absolute inset-y-0 flex items-center justify-between" style={{ left: band / 2, right: band / 2 }}>
          {Array.from({ length: TICKS }, (_, i) => (
            <span key={i} className="h-1.5 w-0.5 rounded-full bg-slate-300 dark:bg-white/20" />
          ))}
        </div>
        {/* Fill: fades in from the left and ends in a round cap that hugs the thumb */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `calc(${band}px + ${pct} * (100% - ${band}px))`,
            background: `linear-gradient(to right, color-mix(in srgb, ${color} 10%, transparent), ${color})`,
          }}
        />
      </div>

      <input
        {...rest}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider-hit peer absolute inset-0 m-0 h-full w-full cursor-grab opacity-0 active:cursor-grabbing disabled:cursor-not-allowed"
      />

      {/* Thumb */}
      <span
        className="pointer-events-none absolute flex items-center justify-center rounded-full bg-white text-slate-400 shadow-[0_3px_8px_-3px_rgba(11,21,51,0.55)] transition-shadow peer-focus-visible:ring-4 peer-focus-visible:ring-blue-300/70 peer-active:shadow-[0_4px_10px_-3px_rgba(11,21,51,0.7)]"
        style={{ width: thumb, height: thumb, top: pad, left: `calc(${pad}px + ${pct} * (100% - ${band}px))` }}
        aria-hidden
      >
        <ChevronsLeftRight style={{ width: thumb * 0.62, height: thumb * 0.62 }} strokeWidth={2.5} />
      </span>
    </div>
  )
}

export default RangeSlider
