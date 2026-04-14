import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BG_IMAGE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/background%20auth.png'
const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

const CAROUSEL_SLIDES = [
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%201.png',
    title: 'Monitor Plan Performance',
    subtitle:
      'View participant engagement, contribution trends, and plan health at a glance to make informed decisions.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%202.png',
    title: 'Introducing new features',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%203.png',
    title: 'Empower your oversight',
    subtitle: "Sign in to gain clear visibility into every plan's performance.",
  },
]

function AuthCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % CAROUSEL_SLIDES.length)
    setPaused(true)
    setTimeout(() => setPaused(false), 6000)
  }, [])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)
    setPaused(true)
    setTimeout(() => setPaused(false), 6000)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % CAROUSEL_SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [paused])

  const slide = CAROUSEL_SLIDES[current]

  return (
    <div className="flex flex-col h-full justify-end pb-12 px-8">
      <div className="w-full max-w-[360px] mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          <div className="relative overflow-hidden" style={{ height: '220px' }}>
            <img
              key={current}
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-top"
              style={{ transition: 'opacity 0.5s ease' }}
            />
            <div className="absolute bottom-3 right-3 bg-white rounded-xl px-3 py-2 shadow-lg">
              <p className="text-xs text-gray-500 font-medium">Projected Balance</p>
              <p className="text-sm font-bold text-blue-600">$15,123.00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{slide.subtitle}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setCurrent(i)
                setPaused(true)
                setTimeout(() => setPaused(false), 6000)
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
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
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
