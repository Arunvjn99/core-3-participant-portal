import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/Ai%20carosel.png',
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
    <div className="flex flex-col items-center justify-center h-full px-8 py-6 gap-6">
      {/* Image card */}
      <div
        className="w-full max-w-[420px] transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm">
          {imgFailed ? (
            /* Fallback placeholder when image can't load */
            <div className="w-full h-[280px] flex flex-col items-center justify-center gap-3 bg-white/5">
              <span className="text-6xl">{slide.fallbackIcon}</span>
              <span className="text-white/50 text-sm">Image unavailable</span>
            </div>
          ) : (
            <img
              key={current}
              src={slide.image}
              alt={slide.title}
              className="w-full h-[280px] object-cover object-top"
              onError={() => setImgErrors((prev) => ({ ...prev, [current]: true }))}
            />
          )}
        </div>
      </div>

      {/* Title + subtitle */}
      <div
        className="text-center transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <h2 className="text-white text-[1.4rem] font-bold mb-2 leading-snug">{slide.title}</h2>
        <p className="text-white/65 text-sm leading-relaxed max-w-[340px] mx-auto">{slide.subtitle}</p>
      </div>

      {/* Navigation: prev · dots · next */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/35 hover:bg-white/55'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — background image + carousel (desktop only) ── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] relative flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_IMAGE})` }} />
        <div className="absolute inset-0 bg-gray-900/60" />

        {/* CORE logo */}
        <div className="relative z-10 p-8 flex-shrink-0">
          <img
            src={CORE_LOGO}
            alt="CORE"
            className="h-8 w-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Carousel — fills remaining height */}
        <div className="relative z-10 flex-1 min-h-0">
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
