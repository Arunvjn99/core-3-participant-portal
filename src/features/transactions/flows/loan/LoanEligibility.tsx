import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  DollarSign,
  Percent,
  Calendar,
  TrendingDown,
  Wallet,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

function LoanEligibility() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const eligibilityRows = useMemo(
    () => [
      {
        icon: <DollarSign className="h-5 w-5" />,
        labelKey: 'loan.eligibility_max_loan' as const,
        value: '$10,000',
        bg: 'var(--c-blue-tint)',
        color: 'var(--brand-primary)',
      },
      {
        icon: <Wallet className="h-5 w-5" />,
        labelKey: 'loan.eligibility_outstanding' as const,
        value: '$0',
        bg: 'rgba(16,185,129,0.1)',
        color: '#10B981',
      },
      {
        icon: <DollarSign className="h-5 w-5" />,
        labelKey: 'loan.eligibility_available_balance' as const,
        value: '$10,000',
        bg: 'var(--c-blue-tint)',
        color: 'var(--brand-primary)',
      },
      {
        icon: <Percent className="h-5 w-5" />,
        labelKey: 'loan.eligibility_interest_rate' as const,
        value: '8%',
        bg: 'var(--c-blue-tint)',
        color: 'var(--brand-purple-light)',
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        labelKey: 'loan.eligibility_max_term' as const,
        value: t('loan.eligibility_max_term_value'),
        bg: 'var(--c-blue-tint)',
        color: '#0EA5E9',
      },
      {
        icon: <TrendingDown className="h-5 w-5" />,
        labelKey: 'loan.eligibility_payment_range' as const,
        value: '$96 - $203',
        bg: 'rgba(245,158,11,0.1)',
        color: '#F59E0B',
      },
    ],
    [t],
  )

  const restrictionKeys = [
    'loan.eligibility_restriction_1',
    'loan.eligibility_restriction_2',
    'loan.eligibility_restriction_3',
    'loan.eligibility_restriction_4',
    'loan.eligibility_restriction_5',
  ] as const

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2
          style={{ fontSize: 26, fontWeight: 800, color: 'inherit', letterSpacing: '-0.5px', lineHeight: '34px', marginBottom: 8 }}
        >
          {t('loan.eligibility_title')}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'inherit', lineHeight: '22px' }}>{t('loan.eligibility_subtitle')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
      >
        <div
          style={{
            background: 'transparent',
            borderRadius: 16,
            border: '1px solid var(--tx-border-light, #F1F5F9)',
            padding: '24px 28px',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'inherit', letterSpacing: '-0.3px', marginBottom: 20 }}>
            {t('loan.eligibility_card_title')}
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {eligibilityRows.map((item, index) => (
              <motion.div
                key={item.labelKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.04, duration: 0.3 }}
                className="flex items-start gap-4"
              >
                <div
                  className="flex flex-shrink-0 items-center justify-center"
                  style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'inherit', marginBottom: 4 }}>{t(item.labelKey)}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'inherit', letterSpacing: '-0.3px' }}>{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        <div
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid var(--c-border-amber)',
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'inherit', letterSpacing: '-0.3px', marginBottom: 12 }}>
            {t('loan.eligibility_restrictions_title')}
          </h4>
          <ul className="space-y-2.5">
            {restrictionKeys.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 flex-shrink-0 rounded-full"
                  style={{ width: 6, height: 6, background: 'var(--c-amber)' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'inherit', lineHeight: '20px' }}>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
      >
        <div
          className="flex items-start gap-3"
          style={{
            background: 'var(--c-blue-tint)',
            border: '1px solid var(--c-border-blue)',
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 4 }}>
              {t('loan.eligibility_docs_title')}
            </p>
            <p className="leading-relaxed" style={{ fontSize: 12, fontWeight: 500, color: 'var(--brand-primary)' }}>
              {t('loan.eligibility_docs_body')}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between gap-3" style={{ paddingTop: 16 }}>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="flex min-h-[2.75rem] flex-1 cursor-pointer items-center justify-center gap-2 transition-all duration-200 sm:flex-none"
          style={{
            background: 'transparent',
            border: 'var(--c-border)',
            color: 'inherit',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          {t('transactions.cancel')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/transactions/loan/simulator')}
          className="btn-brand flex flex-1 cursor-pointer items-center justify-center gap-2 transition-all duration-200 sm:flex-none"
        >
          {t('loan.eligibility_simulate')}
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  )
}

export default LoanEligibility
