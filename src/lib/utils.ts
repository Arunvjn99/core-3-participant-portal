/** Format a number as USD currency */
export function formatCurrency(amount: number, compact = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount)
}

/** Format a date to a readable string */
export function formatDate(date: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: style }).format(new Date(date))
}

/** Truncate a string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/** Delay execution for ms milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Check if we're in a browser environment */
export const isBrowser = typeof window !== 'undefined'
