import { describe, expect, test } from 'vite-plus/test'
import { blockingViolations, formatBlockingSummary } from './axe-impact.ts'

const violation = (impact: string) => ({
  id: 'color-contrast',
  impact,
  description: 'Elements must have sufficient color contrast',
  nodes: [{}],
})

describe('blockingViolations', () => {
  test('ignores minor and moderate impacts', () => {
    expect(blockingViolations([violation('minor')])).toEqual([])
    expect(blockingViolations([violation('moderate')])).toEqual([])
  })

  test('keeps serious and critical impacts', () => {
    expect(blockingViolations([violation('serious')])).toHaveLength(1)
    expect(blockingViolations([violation('critical')])).toHaveLength(1)
  })

  test('summarizes blocking violations for the report', () => {
    const summary = formatBlockingSummary([violation('serious')])
    expect(summary).toContain('color-contrast')
    expect(summary).toContain('serious')
  })
})
