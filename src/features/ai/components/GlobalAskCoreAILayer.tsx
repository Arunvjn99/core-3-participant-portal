import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useFooterLift } from '@/lib/useFooterLift'
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
  // Rise above the footer when it scrolls into view, instead of sitting on it
  const footerLift = useFooterLift()

  // Do not mount any AI UI on auth pages
  if (AUTH_PATHS.test(location.pathname)) return null

  const enrollmentStepFlow =
    location.pathname.startsWith('/enrollment/') && !location.pathname.includes('/enrollment/success')

  // One-click enrolment is itself a CORE AI conversation, with its own message box
  const ownConversation = location.pathname === '/enrollment/quick'

  const hideFloating = isChatOpen || isSearchOpen || feedbackModalOpen || appBlockingModal || ownConversation

  const pill = !hideFloating && portalReady && (
    <button
      type="button"
      onClick={openChat}
      className={cn(
        'fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-[9999px] pl-1.5 pr-5 py-1.5 text-sm font-semibold transition-all hover:scale-[1.04] active:scale-[0.97]',
        enrollmentStepFlow ? 'bottom-[max(1.5rem,calc(var(--footer-lift,0px)+0.75rem))] max-sm:!bottom-[max(5rem,calc(var(--footer-lift,0px)+0.75rem))]' : 'bottom-[max(1.5rem,calc(var(--footer-lift,0px)+0.75rem))]',
      )}
      style={{
        ['--footer-lift' as string]: `${footerLift}px`,
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        boxShadow: '0 4px 24px rgba(37,99,235,0.55), 0 0 0 1px rgba(37,99,235,0.3)',
        color: '#ffffff',
      }}
      aria-label="Ask CORE AI"
      data-global-ask-core-ai-pill
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 32px rgba(37,99,235,0.7), 0 0 0 1px rgba(37,99,235,0.5)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(37,99,235,0.55), 0 0 0 1px rgba(37,99,235,0.3)' }}
    >
      {/* AI Sparkle icon */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} aria-hidden>
        <img src="/core-ai-sparkle.png" alt="Core AI" className="h-7 w-7 object-contain" />
      </span>
      <span className="whitespace-nowrap tracking-wide text-white">
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
