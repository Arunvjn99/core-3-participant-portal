import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquarePlus, Star, X } from 'lucide-react'
import { useAuth } from '@/core/hooks/useAuth'
import { useFeedbackUiStore } from '@/core/store/feedbackUiStore'
import { submitFeedback } from '@/features/feedback/submitFeedback'
import { Button } from '@/design-system/components/Button'
import { cn } from '@/lib/cn'

const TOAST_MS = 4200

export function GlobalFeedback() {
  const { user } = useAuth()
  const modalOpen = useFeedbackUiStore((s) => s.modalOpen)
  const setModalOpen = useFeedbackUiStore((s) => s.setModalOpen)
  const toastMessage = useFeedbackUiStore((s) => s.toastMessage)
  const showToast = useFeedbackUiStore((s) => s.showToast)
  const clearToast = useFeedbackUiStore((s) => s.clearToast)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()

  const resetForm = useCallback(() => {
    setRating(0)
    setComment('')
    setError(null)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    resetForm()
  }, [setModalOpen, resetForm])

  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button[data-star="1"]')?.focus()
    }, 0)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
    }
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, closeModal])

  useEffect(() => {
    if (!toastMessage) return
    const t = window.setTimeout(() => clearToast(), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [toastMessage, clearToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setError('Please choose a star rating.')
      return
    }
    setError(null)
    setSubmitting(true)
    const pagePath = window.location.pathname
    const result = await submitFeedback({
      userId: user?.id ?? null,
      pagePath,
      rating,
      comment: comment.trim() || null,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    closeModal()
    showToast(result.demo ? 'Thanks! Feedback saved locally (demo mode).' : 'Thanks for your feedback!')
  }

  const modal =
    modalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-[2px]"
          aria-label="Close feedback dialog"
          onClick={closeModal}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="relative z-[201] w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-modal)]"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">
                Send feedback
              </h2>
              <p id={descId} className="mt-1 text-sm text-[var(--text-secondary)]">
                How would you rate this page? Optional details help us improve.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Rating</p>
              <div className="flex gap-1" role="group" aria-label="Star rating 1 to 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-star={n}
                    onClick={() => setRating(n)}
                    className={cn(
                      'rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                      n <= rating
                        ? 'text-amber-400'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    )}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={n <= rating}
                  >
                    <Star
                      className={cn('h-8 w-8', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)]')}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="feedback-comment" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Comments <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell us what worked or what we should improve…"
                className={cn(
                  'w-full resize-y rounded-xl border border-[var(--border-default)] bg-[var(--surface-page)] px-3 py-2.5 text-sm text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]'
                )}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger)]" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" size="md" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={submitting} disabled={submitting}>
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )

  const toast =
    toastMessage &&
    createPortal(
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 z-[220] max-w-sm -translate-x-1/2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)]"
      >
        {toastMessage}
      </div>,
      document.body
    )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetForm()
          setModalOpen(true)
        }}
        className={cn(
          'fixed bottom-[5.5rem] right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full',
          'border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--shadow-card)]',
          'transition-transform hover:scale-105 hover:shadow-[var(--shadow-dropdown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          'dark:border-[var(--border-strong)]'
        )}
        aria-label="Open feedback form"
        title="Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" aria-hidden />
      </button>
      {modal}
      {toast}
    </>
  )
}

export default GlobalFeedback
