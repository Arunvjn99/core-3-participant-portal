import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, ArrowRight, Clock } from 'lucide-react'
import { Button } from '../../../design-system/components/Button'
import { Badge } from '../../../design-system/components/Badge'
import { fadeInUp } from '../../../design-system/motion/variants'
import { useEnrollment } from '../../../core/hooks/useEnrollment'
import { ENROLLMENT_STEPS } from '../../enrollment/enrollmentSteps'

export function EnrollmentCTA() {
  const navigate = useNavigate()
  const { isInProgress, highestCompletedStep } = useEnrollment()

  const resumeStep = ENROLLMENT_STEPS.find(
    (s) => s.step === Math.min(highestCompletedStep + 1, ENROLLMENT_STEPS.length)
  )
  const destination = isInProgress && resumeStep ? `/enrollment/${resumeStep.path}` : '/enrollment/plan'

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-start gap-5 rounded-xl border-2 border-primary bg-primary-subtle p-6 sm:flex-row sm:items-center"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-text-inverse">
        <ClipboardList className="h-7 w-7" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-lg font-bold text-text-primary">
            {isInProgress ? 'Continue your enrolment' : 'Start your enrolment'}
          </h3>
          {isInProgress && <Badge variant="warning">In progress</Badge>}
        </div>
        <p className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Clock className="h-3.5 w-3.5" />
          {isInProgress
            ? `You left off at step ${highestCompletedStep + 1} of ${ENROLLMENT_STEPS.length}`
            : 'Takes about 5 minutes'}
        </p>
        {isInProgress && resumeStep && (
          <p className="mt-1 text-xs font-medium text-primary">
            Next: {resumeStep.label} — {resumeStep.sublabel}
          </p>
        )}
      </div>

      <Button onClick={() => navigate(destination)} className="flex shrink-0 items-center gap-2">
        {isInProgress ? 'Resume' : 'Get started'}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

export default EnrollmentCTA
