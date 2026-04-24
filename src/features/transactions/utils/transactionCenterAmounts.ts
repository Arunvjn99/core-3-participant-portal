/**
 * Plan rules for Transaction Center quick-action amounts (illustrative / demo).
 * Loan: up to 50% of vested. Withdraw available line: full vested balance.
 */
export function computeLoanEligible(vestedBalance: number): number {
  return vestedBalance * 0.5
}

/** Amount shown for “Available: $X” on withdraw — full vested balance per plan rules. */
export function computeWithdrawable(vestedBalance: number): number {
  return vestedBalance
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
