import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BG_IMAGE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/background%20auth.png'
const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

const CAROUSEL_SLIDES = [
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%201.png',
    title: 'Monitor Plan Performance',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/Ai%20carosel.png',
    title: 'AI-Powered Support',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%203.png',
    title: 'Enabling Auto-Increment',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
  },
]

function AuthCarousel() {
  const { t: _t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const count = CAROUSEL_SLIDES.length

  const goTo = useCallback((idx: number) => {
    setFading(true)
    setTimeout(() => {
      setCurrent((idx + count) % count)
      setFading(false)
    }, 200)
  }, [count])

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 5000)
    return () => clearInterval(timer)
  }, [current, goTo])

  const slide = CAROUSEL_SLIDES[current]

  return (
    <div className="flex flex-col h-full justify-end pb-10 px-8">
      {/* Image card */}
      <div className="w-full max-w-[460px] mx-auto mb-5">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          <div
            className="relative w-full h-[340px] transition-opacity duration-200"
            style={{ opacity: fading ? 0 : 1 }}
          >
            <img
              key={current}
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* Title + subtitle */}
      <div
        className="text-center mb-5 transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <h2 className="text-white text-2xl font-bold mb-2 leading-tight">{slide.title}</h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-[360px] mx-auto">{slide.subtitle}</p>
      </div>

      {/* Navigation: prev · dots · next */}
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="text-white/60 hover:text-white transition-colors"
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
                i === current
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          className="text-white/60 hover:text-white transition-colors"
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
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BG_IMAGE})` }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gray-900/60" />

        {/* CORE logo top-left */}
        <div className="relative z-10 p-8">
          <img
            src={CORE_LOGO}
            alt="CORE"
            className="h-8 w-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Carousel */}
        <div className="relative z-10 flex-1">
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
