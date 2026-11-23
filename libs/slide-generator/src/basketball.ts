import { mvpSlides, type MvpSlideDocument, type MvpSlideRow } from './mvp-slide.ts'

const BASKETBALL_THEME = {
  sportSlug: 'basketball',
  label: 'Basketball',
  accent: '#8c3412',
} as const

export function basketballSlides(rows: readonly MvpSlideRow[]): MvpSlideDocument[] {
  return mvpSlides(BASKETBALL_THEME, rows)
}
