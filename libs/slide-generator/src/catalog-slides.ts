import { appearanceEntries, type AppearanceSlideInput } from './appearance-slides.ts'
import type { FootballEntry } from './slides.ts'

/** Appearance row shape for gallery callers. Same as `AppearanceSlideInput`. */
export type CatalogAppearance = AppearanceSlideInput

/**
 * Maps appearance rows to slide entries. Prefer `slidesFromAppearance` /
 * `renderAppearancePngs` for new editorial callers. Gallery ZIP composition
 * still uses this helper until Phase H.
 */
export function catalogSlides(appearances: readonly CatalogAppearance[]): FootballEntry[] {
  return appearanceEntries(appearances)
}
