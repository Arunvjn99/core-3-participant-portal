import { useState } from 'react'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { Select } from '../../../design-system/components/Select'
import { TransactionSummary } from '../components/TransactionSummary'

const rolloverTypes = [
  { value: 'ira-to-401k', label: 'IRA → 401(k)' },
  { value: '401k-to-ira', label: '401(k) → IRA' },
  { value: '401k-to-401k', label: '401(k) → 401(k)' },
]

export function Rollover() {
  const [type, setType] = useState(rolloverTypes[0].value)
  const [amount, setAmount] = useState('')
  const [institution, setInstitution] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <AnimatedPage className="p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Rollover</h1>
        <p className="text-text-secondary mb-6">
          Roll over funds from another retirement account without tax penalties.
        </p>

        {!submitted ? (
          <div className="flex flex-col gap-4">
            <Select label="Rollover type" options={rolloverTypes} value={type} onChange={(e) => setType(e.target.value)} />
            <Input
              label="Source institution"
              type="text"
              placeholder="e.g. Fidelity, Vanguard"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            <Input
              label="Rollover amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={() => setSubmitted(true)} disabled={!amount || !institution} className="w-full">
              Submit rollover
            </Button>
          </div>
        ) : (
          <TransactionSummary
            type="Rollover"
            amount={parseFloat(amount)}
            fromAccount={institution}
            toAccount="401(k) Safe Harbor"
            estimatedDate={new Date(Date.now() + 14 * 86400000).toISOString()}
            status="pending"
          />
        )}
      </div>
    </AnimatedPage>
  )
}

export default Rollover
