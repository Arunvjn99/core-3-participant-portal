import { useState } from 'react'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { TransactionSummary } from '../components/TransactionSummary'

export function Withdrawal() {
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <AnimatedPage className="p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Withdrawal</h1>
        <p className="text-text-secondary mb-2">
          Request a distribution from your retirement account.
        </p>
        <div className="rounded-md bg-status-warning-bg px-3 py-2 text-sm text-status-warning mb-6">
          Early withdrawals before age 59½ may be subject to a 10% penalty and income taxes.
        </div>

        {!submitted ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Withdrawal amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={() => setSubmitted(true)} disabled={!amount} className="w-full">
              Request withdrawal
            </Button>
          </div>
        ) : (
          <TransactionSummary
            type="Withdrawal"
            amount={parseFloat(amount)}
            fromAccount="401(k) Safe Harbor"
            estimatedDate={new Date(Date.now() + 5 * 86400000).toISOString()}
            status="pending"
          />
        )}
      </div>
    </AnimatedPage>
  )
}

export default Withdrawal
