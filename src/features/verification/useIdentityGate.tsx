import { useState, type ReactNode } from 'react'
import { IdentityCheckDialog } from './IdentityCheckDialog'
import { isIdentityFresh, useVerificationStore } from './verificationStore'

/**
 * Puts an identity check in front of a sensitive action. `guard(action)` runs the action straight away when
 * the participant has passed a check recently, and otherwise opens the check and runs it on a pass.
 * Render `dialog` once in the component that calls `guard`.
 */
export function useIdentityGate(): { guard: (action: () => void) => void; dialog: ReactNode } {
  const verifiedAt = useVerificationStore((s) => s.identityVerifiedAt)
  const [pending, setPending] = useState<(() => void) | null>(null)

  const guard = (action: () => void) => {
    if (isIdentityFresh(verifiedAt, Date.now())) action()
    else setPending(() => action)
  }

  const dialog = (
    <IdentityCheckDialog
      open={pending !== null}
      onClose={() => setPending(null)}
      onVerified={() => {
        const action = pending
        setPending(null)
        action?.()
      }}
    />
  )

  return { guard, dialog }
}
