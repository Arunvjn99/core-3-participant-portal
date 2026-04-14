export type UserFinancials = {
  totalBalance: number
  vestedBalance: number
  maxLoan: number
}

export function getUserFinancials(): UserFinancials {
  const vestedBalance = 16_000
  const totalBalance = 20_000
  const maxLoan = Math.round(vestedBalance * 0.5)

  return { totalBalance, vestedBalance, maxLoan }
}
