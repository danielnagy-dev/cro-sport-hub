import type { SportSlug } from '@cro-sport-hub/shared-types'

export const sportOrder = [
  'tennis',
  'football',
  'basketball',
] as const satisfies readonly SportSlug[]

export const sportLabel: Record<SportSlug, string> = {
  tennis: 'Tennis',
  football: 'Football',
  basketball: 'Basketball',
}

export function nextSport(current: SportSlug, key: string): SportSlug | undefined {
  const index = sportOrder.indexOf(current)

  if (key === 'Home') return sportOrder[0]
  if (key === 'End') return sportOrder[sportOrder.length - 1]
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return sportOrder[(index + 1) % sportOrder.length]
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return sportOrder[(index - 1 + sportOrder.length) % sportOrder.length]
  }

  return undefined
}
