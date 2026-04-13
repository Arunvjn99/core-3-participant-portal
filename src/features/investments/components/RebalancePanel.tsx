import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { Button } from '../../../design-system/components/Button'
import { Badge } from '../../../design-system/components/Badge'

interface FundAllocation {
  name: string
  current: number
  target: number
}

const initialAllocations: FundAllocation[] = [
  { name: 'US Equity Index',      current: 45, target: 40 },
  { name: 'International Equity', current: 15, target: 20 },
  { name: 'Bond Index',           current: 30, target: 25 },
  { name: 'Stable Value',         current: 10, target: 15 },
]

export function RebalancePanel() {
  const [allocations, setAllocations] = useState(initialAllocations)
  const [submitted, setSubmitted] = useState(false)

  const totalTarget = allocations.reduce((s, a) => s + a.target, 0)
  const isValid = totalTarget === 100

  const updateTarget = (index: number, value: number) => {
    setAllocations((prev) =>
      prev.map((a, i) => (i === index ? { ...a, target: value } : a))
    )
  }

  if (submitted) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Badge variant="success" className="text-sm px-4 py-1.5">Rebalance submitted</Badge>
          <p className="text-sm text-text-secondary">Your rebalance request has been queued. Changes will apply at next market close.</p>
          <Button variant="secondary" onClick={() => setSubmitted(false)}>Modify</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rebalance Portfolio</CardTitle>
          <Badge variant={isValid ? 'success' : 'danger'}>
            Total: {totalTarget}%
          </Badge>
        </div>
      </CardHeader>

      <div className="flex flex-col gap-5">
        {allocations.map((fund, i) => {
          const drift = fund.target - fund.current
          return (
            <div key={fund.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">{fund.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">Current: {fund.current}%</span>
                  {drift !== 0 && (
                    <span className={drift > 0 ? 'text-status-success' : 'text-status-danger'}>
                      {drift > 0 ? '+' : ''}{drift}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fund.target}
                  onChange={(e) => updateTarget(i, parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-12 text-right text-sm font-semibold text-text-primary">
                  {fund.target}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <Button
          onClick={() => setSubmitted(true)}
          disabled={!isValid}
          className="w-full"
        >
          Submit rebalance
        </Button>
        {!isValid && (
          <p className="mt-2 text-xs text-status-danger text-center">
            Allocations must total exactly 100% (currently {totalTarget}%)
          </p>
        )}
      </div>
    </Card>
  )
}

export default RebalancePanel
