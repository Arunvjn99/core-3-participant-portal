import { useState } from 'react'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { TransactionSummary } from '../components/TransactionSummary'

export function LoanRequest() {
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <AnimatedPage className="p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Loan Request</h1>
        <p className="text-text-secondary mb-6">
          Borrow from your 401(k) balance. Most plans allow up to 50% of your vested balance.
        </p>

        {!submitted ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Loan amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Minimum $1,000 — Maximum $50,000"
            />
            <Button onClick={() => setSubmitted(true)} disabled={!amount} className="w-full">
              Request loan
            </Button>
          </div>
        ) : (
          <TransactionSummary
            type="Loan"
            amount={parseFloat(amount)}
            fromAccount="401(k) Safe Harbor"
            estimatedDate={new Date(Date.now() + 7 * 86400000).toISOString()}
            status="pending"
          />
        )}
      </div>
    </AnimatedPage>
  )
}

export default LoanRequest
