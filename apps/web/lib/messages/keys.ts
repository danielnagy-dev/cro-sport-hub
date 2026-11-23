export const MESSAGE_KEYS = [
  'nav.pocetna',
  'nav.sportasi',
  'nav.reprezentacija',
  'chrome.skip',
  'chrome.nav-aria',
  'chrome.brand',
  'layout.description',
  'sportasi.title',
  'sportasi.lead',
  'sportasi.sports-aria',
  'reprezentacija.title',
  'reprezentacija.lead',
] as const

export type MessageKey = (typeof MESSAGE_KEYS)[number]

export type MessageMap = Record<MessageKey, string>
