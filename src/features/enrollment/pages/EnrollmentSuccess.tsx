import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { CheckCircle, Mail, Calendar, BarChart3 } from 'lucide-react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { supabase } from '@/core/supabase'
import { ROUTES } from '@/lib/constants'

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
          await supabase.from('enrollments').update(row).eq('id', existing.id)
        } else {
          await supabase.from('enrollments').insert(row)
        }
      }
    }
    useEnrollmentDraftStore.getState().setEnrollmentStatus('complete')
    navigate(ROUTES.POST_ENROLLMENT_DASHBOARD)
  }

  return (
    <AnimatedPage>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-gray-900 dark:text-white">{t('enrollment.success_page.congrats')}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
              {t('enrollment.success_page.activated')}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl bg-gray-50 p-5 text-left dark:bg-gray-800">
            <p className="text-gray-700 dark:text-gray-300" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {t('enrollment.success_page.what_next')}
            </p>
            {nextStepKeys.map((key, i) => {
              const Icon = nextStepIcons[i]
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.85rem' }}>
                    {t(`enrollment.success_page.${key}`)}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            data-brand="primary"
            onClick={() => void handleDashboard()}
            className="w-full rounded-xl py-3.5 font-medium transition-all active:scale-[0.98]"
          >
            {t('enrollment.success_page.dashboard')}
          </button>
        </div>
      </div>
    </AnimatedPage>
  )
}
