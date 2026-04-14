export const LOAN_AI_ANNUAL_RATE_PERCENT = 8
export const LOAN_AI_TENURE_MONTHS = 36

export function calculateEMI(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0
  const r = annualRatePercent / 100 / 12
  if (r === 0) return principal / tenureMonths
  const f = Math.pow(1 + r, tenureMonths)
  return (principal * r * f) / (f - 1)
}

export type SchedulePreviewRow = {
  month: number
  dueDateLabel: string
  payment: number
  principal: number
  interest: number
  balanceAfter: number
}

export function generateSchedule(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
  previewMonths: number = 3,
): { emi: number; rows: SchedulePreviewRow[] } {
  const emiRaw = calculateEMI(principal, annualRatePercent, tenureMonths)
  const emi = Math.round(emiRaw * 100) / 100
  const r = annualRatePercent / 100 / 12
  let balance = principal
  const rows: SchedulePreviewRow[] = []
  const n = Math.min(previewMonths, tenureMonths)

  const anchorYear = 2026
  const anchorMonthIndex = 3

  for (let m = 1; m <= n; m++) {
    const interest = Math.round(balance * r * 100) / 100
    let principalPart = Math.round((emi - interest) * 100) / 100
    if (principalPart > balance) principalPart = Math.round(balance * 100) / 100
    if (m === tenureMonths) principalPart = Math.round(balance * 100) / 100
    const payment = Math.round((principalPart + interest) * 100) / 100
    balance = Math.round((balance - principalPart) * 100) / 100
    if (balance < 0) balance = 0

    const d = new Date(Date.UTC(anchorYear, anchorMonthIndex + m - 1, 1))
    const dueDateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

    rows.push({ month: m, dueDateLabel, payment, principal: principalPart, interest, balanceAfter: balance })
  }

  return { emi, rows }
}
