/** axe violation impacts that fail `verify:visitor`. Minor and moderate are ignored. */
const blockingImpacts = new Set(['serious', 'critical'])

export type AxeViolation = {
  id: string
  impact?: string
  description: string
  nodes: readonly unknown[]
}

export function blockingViolations(violations: readonly AxeViolation[]): readonly AxeViolation[] {
  return violations.filter(
    (violation) => violation.impact !== undefined && blockingImpacts.has(violation.impact),
  )
}

export function formatBlockingSummary(violations: readonly AxeViolation[]): string {
  if (violations.length === 0) return ''
  return violations
    .map(
      (violation) => `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.description}`,
    )
    .join('; ')
}
