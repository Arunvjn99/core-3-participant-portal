/* eslint-disable react-refresh/only-export-components -- route module: lazy page chunks + router factory */
import { lazy, Suspense, useState, useEffect } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import PreEnrollmentDashboard from '@/features/dashboard/pages/PreEnrollmentDashboard'
import PostEnrollmentDashboard from '@/features/dashboard/pages/PostEnrollmentDashboard'
import { RootLayout, RootErrorBoundary } from './layouts/RootLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { AppShell } from './layouts/AppShell'
import { ValidatedVersionRoute } from './guards/ValidatedVersionRoute'
import { ProtectedRoute } from '../core/auth/ProtectedRoute'
import { EnrollmentShell } from '../features/enrollment/components/EnrollmentShell'
import { supabase } from '../core/supabase'

// Auth pages — new two-panel design
import LoginPage from '../features/auth/pages/LoginPage'
import SignupPage from '../features/auth/pages/SignupPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import WhiteLabelAuth from '../features/auth/components/WhiteLabelAuth'

// Enrollment pages
import PlanSelection from '../features/enrollment/pages/PlanSelection'
import Contribution from '../features/enrollment/pages/Contribution'
import ContributionSource from '../features/enrollment/pages/ContributionSource'
import AutoIncrease from '../features/enrollment/pages/AutoIncrease'
import AutoIncreaseSetup from '../features/enrollment/pages/AutoIncreaseSetup'
import InvestmentStrategy from '../features/enrollment/pages/InvestmentStrategy'
import RetirementReadiness from '../features/enrollment/pages/RetirementReadiness'
import ReviewEnrollment from '../features/enrollment/pages/ReviewEnrollment'
import EnrollmentSuccess from '../features/enrollment/pages/EnrollmentSuccess'

// Transaction pages
import TransactionsPage from '../features/transactions/pages/TransactionsPage'
import LoanFlowLayout from '../features/transactions/flows/loan/LoanFlowLayout'
import LoanEligibility from '../features/transactions/flows/loan/LoanEligibility'
import LoanSimulator from '../features/transactions/flows/loan/LoanSimulator'
import LoanConfiguration from '../features/transactions/flows/loan/LoanConfiguration'
import LoanFees from '../features/transactions/flows/loan/LoanFees'
import LoanDocuments from '../features/transactions/flows/loan/LoanDocuments'
import LoanReview from '../features/transactions/flows/loan/LoanReview'
import WithdrawalFlowLayout from '../features/transactions/flows/withdrawal/WithdrawalFlowLayout'
import WithdrawalEligibility from '../features/transactions/flows/withdrawal/WithdrawalEligibility'
import WithdrawalType from '../features/transactions/flows/withdrawal/WithdrawalType'
import WithdrawalSource from '../features/transactions/flows/withdrawal/WithdrawalSource'
import WithdrawalFees from '../features/transactions/flows/withdrawal/WithdrawalFees'
import WithdrawalPayment from '../features/transactions/flows/withdrawal/WithdrawalPayment'
import WithdrawalReview from '../features/transactions/flows/withdrawal/WithdrawalReview'
import TransferFlowLayout from '../features/transactions/flows/transfer/TransferFlowLayout'
import TransferType from '../features/transactions/flows/transfer/TransferType'
import TransferSourceFunds from '../features/transactions/flows/transfer/TransferSourceFunds'
import TransferDestination from '../features/transactions/flows/transfer/TransferDestination'
import TransferAmount from '../features/transactions/flows/transfer/TransferAmount'
import TransferImpact from '../features/transactions/flows/transfer/TransferImpact'
import TransferReview from '../features/transactions/flows/transfer/TransferReview'
import RebalanceFlowLayout from '../features/transactions/flows/rebalance/RebalanceFlowLayout'
import RebalanceCurrentAllocation from '../features/transactions/flows/rebalance/RebalanceCurrentAllocation'
import RebalanceAdjustAllocation from '../features/transactions/flows/rebalance/RebalanceAdjustAllocation'
import RebalanceTradePreview from '../features/transactions/flows/rebalance/RebalanceTradePreview'
import RebalanceReview from '../features/transactions/flows/rebalance/RebalanceReview'
import RolloverFlowLayout from '../features/transactions/flows/rollover/RolloverFlowLayout'
import RolloverValidation from '../features/transactions/flows/rollover/RolloverValidation'
import RolloverPlanDetails from '../features/transactions/flows/rollover/RolloverPlanDetails'
import RolloverAllocation from '../features/transactions/flows/rollover/RolloverAllocation'
import RolloverDocuments from '../features/transactions/flows/rollover/RolloverDocuments'
import RolloverReview from '../features/transactions/flows/rollover/RolloverReview'

