import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { CheckCircle, Mail, Calendar, BarChart3 } from 'lucide-react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { supabase } from '@/core/supabase'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { BODY_TEXT, Card, HEADING, IconChip, PILL_PRIMARY, RULE, SECTION_LABEL } from '@/features/enrollment/enrollmentUi'

const nextStepIcons = [Calendar, Mail, BarChart3] as const
const nextStepKeys = ['step1', 'step2', 'step3'] as const

export default function EnrollmentSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleDashboard = async () => {
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const completedAt = new Date().toISOString()
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        const row = {
          user_id: user.id,
          status: 'complete' as const,
          completed_at: completedAt,
          updated_at: completedAt,
        }

        if (existing?.id) {
          const { error: upErr } = await supabase.from('enrollments').update(row).eq('id', existing.id)
          if (upErr) console.error('[EnrollmentSuccess] enrollments update failed:', upErr.message, upErr)
        } else {
          const { error: insErr } = await supabase.from('enrollments').insert(row)
          if (insErr) console.error('[EnrollmentSuccess] enrollments insert failed:', insErr.message, insErr)
        }
      }
    }
    useEnrollmentDraftStore.getState().setEnrollmentStatus('complete')
    navigate(ROUTES.POST_ENROLLMENT_DASHBOARD)
  }

  return (
    <AnimatedPage>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card tone="green" className="w-full max-w-md space-y-5 text-center sm:p-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20" aria-hidden>
            <CheckCircle className="h-8 w-8" />
          </span>

          <div>
            <h1 className={cn('text-[28px] font-bold leading-tight', HEADING)}>{t('enrollment.success_page.congrats')}</h1>
            <p className={cn('mt-2 text-[15px]', BODY_TEXT)}>{t('enrollment.success_page.activated')}</p>
          </div>

          <div className={cn('space-y-3 border-t pt-5 text-left', RULE)}>
            <p className={SECTION_LABEL}>{t('enrollment.success_page.what_next')}</p>
            {nextStepKeys.map((key, i) => {
              const Icon = nextStepIcons[i]
              return (
                <div key={key} className="flex items-center gap-3">
                  <IconChip Icon={Icon} tone="blue" small />
                  <span className={cn('text-sm', BODY_TEXT)}>{t(`enrollment.success_page.${key}`)}</span>
                </div>
              )
            })}
          </div>

          <button type="button" onClick={() => void handleDashboard()} className={cn(PILL_PRIMARY, 'w-full')}>
            {t('enrollment.success_page.dashboard')}
          </button>
        </Card>
      </div>
    </AnimatedPage>
  )
}
