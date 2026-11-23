import { appearanceResultLabel } from './day-list'
import type { PublicAppearance } from './public-editorial-schemas'

export function appearanceWhen(appearance: PublicAppearance): string {
  return appearance.startsAt.slice(0, 10)
}

export { appearanceResultLabel as appearanceScoreLabel }
