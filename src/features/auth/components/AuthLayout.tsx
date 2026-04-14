import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BG_IMAGE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/background%20auth.png'
const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

const CAROUSEL_SLIDES = [
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%201.png',
    title: 'Monitor Plan Performance',
    subtitle: 'View participant engagement, contribution trends, and plan health at a glance to make informed decisions.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%202.png',
    title: 'Smart Analytics',
    subtitle: 'Track your retirement progress with real-time insights and personalized recommendations.',
  },
  {
    image: 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%203.png',
    title: 'Secure & Simple',
    subtitle: 'Bank-level security with a seamless experience designed for modern retirement planning.',
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

  const goTo = useCallback((i: number) => {
    setCurrent(i)
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
    <div className="flex flex-col items-center justify-end h-full pb-16 px-10 text-white">
      {/* Carousel card */}
      <div className="w-full max-w-sm mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          <img
            key={current}
            src={slide.image}
            alt={slide.title}
            className="w-full h-48 object-cover transition-opacity duration-500"
          />
          <div className="p-5">
            <h3 className="font-bold text-white text-lg leading-tight mb-2">{slide.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{slide.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <h2 className="text-2xl font-bold text-white text-center mb-2">Empower your oversight</h2>
      <p className="text-white/60 text-sm text-center mb-8">
        Sign in to gain clear visibility into every plan&apos;s performance
      </p>

      {/* Nav controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={prev}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div className="flex gap-2">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-white" />
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
