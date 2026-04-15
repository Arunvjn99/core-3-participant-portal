/**
 * Loads the Accessibly (acsbapp.com) widget once per page lifecycle.
 * Safe if the script fails to load or init throws — the app continues normally.
 */
const SCRIPT_URL = 'https://acsbapp.com/apps/app/dist/js/app.js'

export function initAcsbAccessibility(): void {
  if (typeof window === 'undefined') return
  if (window.__acsbParticipantPortalLoaded) return
  window.__acsbParticipantPortalLoaded = true

  const script = document.createElement('script')
  script.async = true
  script.src = SCRIPT_URL

  script.onload = () => {
    try {
      const api = window.acsbJS
      if (api && typeof api.init === 'function') {
        api.init()
      }
    } catch (e) {
      console.warn('[Accessibility] acsbJS.init() failed:', e)
    }
  }

  script.onerror = () => {
    console.warn('[Accessibility] Failed to load', SCRIPT_URL)
  }

  const target = document.head ?? document.body
  target.appendChild(script)
}
