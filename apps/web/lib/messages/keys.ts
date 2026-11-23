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
  'reprezentacija.title',
  'reprezentacija.lead',
  'reprezentacija.sport-aria',
  'reprezentacija.past',
  'reprezentacija.current',
  'reprezentacija.upcoming',
] as const

export type MessageKey = (typeof MESSAGE_KEYS)[number]

export type MessageMap = Record<MessageKey, string>
