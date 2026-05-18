import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAIStore } from '@/core/store/aiStore'
import { useFeedbackUiStore } from '@/core/store/feedbackUiStore'
import { CoreAIPanel } from '@/features/ai/components/CoreAIPanel'
import { AISearchPalette } from '@/features/ai/components/AISearchPalette'
import { useAppBlockingOverlay } from '@/features/ai/hooks/useAppBlockingOverlay'

const AUTH_PATHS = /^\/(v1\/)?(login|signup|forgot-password|verify|reset-password)(\/|$)/

/**
 * Site-wide Core AI entry: chat panel, search palette, and floating CTA.
 * Rendered once from RootLayout so it appears on auth, enrollment, and app routes.
 * Nothing is rendered on auth pages (login, signup, forgot-password, verify, reset-password).
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

  // Do not mount any AI UI on auth pages
  if (AUTH_PATHS.test(location.pathname)) return null

  const enrollmentStepFlow =
    location.pathname.startsWith('/enrollment/') && !location.pathname.includes('/enrollment/success')

  const hideFloating = isChatOpen || isSearchOpen || feedbackModalOpen || appBlockingModal

  const pill = !hideFloating && portalReady && (
    <button
      type="button"
      onClick={openChat}
      className={cn(
        'fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-[9999px] pl-1.5 pr-5 py-1.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]',
        'border border-blue-300/60 backdrop-blur-[8px]',
        enrollmentStepFlow ? 'bottom-6 max-sm:!bottom-20' : 'bottom-6',
      )}
      style={{
        background: 'rgba(230, 241, 255, 0.95)',
        boxShadow: '0 4px 24px rgba(59, 130, 246, 0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
        color: '#1e40af',
      }}
      aria-label="Ask CORE AI"
      data-global-ask-core-ai-pill
    >
      <img src="/ask-ai-robot.png" alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" />
      <span className="whitespace-nowrap tracking-wide font-semibold text-blue-700">
        Ask <span className="font-bold">CORE</span> AI
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
