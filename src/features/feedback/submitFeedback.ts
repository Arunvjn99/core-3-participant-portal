import { supabase } from '@/core/supabase'

export interface SubmitFeedbackInput {
  userId: string | null
  pagePath: string
  rating: number
  comment: string | null
}

export type SubmitFeedbackResult =
  | { ok: true; demo: boolean }
  | { ok: false; error: string }

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResult> {
  if (!supabase) {
    console.info('[Feedback] Demo mode — feedback not persisted.')
    return { ok: true, demo: true }
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: input.userId,
    page_path: input.pagePath,
    rating: input.rating,
    comment: input.comment,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, demo: false }
}
