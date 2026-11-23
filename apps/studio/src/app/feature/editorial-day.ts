const DAY_LABEL_OPTIONS = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
} as const

export function startOfLocalDay(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function shiftEditorialDay(day: Date, deltaDays: number): Date {
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  next.setDate(next.getDate() + deltaDays)
  return next
}

export function editorialDayLabel(day: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    ...DAY_LABEL_OPTIONS,
    ...(timeZone !== undefined ? { timeZone } : {}),
  }).format(day)
}
