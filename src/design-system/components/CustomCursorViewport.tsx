import { useRef, useEffect, useCallback, type ReactNode } from 'react'
import type { MouseEvent } from 'react'

const LERP = 0.13
const DOT_SIZE = 8
const RING_DEFAULT = 28
const RING_HOVER = 42
const BORDER = 1.5
const CURSOR_COLOR = '#3B3BE8'
/** 12px to the right of the dot: dot radius (4) + 12 gap from dot edge */
const LABEL_OFFSET_X = DOT_SIZE / 2 + 12

function findInteractiveWithLabel(el: Element | null): { interactive: boolean; label: string | null } {
  let node: Element | null = el
  while (node && node !== document.documentElement) {
    const disabled =
      (node instanceof HTMLButtonElement && node.disabled) ||
      (node instanceof HTMLInputElement && node.disabled) ||
      (node instanceof HTMLTextAreaElement && node.disabled) ||
      (node instanceof HTMLSelectElement && node.disabled) ||
      node.getAttribute('aria-disabled') === 'true'

    const hit =
      node.matches(
        'button, a[href], input, textarea, select, [role="slider"], [role="button"], [role="link"]'
      ) && !disabled

    if (hit) {
      const raw = node.getAttribute('data-label')
      return { interactive: true, label: raw?.trim() ? raw.trim() : null }
    }
    node = node.parentElement
  }
  return { interactive: false, label: null }
}

type Props = { children: ReactNode }

/**
 * Custom cursor: #cursor-dot + #cursor-ring inside wrapper; OS cursor hidden.
 * Pure DOM updates for positions; no motion/other cursor libraries.
 */
export function CustomCursorViewport({ children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  const mx = useRef(0)
  const my = useRef(0)
  const rx = useRef(0)
  const ry = useRef(0)
  const hoverInteractive = useRef(false)
  const labelText = useRef<string | null>(null)

  const syncHitTarget = useCallback((clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY)
    const { interactive, label } = findInteractiveWithLabel(hit)
    hoverInteractive.current = interactive
    labelText.current = label

    const labelEl = labelRef.current
    if (labelEl) {
      if (interactive && label) {
        labelEl.textContent = label
        labelEl.style.opacity = '1'
      } else {
        labelEl.textContent = ''
        labelEl.style.opacity = '0'
      }
    }

    const ringEl = ringRef.current
    if (ringEl) {
      const size = interactive ? RING_HOVER : RING_DEFAULT
      ringEl.style.width = `${size}px`
      ringEl.style.height = `${size}px`
    }
  }, [])

  const updateMouseLocal = useCallback((e: MouseEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mx.current = x
    my.current = y

    const dot = dotRef.current
    if (dot) {
      dot.style.left = `${x}px`
      dot.style.top = `${y}px`
    }
    syncHitTarget(e.clientX, e.clientY)
  }, [syncHitTarget])

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      rx.current += (mx.current - rx.current) * LERP
      ry.current += (my.current - ry.current) * LERP

      const ring = ringRef.current
      if (ring) {
        ring.style.left = `${rx.current}px`
        ring.style.top = `${ry.current}px`
      }

      const label = labelRef.current
      if (label && labelText.current && hoverInteractive.current) {
        label.style.left = `${mx.current + LABEL_OFFSET_X}px`
        label.style.top = `${my.current}px`
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const onMouseEnter = useCallback(
    (e: MouseEvent) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mx.current = x
      my.current = y
      rx.current = x
      ry.current = y

      const dot = dotRef.current
      const ring = ringRef.current
      if (dot) {
        dot.style.left = `${x}px`
        dot.style.top = `${y}px`
        dot.style.opacity = '1'
      }
      if (ring) {
        ring.style.left = `${x}px`
        ring.style.top = `${y}px`
        ring.style.opacity = '1'
      }
      syncHitTarget(e.clientX, e.clientY)
    },
    [syncHitTarget]
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const dot = dotRef.current
      const ring = ringRef.current
      if (dot) dot.style.opacity = '1'
      if (ring) ring.style.opacity = '1'
      updateMouseLocal(e)
    },
    [updateMouseLocal]
  )

  const onMouseLeave = useCallback(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    if (dot) dot.style.opacity = '0'
    if (ring) ring.style.opacity = '0'
    if (label) {
      label.textContent = ''
      label.style.opacity = '0'
    }
    hoverInteractive.current = false
    labelText.current = null
    if (ring) {
      ring.style.width = `${RING_DEFAULT}px`
      ring.style.height = `${RING_DEFAULT}px`
    }
  }, [])

  const dotRingStyle = {
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    zIndex: 9999,
    transform: 'translate(-50%, -50%)',
  }

  return (
    <div
      id="custom-cursor-root"
      ref={wrapRef}
      className="relative min-h-0 flex-1 overflow-visible"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <style>{`#custom-cursor-root, #custom-cursor-root * { cursor: none !important; }`}</style>
      {children}

      <div
        id="cursor-dot"
        ref={dotRef}
        style={{
          ...dotRingStyle,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          background: CURSOR_COLOR,
          left: 0,
          top: 0,
          opacity: 0,
          transition: 'width 0.15s, height 0.15s, background 0.15s, opacity 0.2s',
        }}
      />

      <div
        id="cursor-ring"
        ref={ringRef}
        style={{
          ...dotRingStyle,
          width: RING_DEFAULT,
          height: RING_DEFAULT,
          borderRadius: '50%',
          border: `${BORDER}px solid ${CURSOR_COLOR}`,
          background: 'transparent',
          left: 0,
          top: 0,
          opacity: 0,
          boxSizing: 'border-box',
          transition: 'width 0.2s, height 0.2s, border-color 0.15s, opacity 0.2s',
        }}
      />

      <div
        id="cursor-label"
        ref={labelRef}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translateY(-50%)',
          left: 0,
          top: 0,
          fontSize: 11,
          borderRadius: 20,
          color: '#fff',
          background: CURSOR_COLOR,
          padding: '4px 10px',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.15s',
        }}
      />
    </div>
  )
}

export default CustomCursorViewport
