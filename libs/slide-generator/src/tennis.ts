import { mvpSlides, type MvpSlideDocument, type MvpSlideRow } from './mvp-slide.ts'

const TENNIS_THEME = {
  sportSlug: 'tennis',
  label: 'Tennis',
  accent: '#0c5c38',
} as const

export function tennisSlides(rows: readonly MvpSlideRow[]): MvpSlideDocument[] {
  return mvpSlides(TENNIS_THEME, rows)
}
