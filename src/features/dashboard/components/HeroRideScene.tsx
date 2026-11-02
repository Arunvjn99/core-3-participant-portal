import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { animate, backOut, easeIn, easeInOut, easeOut, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import type { AnimationPlaybackControls } from 'framer-motion'

/**
 * The story behind the dashboard banner, told as one unbroken shot: bills get paid today, the travel that retirement makes
 * possible, and an easy afternoon at home. Nothing cuts: the card that pays the bills becomes the plane window, and once the
 * plane flies on, that window becomes the round window of the living room, which opens out to show the rest of the room. One clock drives it all,
 * so pausing freezes everything at once. People who prefer less motion see the last scene, still.
 */

const VIEW = { width: 640, height: 340 }
const CENTER = { x: 320, y: 170 }

/** Today: the moments each bill is paid, and when the bills step aside for the card to become a window. */
const PAY = [1.45, 2.15, 2.85]
const CARD_MORPH = { start: 3.25, end: 3.9 }
/** The flight starts as the card finishes turning into the window; its moments below are counted from here. */
const FLIGHT_START = 3.8
const FLIGHT = {
  cabinFrom: 0.4,
  cabinEnd: 1.75,
  shrunk: 2.75,
  pulledOut: 4.3,
  cruiseEnd: 5.1,
  portalStart: 5.1,
  portalOpen: 5.8,
  revealEnd: 7.2,
  end: 9.2,
}
const END = FLIGHT_START + FLIGHT.end

const PILL = { x: 215, y: 20, width: 210, height: 300, rx: 105 }
const WIDE = { x: 20, y: 10, width: 600, height: 320, rx: 30 }
const CARD = { x: 362, y: 222, width: 248, height: 152, rx: 16, rotate: 4 }
/** The white edge of every window in the story. */
const WINDOW_EDGE = 3

// ─── The living room ──────────────────────────────────────────────────────────
/** The illustration, and where things sit in it, in its own pixels. */
const LOUNGE = {
  src: '/media/hero-retirement-lounge.webp',
  width: 1536,
  height: 1024,
  portal: { x: 1025, y: 480, r: 270 },
  mug: { x: 770, y: 556 },
  coin: { x: 1182, y: 698, r: 62 },
  sun: { x: 1075, y: 425 },
}

/** The bar chart card, redrawn over the illustration so it can grow. The man's hair overlaps its corner, so that stays clear. */
const CHART = {
  patch: { x: 538, y: 246, width: 196, height: 172, rx: 10 },
  hair: { x: 728, y: 450, rx: 44, ry: 52 },
  lines: [
    { x: 548, y: 262, width: 106, color: '#C1C6D4' },
    { x: 548, y: 289, width: 64, color: '#C7CCD8' },
  ],
  base: 407,
  bars: [
    { x: 553, width: 23, top: 380, light: '#BCCBEF', dark: '#B4C4E8' },
    { x: 584, width: 25, top: 367, light: '#92C0FE', dark: '#7EB1F6' },
    { x: 618, width: 26, top: 354, light: '#84BCFD', dark: '#62A3F8' },
    { x: 654, width: 27, top: 338, light: '#5FA4FB', dark: '#4588F0' },
    { x: 691, width: 27, top: 315, light: '#438BF8', dark: '#3473E6' },
  ],
  arrow: 'M 574 352 C 622 340 672 322 708.6 272',
  arrowHead: { x: 718, y: 259, points: '0,0 -16.6,8.3 -3,17.7' },
}
/** The ring chart: a blue share and a grey share, drawn on as two arcs. */
const RING = { x: 1240, y: 405, r: 36.5, width: 29, blueEnd: 51, greyEnd: 29, patch: 62 }

function ringArc(endDeg: number, clockwise: boolean) {
  const start = { x: RING.x, y: RING.y - RING.r }
  const angle = (endDeg * Math.PI) / 180
  const end = { x: RING.x + RING.r * Math.cos(angle), y: RING.y + RING.r * Math.sin(angle) }
  const sweep = clockwise ? endDeg + 90 : 270 - endDeg
  return `M ${start.x} ${start.y} A ${RING.r} ${RING.r} 0 ${sweep > 180 ? 1 : 0} ${clockwise ? 1 : 0} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}
/** How the illustration sits in the banner once the room has opened out: its drawn area, centred. */
const LOUNGE_SCALE = 0.52
const LOUNGE_AT = { x: -160.4, y: -86.1 }
const PORTAL_FINAL = { x: LOUNGE_AT.x + LOUNGE.portal.x * LOUNGE_SCALE, y: LOUNGE_AT.y + LOUNGE.portal.y * LOUNGE_SCALE }
/** The room starts a little closer, so it settles back as it opens. */
const PORTAL_ZOOM = 1.15
/** Far enough that the softened edge of the opening is past every corner of the banner. */
const ROOM_OPEN_RADIUS = 650
const STEAM = [-8, 0, 8]

function progress(t: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (t - start) / (end - start)))
}

/** Eases a value from one number to another between two moments on the timeline. */
function between(t: number, start: number, end: number, from: number, to: number, curve: (v: number) => number = easeInOut) {
  return from + (to - from) * curve(progress(t, start, end))
}

/** The same, for scale: a zoom only feels steady when it changes by the same ratio each moment. */
function zoomBetween(t: number, start: number, end: number, from: number, to: number) {
  return Math.exp(between(t, start, end, Math.log(from), Math.log(to)))
}

const linear = (v: number) => v

function starPath(outer: number, inner: number, points: number) {
  const corners = Array.from({ length: points * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI * i) / points - Math.PI / 2
    return `${(radius * Math.cos(angle)).toFixed(1)} ${(radius * Math.sin(angle)).toFixed(1)}`
  })
  return `M ${corners.join(' L ')} Z`
}

/** A paper bill: rounded at the top, torn at the bottom. */
function billPath(w: number, h: number) {
  const left = -w / 2
  const right = w / 2
  const top = -h / 2
  const bottom = h / 2
  const teeth = 7
  const tooth = w / teeth
  let edge = ''
  for (let i = teeth - 1; i >= 0; i--) {
    edge += ` L ${(left + (i + 0.5) * tooth).toFixed(1)} ${bottom - 8} L ${(left + i * tooth).toFixed(1)} ${bottom}`
  }
  return `M ${left + 14} ${top} H ${right - 14} Q ${right} ${top} ${right} ${top + 14} V ${bottom}${edge} V ${top + 14} Q ${left} ${top} ${left + 14} ${top} Z`
}

const softShadow = { filter: 'drop-shadow(0 14px 16px rgba(30,41,99,0.22))' }

const BILLS = [
  { id: 'a', w: 136, h: 164, gradient: 'orange', place: { x: 186, y: 118, rotate: -8 }, cursor: { x: 232, y: 60 } },
  { id: 'b', w: 112, h: 136, gradient: 'yellow', place: { x: 462, y: 92, rotate: 7 }, cursor: { x: 506, y: 44 } },
  { id: 'c', w: 104, h: 124, gradient: 'teal', place: { x: 112, y: 244, rotate: 6 }, cursor: { x: 152, y: 200 } },
]

/** Where the pointer is at each moment while it pays the bills. */
const CURSOR_PATH = [
  { t: 1.0, x: 330, y: 236 },
  { t: 1.3, ...BILLS[0].cursor },
  { t: 1.62, ...BILLS[0].cursor },
  { t: 1.98, ...BILLS[1].cursor },
  { t: 2.32, ...BILLS[1].cursor },
  { t: 2.68, ...BILLS[2].cursor },
  { t: 3.0, ...BILLS[2].cursor },
  { t: 3.2, x: 200, y: 250 },
]

const SPARKLES = [
  { x: 68, y: 128, size: 11, color: '#2F9E9B', delay: 0 },
  { x: 348, y: 28, size: 13, color: '#2B6CB0', delay: 0.5 },
  { x: 590, y: 170, size: 12, color: '#F2B705', delay: 1 },
  { x: 250, y: 318, size: 9, color: '#2F9E9B', delay: 1.4 },
  { x: 404, y: 118, size: 8, color: '#EC6FA9', delay: 0.8 },
  { x: 610, y: 300, size: 8, color: '#7C5BE0', delay: 0.3 },
]

/** Windows along the fuselage, spaced so the one at the origin is where the cabin shrinks to. */
const FUSELAGE_WINDOWS = Array.from({ length: 23 }, (_, i) => -88 + i * 8)
const CLOUDS = [
  { x: 120, y: 70, scale: 1, speed: 26 },
  { x: 420, y: 56, scale: 0.7, speed: 18 },
  { x: 560, y: 150, scale: 1.2, speed: 34 },
  { x: 250, y: 262, scale: 1.3, speed: 42 },
  { x: 500, y: 284, scale: 0.9, speed: 30 },
]

function Sparkle({ size }: { size: number }) {
  return <path d={`M 0 ${-size} Q 1.5 -1.5 ${size} 0 Q 1.5 1.5 0 ${size} Q -1.5 1.5 ${-size} 0 Q -1.5 -1.5 0 ${-size} Z`} />
}

function Cloud() {
  return <path d="M -44 12 C -52 12 -56 2 -48 -3 C -48 -13 -34 -17 -28 -10 C -24 -22 -4 -24 2 -10 C 10 -16 24 -12 24 -3 C 34 -5 40 12 28 12 Z" fill="#fff" />
}

type Frame = typeof PILL

function mixFrames(a: Frame, b: Frame, amount: number): Frame {
  return {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
    width: a.width + (b.width - a.width) * amount,
    height: a.height + (b.height - a.height) * amount,
    rx: a.rx + (b.rx - a.rx) * amount,
  }
}

export function HeroRideScene({ running, onEnded }: { running: boolean; onEnded: () => void }) {
  const reduce = useReducedMotion()
  const id = useId().replace(/:/g, '')
  const clock = useMotionValue(reduce ? END : 0)
  const storyRef = useRef<AnimationPlaybackControls | null>(null)

  const sceneRef = useRef<SVGSVGElement>(null)
  const starRef = useRef<SVGPathElement>(null)
  const cardRef = useRef<SVGGElement>(null)
  const cardFaceRef = useRef<SVGRectElement>(null)
  const cardDetailsRef = useRef<SVGGElement>(null)
  const cursorRef = useRef<SVGGElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const sparklesRef = useRef<SVGGElement>(null)
  const worldRef = useRef<SVGGElement>(null)
  const stageClipRef = useRef<SVGRectElement>(null)
  const bezelRef = useRef<SVGRectElement>(null)
  const flightRef = useRef<SVGGElement>(null)
  const cabinRef = useRef<SVGGElement>(null)
  const cabinCameraRef = useRef<SVGGElement>(null)
  const glassCloudRef = useRef<SVGGElement>(null)
  const planeRef = useRef<SVGGElement>(null)
  const cloudsRef = useRef<SVGGElement>(null)
  const loungeRef = useRef<SVGGElement>(null)
  const loungeCameraRef = useRef<SVGGElement>(null)
  const openingRef = useRef<SVGCircleElement>(null)
  const sunGlowRef = useRef<SVGCircleElement>(null)
  const steamRef = useRef<SVGGElement>(null)
  const shineRef = useRef<SVGRectElement>(null)
  const coinSparkleRef = useRef<SVGGElement>(null)
  const arrowLineRef = useRef<SVGPathElement>(null)
  const arrowHeadRef = useRef<SVGPolygonElement>(null)
  const ringBlueRef = useRef<SVGPathElement>(null)
  const ringGreyRef = useRef<SVGPathElement>(null)

  const placeScene = (t: number) => {
    const scene = sceneRef.current
    if (!scene) return

    // ── Today: a star bursts into bills, a pointer pays each one, and they step aside ──
    const burst = progress(t, 0, 0.85)
    const starOut = between(t, 3.2, 3.75, 0, 1, easeIn)
    const starScale = (1.25 - 0.53 * easeOut(burst)) * (1 - starOut)
    const starTurn = 200 * easeOut(burst) + Math.max(0, t - 0.85) * 18 + 80 * starOut
    const starShift = between(t, 0.7, 1.2, 0, 1)
    starRef.current?.setAttribute('transform', `translate(${(CENTER.x + 10 * starShift).toFixed(1)} ${(CENTER.y - 20 * starShift).toFixed(1)}) rotate(${starTurn.toFixed(1)}) scale(${starScale.toFixed(3)})`)
    starRef.current?.setAttribute('opacity', (1 - starOut).toFixed(2))

    scene.querySelectorAll<SVGGElement>('[data-bill]').forEach((bill, i) => {
      const { place } = BILLS[i]
      const start = 0.5 + i * 0.08
      const shown = progress(t, start, start + 0.55)
      const out = between(t, 3.15 + i * 0.05, 3.7 + i * 0.05, 0, 1, easeIn)
      const dx = place.x - CENTER.x
      const dy = place.y - CENTER.y
      const away = Math.hypot(dx, dy) || 1
      const bob = Math.sin(((t + i * 0.9) * Math.PI * 2) / (3 + i * 0.5)) * 5 * shown
      const x = CENTER.x + dx * easeOut(shown) + (dx / away) * 80 * out
      const y = CENTER.y + dy * easeOut(shown) + (dy / away) * 80 * out + bob
      const turn = place.rotate * easeOut(shown) + (i % 2 ? 8 : -8) * out
      bill.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(2)}) scale(${(backOut(shown) * (1 - 0.35 * out)).toFixed(3)})`)
      bill.setAttribute('opacity', (Math.min(1, shown * 3) * (1 - out)).toFixed(2))

      const pressed = progress(t, PAY[i], PAY[i] + 0.45)
      const press = pressed > 0 && pressed < 1 ? 1 - 0.06 * Math.sin(Math.PI * 2 * pressed) * (1 - pressed) : 1
      bill.querySelector('[data-bill-body]')?.setAttribute('transform', `scale(${press.toFixed(3)})`)
      const ticked = progress(t, PAY[i] + 0.1, PAY[i] + 0.45)
      const tick = bill.querySelector('[data-tick]')
      tick?.setAttribute('transform', `${tick.getAttribute('data-at')} scale(${backOut(ticked).toFixed(3)})`)
    })

    // The card that pays them, which then glides to the middle and becomes the plane window
    const cardIn = progress(t, 0.62, 1.17)
    const morph = between(t, CARD_MORPH.start, CARD_MORPH.end, 0, 1)
    const cardX = CENTER.x + (CARD.x - CENTER.x) * easeOut(cardIn)
    const cardY = CENTER.y + (CARD.y - CENTER.y) * easeOut(cardIn) + Math.sin((t * Math.PI * 2) / 3.4) * 4 * cardIn * (1 - morph)
    cardRef.current?.setAttribute(
      'transform',
      `translate(${(cardX + (CENTER.x - cardX) * morph).toFixed(1)} ${(cardY + (CENTER.y - cardY) * morph).toFixed(1)}) rotate(${(CARD.rotate * easeOut(cardIn) * (1 - morph)).toFixed(2)}) scale(${backOut(cardIn).toFixed(3)})`,
    )
    cardRef.current?.setAttribute('opacity', (Math.min(1, cardIn * 3) * (1 - between(t, 4.1, 4.25, 0, 1, linear))).toFixed(2))
    const face = cardFaceRef.current
    if (face) {
      const width = CARD.width + (PILL.width - CARD.width) * morph
      const height = CARD.height + (PILL.height - CARD.height) * morph
      face.setAttribute('x', (-width / 2).toFixed(1))
      face.setAttribute('y', (-height / 2).toFixed(1))
      face.setAttribute('width', width.toFixed(1))
      face.setAttribute('height', height.toFixed(1))
      face.setAttribute('rx', (CARD.rx + (PILL.rx - CARD.rx) * morph).toFixed(1))
      face.setAttribute('fill-opacity', (1 - between(t, 3.9, 4.15, 0, 1, linear)).toFixed(2))
      face.setAttribute('stroke-width', (WINDOW_EDGE * morph).toFixed(2))
    }
    cardDetailsRef.current?.setAttribute('opacity', (1 - between(t, CARD_MORPH.start, CARD_MORPH.start + 0.25, 0, 1)).toFixed(2))

    let leg = CURSOR_PATH.length - 2
    while (leg > 0 && t < CURSOR_PATH[leg].t) leg--
    const from = CURSOR_PATH[leg]
    const to = CURSOR_PATH[leg + 1]
    const along = between(t, from.t, to.t, 0, 1)
    cursorRef.current?.setAttribute('transform', `translate(${(from.x + (to.x - from.x) * along).toFixed(1)} ${(from.y + (to.y - from.y) * along).toFixed(1)})`)
    cursorRef.current?.setAttribute('opacity', (between(t, 1.0, 1.15, 0, 1) * (1 - between(t, 3.0, 3.2, 0, 1))).toFixed(2))
    const paying = PAY.findIndex((at) => t >= at && t < at + 0.45)
    const ring = paying >= 0 ? progress(t, PAY[paying], PAY[paying] + 0.45) : 1
    if (paying >= 0) ringRef.current?.setAttribute('transform', `translate(${BILLS[paying].cursor.x} ${BILLS[paying].cursor.y}) scale(${(0.2 + easeOut(ring)).toFixed(3)})`)
    ringRef.current?.setAttribute('opacity', (0.8 * (1 - ring)).toFixed(2))

    sparklesRef.current?.setAttribute('opacity', (between(t, 0.6, 1.0, 0, 1) * (1 - between(t, 3.2, 3.6, 0, 1))).toFixed(2))
    sparklesRef.current?.querySelectorAll<SVGGElement>('[data-twinkle]').forEach((sparkle, i) => {
      const glint = 0.5 + 0.5 * Math.sin(((t + SPARKLES[i].delay) * Math.PI * 2) / 2)
      sparkle.setAttribute('transform', `scale(${(0.6 + 0.5 * glint).toFixed(3)})`)
      sparkle.setAttribute('opacity', (0.5 + 0.5 * glint).toFixed(2))
    })

    // ── The travel: an unbroken zoom from the window to a plane climbing away, ending at a window seat ──
    const f = t - FLIGHT_START
    worldRef.current?.setAttribute('opacity', between(t, 3.82, 3.98, 0, 1, linear).toFixed(2))

    // Where the living room's round window is, as the room settles back into place
    const settle = between(f, FLIGHT.portalOpen, FLIGHT.revealEnd, 0, 1)
    const roomScale = LOUNGE_SCALE * zoomBetween(f, FLIGHT.portalOpen, FLIGHT.revealEnd, PORTAL_ZOOM, 1)
    const portal = { x: CENTER.x + (PORTAL_FINAL.x - CENTER.x) * settle, y: CENTER.y + (PORTAL_FINAL.y - CENTER.y) * settle }
    const portalRadius = LOUNGE.portal.r * roomScale * 0.985
    const round: Frame = { x: portal.x - portalRadius, y: portal.y - portalRadius, width: portalRadius * 2, height: portalRadius * 2, rx: portalRadius }

    // The window frame: pill, wide while the plane is in view, then round like the room's window
    const wide = between(f, FLIGHT.cabinEnd, FLIGHT.shrunk, 0, 1)
    const rounding = between(f, FLIGHT.portalStart, FLIGHT.portalOpen, 0, 1)
    const frame = mixFrames(mixFrames(PILL, WIDE, wide), round, rounding)
    for (const rect of [stageClipRef.current, bezelRef.current]) {
      if (!rect) continue
      for (const key of ['x', 'y', 'width', 'height', 'rx'] as const) rect.setAttribute(key, frame[key].toFixed(1))
    }
    bezelRef.current?.setAttribute('opacity', (1 - between(f, FLIGHT.portalStart + 0.45, FLIGHT.portalOpen + 0.1, 0, 1)).toFixed(2))
    flightRef.current?.setAttribute('opacity', (1 - between(f, FLIGHT.portalStart + 0.25, FLIGHT.portalOpen, 0, 1, linear)).toFixed(2))

    cabinCameraRef.current?.setAttribute('transform', `scale(${zoomBetween(f, FLIGHT.cabinFrom, FLIGHT.cabinEnd, 2.8, 0.82).toFixed(3)})`)
    cabinRef.current?.setAttribute('transform', `translate(${CENTER.x} ${CENTER.y}) scale(${zoomBetween(f, FLIGHT.cabinEnd, FLIGHT.shrunk, 1, 0.14).toFixed(4)})`)
    cabinRef.current?.setAttribute('opacity', between(f, FLIGHT.shrunk - 0.15, FLIGHT.shrunk + 0.1, 1, 0).toFixed(2))
    glassCloudRef.current?.setAttribute('transform', `translate(${(26 - Math.max(0, f) * 26).toFixed(1)} 12) scale(0.28)`)

    const pulled = FLIGHT.shrunk - 0.05
    const scale = zoomBetween(f, pulled, FLIGHT.pulledOut, 8, 0.85) * zoomBetween(f, FLIGHT.cruiseEnd, FLIGHT.portalOpen, 1, 0.4)
    const tilt = between(f, pulled, FLIGHT.pulledOut, 0, -14)
    const planeX =
      between(f, pulled, FLIGHT.pulledOut, CENTER.x, 285) +
      between(f, FLIGHT.pulledOut, FLIGHT.cruiseEnd, 0, 45, linear) +
      between(f, FLIGHT.cruiseEnd, FLIGHT.portalOpen, 0, 70, linear)
    const planeY =
      between(f, pulled, FLIGHT.pulledOut, CENTER.y, 195) +
      between(f, FLIGHT.pulledOut, FLIGHT.cruiseEnd, 0, -26, linear) +
      between(f, FLIGHT.cruiseEnd, FLIGHT.portalOpen, 0, -40, linear)
    planeRef.current?.setAttribute('transform', `translate(${planeX.toFixed(1)} ${planeY.toFixed(1)}) scale(${scale.toFixed(3)}) rotate(${tilt.toFixed(2)})`)

    cloudsRef.current?.setAttribute('opacity', between(f, pulled, pulled + 0.6, 0, 1).toFixed(2))
    cloudsRef.current?.querySelectorAll<SVGGElement>('[data-cloud]').forEach((cloud, i) => {
      const { x: cloudX, y: cloudY, scale: cloudScale, speed } = CLOUDS[i]
      cloud.setAttribute('transform', `translate(${(cloudX - f * speed).toFixed(1)} ${cloudY}) scale(${cloudScale})`)
    })

    // ── Tomorrow: the plane flies on, the window rounds and fills with a sunset, then opens out onto the room around it ──
    loungeRef.current?.setAttribute('opacity', between(f, FLIGHT.portalStart + 0.15, FLIGHT.portalStart + 0.65, 0, 1, linear).toFixed(2))
    loungeCameraRef.current?.setAttribute(
      'transform',
      `translate(${(portal.x - LOUNGE.portal.x * roomScale).toFixed(2)} ${(portal.y - LOUNGE.portal.y * roomScale).toFixed(2)}) scale(${roomScale.toFixed(4)})`,
    )
    // The opening keeps inside the window while it rounds, then widens with a soft edge until the whole room shows
    const windowRadius = PILL.width / 2 + (portalRadius - PILL.width / 2) * rounding
    const openingRadius = windowRadius / 0.88 + (ROOM_OPEN_RADIUS - windowRadius / 0.88) * between(f, FLIGHT.portalOpen, FLIGHT.revealEnd, 0, 1)
    openingRef.current?.setAttribute('cx', portal.x.toFixed(1))
    openingRef.current?.setAttribute('cy', portal.y.toFixed(1))
    openingRef.current?.setAttribute('r', openingRadius.toFixed(1))

    // Small signs of an easy afternoon once the room is open: the charts grow, the sun warms, the mug steams, the coin catches the light
    const settled = FLIGHT.revealEnd
    sunGlowRef.current?.setAttribute('opacity', (0.4 * between(f, settled - 0.6, settled + 0.4, 0, 1)).toFixed(2))
    steamRef.current?.setAttribute('opacity', between(f, settled - 0.4, settled + 0.2, 0, 1, linear).toFixed(2))
    steamRef.current?.querySelectorAll<SVGPathElement>('[data-steam]').forEach((wisp, i) => {
      const rise = (((Math.max(0, f - settled + 0.4) / 1.8 + i / STEAM.length) % 1) + 1) % 1
      wisp.setAttribute('transform', `translate(${LOUNGE.mug.x + STEAM[i]} ${(LOUNGE.mug.y - rise * 22).toFixed(1)})`)
      wisp.setAttribute('opacity', (0.75 * Math.sin(Math.PI * rise)).toFixed(2))
    })
    const shine = progress(f, settled + 0.2, settled + 0.85)
    shineRef.current?.setAttribute('x', (LOUNGE.coin.x - 110 + 220 * easeInOut(shine)).toFixed(1))
    shineRef.current?.setAttribute('opacity', shine > 0 && shine < 1 ? '0.6' : '0')
    const twinkle = progress(f, settled + 0.7, settled + 1.3)
    coinSparkleRef.current?.setAttribute('transform', `translate(${LOUNGE.coin.x + 40} ${LOUNGE.coin.y - 46}) scale(${(Math.sin(Math.PI * twinkle) * 1.2).toFixed(3)})`)

    scene.querySelectorAll<SVGRectElement>('[data-bar]').forEach((bar, i) => {
      const { top } = CHART.bars[i]
      const grown = between(f, settled - 0.35 + i * 0.12, settled + 0.15 + i * 0.12, 0, 1, backOut)
      const height = (CHART.base - top) * grown
      bar.setAttribute('y', (CHART.base - height).toFixed(1))
      bar.setAttribute('height', Math.max(0, height).toFixed(1))
    })
    arrowLineRef.current?.setAttribute('stroke-dashoffset', (1 - between(f, settled + 0.15, settled + 0.85, 0, 1)).toFixed(3))
    arrowHeadRef.current?.setAttribute('transform', `translate(${CHART.arrowHead.x} ${CHART.arrowHead.y}) scale(${backOut(progress(f, settled + 0.78, settled + 1.05)).toFixed(3)})`)
    ringBlueRef.current?.setAttribute('stroke-dashoffset', (1 - between(f, settled - 0.1, settled + 0.75, 0, 1)).toFixed(3))
    ringGreyRef.current?.setAttribute('stroke-dashoffset', (1 - between(f, settled + 0.55, settled + 1.05, 0, 1)).toFixed(3))
  }
  useMotionValueEvent(clock, 'change', placeScene)
  useLayoutEffect(() => placeScene(clock.get()))

  useEffect(() => {
    if (reduce) return
    clock.set(0)
    const story = animate(clock, END, { duration: END, ease: 'linear', onComplete: onEnded })
    storyRef.current = story
    return () => {
      story.stop()
      storyRef.current = null
    }
  }, [reduce, clock, onEnded])

  useEffect(() => {
    if (running) storyRef.current?.play()
    else storyRef.current?.pause()
  }, [running])

  return (
    <svg ref={sceneRef} viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-star`} x1="0.3" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#4FB7A8" />
          <stop offset="1" stopColor="#2553B8" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBC48E" />
          <stop offset="1" stopColor="#EE8A5A" />
        </linearGradient>
        <linearGradient id={`${id}-yellow`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE680" />
          <stop offset="1" stopColor="#F4B92C" />
        </linearGradient>
        <linearGradient id={`${id}-teal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5BC4BD" />
          <stop offset="1" stopColor="#2C6DB5" />
        </linearGradient>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FA2F7" />
          <stop offset="1" stopColor="#2D5FD3" />
        </linearGradient>
        <linearGradient id={`${id}-tick`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34C77B" />
          <stop offset="1" stopColor="#0E8F58" />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2F7BEA" />
          <stop offset="1" stopColor="#B7DAFB" />
        </linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6EAF0" />
          <stop offset="1" stopColor="#C8D0DC" />
        </linearGradient>
        {/* The room opens from its window with a soft edge */}
        <radialGradient id={`${id}-opening`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.88" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-room`} maskUnits="userSpaceOnUse" x="-400" y="-400" width="1440" height="1140">
          <circle ref={openingRef} cx={CENTER.x} cy={CENTER.y} r="0" fill={`url(#${id}-opening)`} />
        </mask>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor="#FFF1C2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE6A0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-chart-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F8FC" />
          <stop offset="1" stopColor="#F2F4FA" />
        </linearGradient>
        {CHART.bars.map((bar, i) => (
          <linearGradient key={bar.x} id={`${id}-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bar.light} />
            <stop offset="1" stopColor={bar.dark} />
          </linearGradient>
        ))}
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4E8DFA" />
          <stop offset="1" stopColor="#3F7DE2" />
        </linearGradient>
        {/* The panels painted over the illustration's charts fade at their edges, so they melt into the card */}
        <filter id={`${id}-soft-edge`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id={`${id}-chart`}>
          <path
            clipRule="evenodd"
            d={`M ${CHART.patch.x - 6} ${CHART.patch.y - 6} H ${CHART.patch.x + CHART.patch.width + 6} V ${CHART.patch.y + CHART.patch.height + 6} H ${CHART.patch.x - 6} Z M ${CHART.hair.x + CHART.hair.rx} ${CHART.hair.y} A ${CHART.hair.rx} ${CHART.hair.ry} 0 1 0 ${CHART.hair.x - CHART.hair.rx} ${CHART.hair.y} A ${CHART.hair.rx} ${CHART.hair.ry} 0 1 0 ${CHART.hair.x + CHART.hair.rx} ${CHART.hair.y} Z`}
          />
        </clipPath>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-coin`}>
          <circle cx={LOUNGE.coin.x} cy={LOUNGE.coin.y} r={LOUNGE.coin.r} />
        </clipPath>
        <clipPath id={`${id}-stage`}>
          <rect ref={stageClipRef} {...PILL} />
        </clipPath>
        <clipPath id={`${id}-pill`}>
          <rect x={-PILL.width / 2} y={-PILL.height / 2} width={PILL.width} height={PILL.height} rx={PILL.rx} />
        </clipPath>
        <clipPath id={`${id}-glass`}>
          <rect x="-31" y="-44" width="62" height="88" rx="28" />
        </clipPath>
      </defs>

      {/* The star, where it all starts */}
      <path ref={starRef} d={starPath(100, 28, 8)} fill={`url(#${id}-star)`} stroke={`url(#${id}-star)`} strokeWidth="5" strokeLinejoin="round" />

      {/* The bills */}
      {BILLS.map((bill) => (
        <g key={bill.id} data-bill="" opacity="0">
          <g data-bill-body="" style={softShadow}>
            <path d={billPath(bill.w, bill.h)} fill={`url(#${id}-${bill.gradient})`} />
            <rect x={-bill.w / 2 + 16} y={-bill.h / 2 + 22} width={bill.w * 0.62} height="9" rx="4.5" fill="#fff" fillOpacity="0.75" />
            <rect x={-bill.w / 2 + 16} y={-bill.h / 2 + 42} width={bill.w * 0.42} height="9" rx="4.5" fill="#fff" fillOpacity="0.5" />
            <rect x={-bill.w / 2 + 16} y={bill.h / 2 - 42} width={bill.w * 0.32} height="11" rx="5.5" fill="#fff" fillOpacity="0.6" />
            <g data-tick="" data-at={`translate(${bill.w / 2 - 12} ${-bill.h / 2 + 12})`} transform={`translate(${bill.w / 2 - 12} ${-bill.h / 2 + 12}) scale(0)`}>
              <circle r="17" fill={`url(#${id}-tick)`} stroke="#fff" strokeWidth="3" />
              <path d="M -7 0.5 L -2 5.5 L 7.5 -5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        </g>
      ))}

      {/* The travel, seen through one window that finally becomes the living room's */}
      <g ref={worldRef} opacity="0">
        <g clipPath={`url(#${id}-stage)`}>
          <g ref={flightRef}>
            <rect x="0" y="0" width={VIEW.width} height={VIEW.height} fill={`url(#${id}-sky)`} />
            <g ref={cloudsRef} opacity="0">
              {CLOUDS.map((cloud) => (
                <g key={`${cloud.x}-${cloud.y}`} data-cloud="" transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})`}>
                  <Cloud />
                </g>
              ))}
            </g>

            {/* The plane, drawn with the window the cabin shrinks into at its origin */}
            <g ref={planeRef} transform={`translate(${CENTER.x} ${CENTER.y}) scale(8)`}>
              <path d="M -128 -14 L -156 -54 L -134 -54 L -94 -16 Z" fill={`url(#${id}-star)`} />
              <path d="M -126 -6 L -160 -14 L -148 -2 L -112 2 Z" fill="#BFD3F0" />
              <path d="M 8 4 L -46 -22 L -34 -24 L 40 2 Z" fill="#BFD3F0" />
              <path d="M -136 -14 C -90 -19 60 -19 106 -16 C 126 -14 142 -5 144 4 C 142 12 122 18 100 18 L -66 18 C -104 16 -126 6 -136 -14 Z" fill="#fff" />
              <path d="M -66 18 C -92 17 -112 11 -124 2 C -80 12 40 12 142 7 C 138 13 120 18 100 18 Z" fill="#D5E3F7" />
              <path d="M 118 -11 C 128 -9 134 -5 137 -2 L 122 -2 C 120 -2 118 -4 117 -6 Z" fill="#12305C" />
              {FUSELAGE_WINDOWS.map((x) => (
                <rect key={x} x={x - 1.8} y="-2.7" width="3.6" height="5.4" rx="1.8" fill="#12305C" />
              ))}
              <rect x="-22" y="18" width="30" height="11" rx="5.5" fill="#12305C" />
              <rect x="4" y="19.5" width="5" height="8" rx="2.5" fill="#fff" />
              <path d="M 28 6 L -40 46 L -22 48 L 58 12 Z" fill="#EEF4FD" />
            </g>

            {/* The cabin, with an empty seat beside the window */}
            <g ref={cabinRef} transform={`translate(${CENTER.x} ${CENTER.y})`}>
              <g clipPath={`url(#${id}-pill)`}>
                <g ref={cabinCameraRef} transform="scale(2.8)">
                  <rect x="-300" y="-300" width="600" height="600" fill={`url(#${id}-wall)`} />
                  {[-132, 132].map((x) => (
                    <g key={x} transform={`translate(${x} 0)`}>
                      <rect x="-36" y="-49" width="72" height="98" rx="32" fill="#B6C0CE" />
                      <rect x="-31" y="-44" width="62" height="88" rx="28" fill="#fff" />
                      <rect x="-26" y="-39" width="52" height="78" rx="24" fill="#6FA8F2" />
                    </g>
                  ))}
                  <rect x="-54" y="-70" width="108" height="140" rx="48" fill="#EEF1F5" />
                  <rect x="-36" y="-49" width="72" height="98" rx="32" fill="#B6C0CE" />
                  <rect x="-31" y="-44" width="62" height="88" rx="28" fill="#fff" />
                  <g clipPath={`url(#${id}-glass)`} transform="scale(0.86)">
                    <rect x="-31" y="-44" width="62" height="88" fill={`url(#${id}-sky)`} />
                    <g ref={glassCloudRef} transform="translate(26 12) scale(0.28)">
                      <Cloud />
                    </g>
                    <path d="M -31 -44 H 31 V -16 C 14 -9 -14 -9 -31 -16 Z" fill="#D3D9E2" />
                    <ellipse cx="0" cy="-18" rx="10" ry="1.6" fill="#fff" fillOpacity="0.8" />
                  </g>
                  <rect x="-300" y="146" width="600" height="60" fill="#1E4B8F" />
                  <path d="M 62 -66 C 62 -78 70 -84 80 -84 L 96 -84 C 108 -84 114 -76 112 -64 L 104 -28 L 66 -28 Z" fill="#D9475A" />
                  <path d="M 62 -40 C 62 -48 68 -52 76 -52 L 104 -52 C 114 -52 118 -44 116 -36 L 98 104 L 52 104 Z" fill="#16233F" />
                  <path d="M -30 86 C -30 78 -24 74 -16 74 L 76 74 C 88 74 94 82 92 92 L 88 112 L -22 112 C -28 104 -30 96 -30 86 Z" fill="#D9475A" />
                  <rect x="26" y="52" width="70" height="13" rx="6.5" fill="#AEB8C6" />
                  <path d="M 8 112 L 60 112 L 72 146 L 58 146 L 50 124 L 22 124 L 14 146 L 0 146 Z" fill="#7C889A" />
                </g>
              </g>
              <rect x={-PILL.width / 2} y={-PILL.height / 2} width={PILL.width} height={PILL.height} rx={PILL.rx} fill="none" stroke="#fff" strokeWidth={WINDOW_EDGE} />
            </g>
          </g>
        </g>

        {/* The living room, seen first through its round window, then opening out */}
        <g ref={loungeRef} opacity="0" mask={`url(#${id}-room)`}>
          <g ref={loungeCameraRef}>
            <image href={LOUNGE.src} width={LOUNGE.width} height={LOUNGE.height} />
            <circle ref={sunGlowRef} cx={LOUNGE.sun.x} cy={LOUNGE.sun.y} r="95" fill={`url(#${id}-sun)`} opacity="0" />
            <g ref={steamRef} opacity="0" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round">
              {STEAM.map((dx) => (
                <path key={dx} data-steam="" d="M 0 0 C -5 -7 5 -13 0 -20 C -5 -27 4 -33 0 -40" opacity="0" />
              ))}
            </g>
            <g clipPath={`url(#${id}-coin)`}>
              <rect ref={shineRef} x={LOUNGE.coin.x - 110} y={LOUNGE.coin.y - LOUNGE.coin.r - 20} width="44" height={LOUNGE.coin.r * 2 + 40} fill={`url(#${id}-shine)`} opacity="0" transform={`rotate(20 ${LOUNGE.coin.x} ${LOUNGE.coin.y})`} />
            </g>
            <g ref={coinSparkleRef} fill="#fff" transform={`translate(${LOUNGE.coin.x + 40} ${LOUNGE.coin.y - 46}) scale(0)`}>
              <Sparkle size={14} />
            </g>

            {/* The bar chart, redrawn so it can grow: bars rise, then the arrow draws on */}
            <g clipPath={`url(#${id}-chart)`}>
              <rect {...CHART.patch} fill={`url(#${id}-chart-face)`} filter={`url(#${id}-soft-edge)`} />
              {CHART.lines.map((line) => (
                <rect key={line.y} x={line.x} y={line.y} width={line.width} height="14" rx="7" fill={line.color} />
              ))}
              {CHART.bars.map((bar, i) => (
                <rect key={bar.x} data-bar="" x={bar.x} y={CHART.base} width={bar.width} height="0" rx="4" fill={`url(#${id}-bar-${i})`} />
              ))}
              <path ref={arrowLineRef} d={CHART.arrow} fill="none" stroke="#3D78DA" strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" />
              <polygon ref={arrowHeadRef} points={CHART.arrowHead.points} fill="#3D78DA" strokeLinejoin="round" transform={`translate(${CHART.arrowHead.x} ${CHART.arrowHead.y}) scale(0)`} />
            </g>

            {/* The ring chart, drawn on share by share */}
            <circle cx={RING.x} cy={RING.y} r={RING.patch} fill="#F4F6FB" filter={`url(#${id}-soft-edge)`} />
            <path ref={ringGreyRef} d={ringArc(RING.greyEnd, true)} fill="none" stroke="#CAD1E8" strokeWidth={RING.width} pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" />
            <path ref={ringBlueRef} d={ringArc(RING.blueEnd, false)} fill="none" stroke={`url(#${id}-ring)`} strokeWidth={RING.width} pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" />
          </g>
        </g>

        <rect ref={bezelRef} {...PILL} fill="none" stroke="#fff" strokeWidth={WINDOW_EDGE} />
      </g>

      {/* The card that pays the bills, and becomes the window */}
      <g ref={cardRef} opacity="0" style={softShadow}>
        <rect ref={cardFaceRef} x={-CARD.width / 2} y={-CARD.height / 2} width={CARD.width} height={CARD.height} rx={CARD.rx} fill={`url(#${id}-card)`} stroke="#fff" strokeWidth="0" />
        <g ref={cardDetailsRef}>
          <rect x="-98" y="-48" width="52" height="42" rx="8" fill="#fff" fillOpacity="0.45" />
          <rect x="38" y="36" width="62" height="16" rx="8" fill="#fff" fillOpacity="0.55" />
        </g>
      </g>

      {/* The pointer that pays each bill */}
      <circle ref={ringRef} r="20" fill="none" stroke="#2553B8" strokeWidth="2" opacity="0" />
      <g ref={cursorRef} opacity="0">
        <path d="M 0 0 L 0 24 L 7 18 L 12 29 L 17 27 L 12 16 L 21 15 Z" fill="#0B1533" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      </g>

      <g ref={sparklesRef} opacity="0">
        {SPARKLES.map((s) => (
          <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y})`} fill={s.color}>
            <g data-twinkle="">
              <Sparkle size={s.size} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  )
}
