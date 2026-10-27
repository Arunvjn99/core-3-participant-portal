export const PASSWORD_RULES = {
  length: (p: string) => p.length >= 8,
  upper: (p: string) => /[A-Z]/.test(p),
  lower: (p: string) => /[a-z]/.test(p),
  number: (p: string) => /\d/.test(p),
  symbol: (p: string) => /[^A-Za-z0-9]/.test(p),
}
export type PasswordRuleKey = keyof typeof PASSWORD_RULES
