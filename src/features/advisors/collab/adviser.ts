/** The participant's assigned adviser. Placeholder: matches the card on the dashboard. */
export const ASSIGNED_ADVISER = {
  name: 'Sarah Jenkins',
  initials: 'SJ',
  rating: 4.9,
  yearsExperience: 12,
  clients: '240+',
}

export const MEETING_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

/** Combine a date with a "2:30 PM"-style slot into a timestamp. */
export function slotToTimestamp(day: Date, slot: string): number {
  const [time, meridiem] = slot.split(' ')
  const [h, m] = time.split(':').map(Number)
  const hours = (h % 12) + (meridiem === 'PM' ? 12 : 0)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, m).getTime()
}

export function nextWorkdays(count: number, from: Date): Date[] {
  const days: Date[] = []
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1)
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

/** Suggestions from the adviser. Placeholder content until recommendations come from the adviser's tools. */
export const RECOMMENDATIONS = [
  { id: 'raise_rate', href: '/enrollment/contribution' },
  { id: 'review_allocation', href: '/investments' },
  { id: 'beneficiaries', href: '/profile' },
  { id: 'fees', href: '/fees' },
] as const
