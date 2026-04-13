import { useNavigate } from 'react-router-dom'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { CheckCircle, Mail, Calendar, BarChart3 } from 'lucide-react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'


const nextSteps = [
  { icon: Calendar, text: 'Contributions start next pay period' },
  { icon: Mail, text: 'Confirmation email will be sent' },
  { icon: BarChart3, text: 'Track savings from dashboard' },
] as const

export default function EnrollmentSuccess() {
  const navigate = useNavigate()

  const handleDashboard = () => {
    const store = useEnrollmentDraftStore.getState()
    store.setEnrollmentStatus('complete')
    navigate('/dashboard')
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
            <h1 className="text-gray-900 dark:text-white">Congratulations!</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
              Your retirement plan has been successfully activated.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl bg-gray-50 p-5 text-left dark:bg-gray-800">
            <p className="text-gray-700 dark:text-gray-300" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              What happens next
            </p>
            {nextSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.85rem' }}>
                    {item.text}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleDashboard}
            className="w-full rounded-xl bg-blue-600 py-3.5 font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </AnimatedPage>
  )
}
