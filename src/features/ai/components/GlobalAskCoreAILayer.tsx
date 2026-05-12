import { useLocation } from 'react-router-dom'
import { useAIStore } from '@/core/store/aiStore'
import { useFeedbackUiStore } from '@/core/store/feedbackUiStore'
import { CoreAIPanel } from '@/features/ai/components/CoreAIPanel'
import { AISearchPalette } from '@/features/ai/components/AISearchPalette'
import { useAppBlockingOverlay } from '@/features/ai/hooks/useAppBlockingOverlay'

const AUTH_PATHS = /^\/(v1\/)?(login|signup|forgot-password|verify|reset-password)(\/|$)/

/**
 * Site-wide Core AI entry: chat panel and search palette.
 * The floating "Ask CORE AI" pill has been removed.
 * Nothing is rendered on auth pages.
 */
export function GlobalAskCoreAILayer() {
  const location = useLocation()
  // Keep stores subscribed so chat/search still work when opened via other triggers
  useAIStore((s) => s.isChatOpen)
  useAIStore((s) => s.isSearchOpen)
  useFeedbackUiStore((s) => s.modalOpen)
  useAppBlockingOverlay()

  // Do not mount any AI UI on auth pages
  if (AUTH_PATHS.test(location.pathname)) return null

  return (
    <>
      <CoreAIPanel />
      <AISearchPalette />
    </>
  )
}
