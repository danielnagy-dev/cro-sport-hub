import { mvpSlides, type MvpSlideDocument, type MvpSlideRow } from './mvp-slide.ts'

const TENNIS_THEME = {
  sportSlug: 'tennis',
  label: 'Tennis',
  accent: '#0c5c38',
} as const

/** Text-forward tennis MVP slides (1080×1350). Placeholders until a design pass. */
export function tennisSlides(rows: readonly MvpSlideRow[]): MvpSlideDocument[] {
  return mvpSlides(TENNIS_THEME, rows)
}
