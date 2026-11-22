/**
 * Studio message keys for shell chrome and editorial empty screens.
 *
 * Naming: `<surface>.<role>` with kebab segments
 * (`nav.pocetna`, `chrome.log-out`, `sportasi.lead`).
 * Surfaces this catalog owns: `nav`, `chrome`, each empty-screen id
 * (`pocetna`, `sportasi`, `objave`, `postavke`), and `shell-home` (retired
 * editor stub). Stable string ids — do not rename casually; a later locale
 * file uses the same keys.
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
  'postavke.clocks-heading',
  'postavke.clock-label',
  'postavke.clock-time',
  'postavke.clock-active',
  'postavke.save',
  'postavke.save-success',
  'postavke.save-error',
  'postavke.load-error',
  'postavke.loading',
  'postavke.clock-time-invalid',
  'postavke.accounts-heading',
  'postavke.accounts-lead',
  'postavke.login-checked',
  'postavke.login-unchecked',
  'postavke.network.instagram',
  'postavke.network.facebook',
  'postavke.network.x',
] as const

export type MessageKey = (typeof MESSAGE_KEYS)[number]

export type MessageMap = Record<MessageKey, string>
