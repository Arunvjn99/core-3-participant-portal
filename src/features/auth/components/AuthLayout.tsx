import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const BG_IMAGE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/background%20auth.png'
const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

const CAROUSEL_IMAGES = [
  'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%201.png',
  'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%202.png',
  'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/image%203.png',
]

function AuthCarousel() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const slideCount = CAROUSEL_IMAGES.length

  const slides = CAROUSEL_IMAGES.map((image, i) => ({
    image,
    title: t(`carousel.slide${i + 1}_title`),
    subtitle: t(`carousel.slide${i + 1}_subtitle`),
  }))

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slideCount)
    setPaused(true)
    setTimeout(() => setPaused(false), 6000)
  }, [slideCount])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slideCount) % slideCount)
    setPaused(true)
    setTimeout(() => setPaused(false), 6000)
  }, [slideCount])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slideCount), 5000)
    return () => clearInterval(timer)
  }, [paused, slideCount])

  const slide = slides[current]

  return (
    <div className="flex flex-col h-full justify-end pb-12 px-8">
      <div className="w-full max-w-[500px] mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          <div className="relative overflow-hidden w-full max-w-[500px] h-[700px] mx-auto">
            <img
              key={current}
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-top"
              style={{ transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
        </div>
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
