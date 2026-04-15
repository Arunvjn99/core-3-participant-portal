/** Global injected by https://acsbapp.com/apps/app/dist/js/app.js */
declare global {
  interface Window {
    acsbJS?: {
      init: () => void
    }
    __acsbParticipantPortalLoaded?: boolean
  }
}

export {}