// Legacy versioned auth pages
const Login = lazy(() => import('../features/auth/pages/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('../features/auth/pages/Signup').then((m) => ({ default: m.Signup })))
const VerifyOTP = lazy(() => import('../features/auth/pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })))
const ForgotPassword = lazy(() => import('../features/auth/pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('../features/auth/pages/ResetPassword').then((m) => ({ default: m.ResetPassword })))

// Lazy app pages
const InvestmentsPage = lazy(() => import('../features/investments/pages/InvestmentsPage'))
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

// ─── Spinner fallback ────────────────────────────────────────────────────────

const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
)

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
)

// ─── Auth Guard ──────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  // null = not yet loaded, undefined = loaded but no session
  const [session, setSession] = useState<object | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) {
      // Demo mode — always allow access
      setSession({})
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem('enrollment_draft')
        } catch {
          /* ignore */
        }
        useEnrollmentDraftStore.getState().resetEnrollment()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Dashboard route (enrollment-aware) ──────────────────────────────────────

function DashboardRoute() {
  const [showPost, setShowPost] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkEnrollment() {
      if (!supabase) {
        setShowPost(false)
        setLoading(false)
        return
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .maybeSingle()
      setShowPost(!!data)
      setLoading(false)
    }
    void checkEnrollment()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: 'var(--brand-primary, #2563eb)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }

  return showPost ? <PostEnrollmentDashboard /> : <PreEnrollmentDashboard />
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      // Public auth routes — redirect root to /login
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'v1/login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'v1/signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'v1/forgot-password', element: <ForgotPasswordPage /> },
      { path: 'auth', element: <WhiteLabelAuth /> },

      // Legacy versioned auth (keeps old URLs working)
      {
        path: ':version',
        element: <ValidatedVersionRoute />,
        children: [
          // Carousel + form layout is implemented inside VerifyOTP (not router AuthLayout).
          { path: 'verify', element: withSuspense(VerifyOTP) },
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: withSuspense(Login) },
              { path: 'signup', element: withSuspense(Signup) },
              { path: 'forgot-password', element: withSuspense(ForgotPassword) },
              { path: 'reset-password', element: withSuspense(ResetPassword) },
            ],
          },
        ],
      },

      // Enrollment (no auth guard — users may enroll before full auth)
      {
        path: 'enrollment',
        element: <EnrollmentShell />,
        children: [
          { index: true, element: <Navigate to="plan" replace /> },
          { path: 'source', element: <Navigate to="/enrollment/contribution-source" replace /> },
          { path: 'plan', element: <PlanSelection /> },
          { path: 'contribution', element: <Contribution /> },
          { path: 'contribution-source', element: <ContributionSource /> },
          { path: 'auto-increase', element: <AutoIncrease /> },
          { path: 'auto-increase-setup', element: <AutoIncreaseSetup /> },
          { path: 'investment', element: <InvestmentStrategy /> },
          { path: 'readiness', element: <RetirementReadiness /> },
          { path: 'review', element: <ReviewEnrollment /> },
          { path: 'success', element: <EnrollmentSuccess /> },
        ],
      },

      // Protected app routes — require auth session
      {
        element: (
          <AuthGuard>
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          </AuthGuard>
        ),
        children: [
          { path: 'dashboard', element: <DashboardRoute /> },
          { path: 'investments', element: withSuspense(InvestmentsPage) },
          { path: 'profile', element: withSuspense(ProfilePage) },
          { path: 'transactions', element: <TransactionsPage /> },
          {
            path: 'transactions/loan',
            element: <LoanFlowLayout />,
            children: [
              { index: true, element: <LoanEligibility /> },
              { path: 'simulator', element: <LoanSimulator /> },
              { path: 'configuration', element: <LoanConfiguration /> },
              { path: 'fees', element: <LoanFees /> },
              { path: 'documents', element: <LoanDocuments /> },
              { path: 'review', element: <LoanReview /> },
            ],
          },
          {
            path: 'transactions/withdrawal',
            element: <WithdrawalFlowLayout />,
            children: [
              { index: true, element: <WithdrawalEligibility /> },
              { path: 'type', element: <WithdrawalType /> },
              { path: 'source', element: <WithdrawalSource /> },
              { path: 'fees', element: <WithdrawalFees /> },
              { path: 'payment', element: <WithdrawalPayment /> },
              { path: 'review', element: <WithdrawalReview /> },
            ],
          },
          {
            path: 'transactions/transfer',
            element: <TransferFlowLayout />,
            children: [
              { index: true, element: <TransferType /> },
              { path: 'source', element: <TransferSourceFunds /> },
              { path: 'destination', element: <TransferDestination /> },
              { path: 'amount', element: <TransferAmount /> },
              { path: 'impact', element: <TransferImpact /> },
              { path: 'review', element: <TransferReview /> },
            ],
          },
          {
            path: 'transactions/rebalance',
            element: <RebalanceFlowLayout />,
            children: [
              { index: true, element: <RebalanceCurrentAllocation /> },
              { path: 'adjust', element: <RebalanceAdjustAllocation /> },
              { path: 'trades', element: <RebalanceTradePreview /> },
              { path: 'review', element: <RebalanceReview /> },
            ],
          },
          {
            path: 'transactions/rollover',
            element: <RolloverFlowLayout />,
            children: [
              { index: true, element: <RolloverPlanDetails /> },
              { path: 'validation', element: <RolloverValidation /> },
              { path: 'allocation', element: <RolloverAllocation /> },
              { path: 'documents', element: <RolloverDocuments /> },
              { path: 'review', element: <RolloverReview /> },
            ],
          },
        ],
      },
    ],
  },
])

export default router
