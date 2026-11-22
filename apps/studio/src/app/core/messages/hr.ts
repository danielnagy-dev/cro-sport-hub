import type { MessageMap } from './keys'

/** Default locale map for Studio. Add `en.ts` (etc.) beside this file later. */
export const hrMessages = {
  'nav.pocetna': 'Početna',
  'nav.sportasi': 'Sportaši',
  'nav.objave': 'Objave',
  'nav.postavke': 'Postavke',
  'chrome.skip': 'Preskoči na sadržaj',
  'chrome.heading': 'Studio',
  'chrome.log-out': 'Odjava',
  'chrome.nav-aria': 'Odjeljci studija',
  'pocetna.title': 'Početna',
  'pocetna.lead': 'Uređivački početni zaslon — uskoro.',
  'pocetna.admin-only': 'Admin stranice zahtijevaju admin prijavu.',
  'sportasi.skip': 'Preskoči na popis sportaša',
  'sportasi.title': 'Sportaši',
  'sportasi.lead': 'Popis sportaša — uskoro.',
  'objave.skip': 'Preskoči na objave',
  'objave.title': 'Objave',
  'objave.lead': 'Red objava — uskoro.',
  'postavke.skip': 'Preskoči na postavke',
  'postavke.title': 'Postavke',
  'postavke.lead': 'Postavke studija — uskoro.',
} as const satisfies MessageMap
