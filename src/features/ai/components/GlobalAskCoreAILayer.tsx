import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAIStore } from '@/core/store/aiStore'
import { useFeedbackUiStore } from '@/core/store/feedbackUiStore'
import { CoreAIPanel } from '@/features/ai/components/CoreAIPanel'
import { AISearchPalette } from '@/features/ai/components/AISearchPalette'
import { useAppBlockingOverlay } from '@/features/ai/hooks/useAppBlockingOverlay'

/**
 * Site-wide Core AI entry: chat panel, search palette, and floating CTA.
 * Rendered once from RootLayout so it appears on auth, enrollment, and app routes.
 */
export function GlobalAskCoreAILayer() {
  const location = useLocation()
  const openChat = useAIStore((s) => s.openChat)
  const isChatOpen = useAIStore((s) => s.isChatOpen)
  const isSearchOpen = useAIStore((s) => s.isSearchOpen)
  const feedbackModalOpen = useFeedbackUiStore((s) => s.modalOpen)
  const appBlockingModal = useAppBlockingOverlay()

  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => setPortalReady(true), [])

  const enrollmentStepFlow =
    location.pathname.startsWith('/enrollment/') && !location.pathname.includes('/enrollment/success')

  const hideFloating =
    isChatOpen || isSearchOpen || feedbackModalOpen || appBlockingModal

  const pill = !hideFloating && portalReady && (
    <button
      type="button"
      onClick={openChat}
      className={cn(
        'fixed left-1/2 z-[48] flex -translate-x-1/2 items-center gap-2.5 rounded-[9999px] px-5 py-3 text-sm font-medium text-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]',
        'border border-white/[0.15] backdrop-blur-[8px]',
        enrollmentStepFlow ? 'bottom-6 max-sm:!bottom-20' : 'bottom-6',
      )}
      style={{
        background: 'rgba(30, 30, 46, 0.9)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
      aria-label="Ask CORE AI"
      data-global-ask-core-ai-pill
    >
      <span className="core-ai-sparkle-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/35 to-blue-500/35 ring-1 ring-white/10">
        <Sparkles className="h-4 w-4 text-purple-200" aria-hidden />
      </span>
      <span className="whitespace-nowrap tracking-wide">
        Ask <span className="font-semibold">CORE</span> AI
      </span>
    </button>
  )

  return (
    <>
      <CoreAIPanel />
      <AISearchPalette />
      {pill ? createPortal(pill, document.body) : null}
    </>
  )
}
