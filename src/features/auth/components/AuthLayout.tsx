import { useState, useEffect, useCallback } from 'react'

const BG_IMAGE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/background%20auth.png'
const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

const CAROUSEL_SLIDES = [
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/Image%201.png',
    title: 'Monitor Plan Performance',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
    fallbackIcon: '📊',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/Image%202.png',
    title: 'AI-Powered Support',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
    fallbackIcon: '🤖',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/Image%203.png',
    title: 'Enabling Auto-Increment',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
    fallbackIcon: '💰',
  },
]

function AuthCarousel() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const count = CAROUSEL_SLIDES.length

  const goTo = useCallback((idx: number) => {
    setFading(true)
    setTimeout(() => {
      setCurrent(((idx % count) + count) % count)
      setFading(false)
    }, 180)
  }, [count])

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 5000)
    return () => clearInterval(timer)
  }, [current, goTo])

  const slide = CAROUSEL_SLIDES[current]
  const imgFailed = imgErrors[current]

  return (
    <div className="flex flex-col items-center justify-center px-6 pb-10 gap-5 h-full">
      {/* Image card — natural height, no crop */}
      <div
        className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-white/20 shadow-xl transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {imgFailed ? (
          <div className="w-full h-[260px] flex flex-col items-center justify-center gap-3 bg-white/10">
            <span className="text-6xl">{slide.fallbackIcon}</span>
            <span className="text-white/50 text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            key={current}
            src={slide.image}
            alt={slide.title}
            className="w-full h-auto block"
            onError={() => setImgErrors((prev) => ({ ...prev, [current]: true }))}
          />
        )}
      </div>

      {/* Title + subtitle */}

    </div>
  )
}

export default function AuthLayout({
  children,
  showLeftPanelLogo = true,
}: {
  children: React.ReactNode
  showLeftPanelLogo?: boolean
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — background image + carousel (desktop only) ── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] relative flex-col min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_IMAGE})` }} />
        <div className="absolute inset-0 bg-gray-900/60" />

        {showLeftPanelLogo ? (
          <div className="relative z-10 p-8 shrink-0">
            <img
              src={CORE_LOGO}
              alt="CORE"
              className="h-8 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        ) : null}

        {/* Carousel — fills remaining height, never overflows */}
        <div className="relative z-10 flex-1 overflow-hidden">
          <AuthCarousel />
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto min-h-screen">
        {children}
      </div>
    </div>
  )
}
