export type LoanFlowPurpose = 'general' | 'home' | 'medical' | 'education'

export type ParsedLoanInput = {
  amount: number | null
  purpose: LoanFlowPurpose
}

export function parseLoanInput(input: string): ParsedLoanInput {
  const text = input.toLowerCase().trim()

  let amount: number | null = null

  const compact = text.match(/\b(\d{3,6})\b/)
  if (compact) {
    const n = parseInt(compact[1], 10)
    if (!Number.isNaN(n) && n >= 100 && n <= 500_000) amount = n
  }

  if (amount == null) {
    const money = text.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)\b/)
    if (money) {
      const n = Math.round(parseFloat(money[1].replace(/,/g, '')))
      if (!Number.isNaN(n) && n >= 100 && n <= 500_000) amount = n
    }
  }

  let purpose: LoanFlowPurpose = 'general'
  if (/\b(house|home|build|building|residence|mortgage|primary residence)\b/.test(text)) purpose = 'home'
  else if (/\b(medical|health|hospital)\b/.test(text)) purpose = 'medical'
  else if (/\b(education|tuition|college|school)\b/.test(text)) purpose = 'education'

  return { amount, purpose }
}

export function purposeDisplayLabel(purpose: LoanFlowPurpose): string {
  switch (purpose) {
    case 'home': return 'Home / primary residence'
    case 'medical': return 'Medical'
    case 'education': return 'Education'
    default: return 'General'
  }
}

export function purposeToLoanTypeId(purpose: LoanFlowPurpose): string {
  return purpose === 'home' ? 'residential' : 'general'
}
