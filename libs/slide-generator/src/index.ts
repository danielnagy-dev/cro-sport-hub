export const packageId = '@cro-sport-hub/slide-generator'

export { catalogSlides } from './catalog-slides.ts'
export { renderAppearancePngs, slidesFromAppearance } from './appearance-slides.ts'
export { basketballSlides } from './basketball.ts'
export { tennisSlides } from './tennis.ts'
export { designRound, footballTemplate, slideHeight, slideWidth } from './football.ts'
export { footballSlides } from './slides.ts'
export {
  embedFontsInFootballHtml,
  footballRendererReason,
  renderFootballPngs,
  renderHtmlPngs,
} from './render.ts'
export type {
  Colourway,
  FootballDocument,
  FootballFixture,
  FootballOptions,
  FootballPerson,
  FootballSlide,
  FootballStatInput,
} from './football.ts'
export type { FootballEntry } from './slides.ts'
export type { CatalogAppearance } from './catalog-slides.ts'
export type {
  AppearanceSlideDocument,
  AppearanceSlideInput,
  AppearanceSlidePayload,
  AppearanceSportSlug,
  FootballAppearanceDocument,
} from './appearance-slides.ts'
export type { MvpSlideDocument, MvpSlideRow } from './mvp-slide.ts'
