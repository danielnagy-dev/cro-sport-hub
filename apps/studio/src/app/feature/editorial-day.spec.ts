import { expect } from 'vite-plus/test'
import { editorialDayLabel, shiftEditorialDay, startOfLocalDay } from './editorial-day'

describe('editorial day helpers', () => {
  it('formats a pinned day in hr-HR', () => {
    const day = new Date(Date.UTC(2026, 10, 22, 12, 0, 0))
    expect(editorialDayLabel(day, 'UTC')).toMatch(/2026/)
    expect(editorialDayLabel(day, 'UTC')).toMatch(/22/)
  })

  it('shifts by calendar day without mutating the source', () => {
    const day = startOfLocalDay(new Date(2026, 10, 22))
    const previous = shiftEditorialDay(day, -1)
    const next = shiftEditorialDay(day, 1)
    expect(previous.getDate()).toBe(21)
    expect(next.getDate()).toBe(23)
    expect(day.getDate()).toBe(22)
  })
})
