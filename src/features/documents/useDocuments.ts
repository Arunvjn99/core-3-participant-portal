import { useMemo, useState } from 'react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useTransactionTracker } from '@/features/transactions/tracking/trackerStore'
import { buildDocuments } from './buildDocuments'
import { useDocumentState } from './documentState'

/** A document is "new" for 45 days after publication, until it is opened. */
const NEW_WINDOW_MS = 45 * 86_400_000

export function useDocuments() {
  const tracked = useTransactionTracker((s) => s.items)
  const enrolledAt = useEnrollmentDraftStore((s) => s.draftData.review?.confirmedAt)
  const opened = useDocumentState((s) => s.opened)
  const [now] = useState(() => Date.now())

  return useMemo(() => {
    return buildDocuments({ tracked, enrolledAt, now }).map((doc) => ({
      doc,
      isNew: now - doc.at < NEW_WINDOW_MS && !opened.includes(doc.id),
    }))
  }, [tracked, enrolledAt, opened, now])
}
