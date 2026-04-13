import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 0,
    title: 'Quick Notifications',
    subtitle: 'Sign in to explore smarter tools for planning your financial future.',
    bg: 'from-emerald-400 to-teal-500',
    cardBg: 'bg-emerald-500/20',
    emoji: '🔔',
    illustration: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">🔔</div>
        <div className="space-y-2 w-full">
          {['Contribution reminder', 'Balance update', 'Plan alert'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
              <span className="text-white/90 text-xs font-medium">{t}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 1,
    title: 'Smart Analytics',
    subtitle: 'Track your retirement progress with real-time insights.',
    bg: 'from-blue-500 to-indigo-600',
    cardBg: 'bg-blue-500/20',
    emoji: '📊',
    illustration: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">📊</div>
        <div className="flex items-end gap-1.5 h-16">
          {[40, 60, 45, 75, 55, 85, 70].map((h, i) => (
            <div
              key={i}
              className="w-5 rounded-t-lg bg-white/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="text-white/80 text-xs font-medium">+12.4% this quarter</div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Secure & Simple',
    subtitle: 'Bank-level security with a seamless experience.',
    bg: 'from-purple-500 to-violet-600',
    cardBg: 'bg-purple-500/20',
    emoji: '🛡️',
    illustration: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">🛡️</div>
        <div className="space-y-2 w-full">
          {['256-bit encryption', 'Multi-factor auth', 'SOC 2 compliant'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <span className="text-white/90 text-xs font-medium">{t}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function AuthCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length)
  const next = () => setCurrent((c) => (c + 1) % slides.length)

  const slide = slides[current]

  return (
    <div className={`relative flex h-full flex-col bg-gradient-to-br ${slide.bg} transition-all duration-700`}>
      {/* Top branding */}
      <div className="p-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">CORE</span>
        </div>
        <p className="text-white/60 text-xs mt-1">Retirement Intelligence Platform</p>
      </div>

      {/* Illustration card */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
        <div className="w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
          {slide.illustration}
        </div>

        {/* Text */}
        <div className="text-center space-y-2 max-w-xs">
          <h2 className="text-white font-bold text-2xl leading-tight">{slide.title}</h2>
          <p className="text-white/70 text-sm leading-relaxed">{slide.subtitle}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-8 flex items-center justify-between">
        {/* Explore demo button */}
        <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10">
          <span>🎯</span>
          <span>Explore Demo</span>
        </button>

        {/* Arrows + dots */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
