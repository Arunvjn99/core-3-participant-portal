import { useState } from 'react'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { Select } from '../../../design-system/components/Select'
import { TransactionSummary } from '../components/TransactionSummary'

const fundOptions = [
  { value: 'target-2050', label: 'Target Date 2050' },
  { value: 'us-equity', label: 'US Equity Index' },
  { value: 'intl-equity', label: 'International Equity' },
  { value: 'bond-index', label: 'Bond Index' },
  { value: 'stable-value', label: 'Stable Value' },
]

export function FundTransfer() {
  const [from, setFrom] = useState(fundOptions[0].value)
  const [to, setTo] = useState(fundOptions[1].value)
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <AnimatedPage className="p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Fund Transfer</h1>
        <p className="text-text-secondary mb-6">
          Move money between investment funds in your account.
        </p>

        {!submitted ? (
          <div className="flex flex-col gap-4">
            <Select label="From fund" options={fundOptions} value={from} onChange={(e) => setFrom(e.target.value)} />
            <Select label="To fund" options={fundOptions} value={to} onChange={(e) => setTo(e.target.value)} />
            <Input
              label="Transfer amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={() => setSubmitted(true)} disabled={!amount || from === to} className="w-full">
              Transfer funds
            </Button>
          </div>
        ) : (
          <TransactionSummary
            type="Fund Transfer"
            amount={parseFloat(amount)}
            fromAccount={fundOptions.find((f) => f.value === from)?.label}
            toAccount={fundOptions.find((f) => f.value === to)?.label}
            estimatedDate={new Date(Date.now() + 86400000).toISOString()}
            status="pending"
          />
        )}
      </div>
    </AnimatedPage>
  )
}

export default FundTransfer
