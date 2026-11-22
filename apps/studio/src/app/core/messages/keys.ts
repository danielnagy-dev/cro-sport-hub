/**
 * Studio message keys for shell chrome and editorial empty screens.
 *
 * Naming: `<surface>.<role>` with kebab segments
 * (`nav.pocetna`, `chrome.log-out`, `sportasi.lead`).
 * Surfaces: `nav`, `chrome`, empty-screen ids, `publish-drawer`, `shell-home`.
 * Stable string ids — do not rename casually; a later locale file uses the same keys.
 */
export const MESSAGE_KEYS = [
  'nav.pocetna',
  'nav.sportasi',
  'nav.objave',
  'nav.postavke',
  'chrome.skip',
  'chrome.heading',
  'chrome.log-out',
  'chrome.nav-aria',
  'pocetna.title',
  'pocetna.lead',
  'pocetna.admin-only',
  'shell-home.lead',
  'sportasi.skip',
  'sportasi.title',
  'sportasi.lead',
  'objave.skip',
  'objave.title',
  'objave.lead',
  'postavke.skip',
  'postavke.title',
  'postavke.lead',
  'publish-drawer.title',
  'publish-drawer.preview',
  'publish-drawer.approve',
  'publish-drawer.slide-order',
  'publish-drawer.error-approve',
] as const

export type MessageKey = (typeof MESSAGE_KEYS)[number]

export type MessageMap = Record<MessageKey, string>
