import { appearanceEntries, type AppearanceSlideInput } from './appearance-slides.ts'
import type { FootballEntry } from './slides.ts'

export type CatalogAppearance = AppearanceSlideInput

export function catalogSlides(appearances: readonly CatalogAppearance[]): FootballEntry[] {
  return appearanceEntries(appearances)
}
