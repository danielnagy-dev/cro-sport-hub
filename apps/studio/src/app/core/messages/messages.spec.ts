import { expect } from 'vite-plus/test'
import { hrMessages, MESSAGE_KEYS, resolveMessage, t } from './index'
import type { MessageMap } from './keys'

describe('Studio message catalog', () => {
  it('resolves every key to a non-empty HR string', () => {
    for (const key of MESSAGE_KEYS) {
      const value = t(key)
      expect(value.length).toBeGreaterThan(0)
      expect(value).toBe(hrMessages[key])
    }
  })

  it('returns HR nav and stub chrome', () => {
    expect(t('nav.pocetna')).toBe('Početna')
    expect(t('nav.sportasi')).toBe('Sportaši')
    expect(t('nav.objave')).toBe('Objave')
    expect(t('nav.postavke')).toBe('Postavke')
    expect(t('chrome.heading')).toBe('Studio')
    expect(t('chrome.log-out')).toBe('Odjava')
    expect(t('pocetna.title')).toBe('Početna')
    expect(t('shell-home.lead')).toBe('Odaberite odjeljak u navigaciji iznad.')
    expect(t('sportasi.lead')).toBe('Nema sportaša za odabrani sport.')
    expect(t('objave.lead')).toBe('Red objava — uskoro.')
    expect(t('postavke.lead')).toBe('Postavke studija — uskoro.')
  })

  it('throws on a missing key (no silent fallback)', () => {
    const incomplete = { 'nav.pocetna': 'Početna' } as Partial<MessageMap>
    expect(() => resolveMessage(incomplete, 'nav.sportasi')).toThrowError(
      'Missing Studio message: nav.sportasi',
    )
    expect(() => resolveMessage(incomplete, 'not.a.real.key')).toThrowError(
      'Missing Studio message: not.a.real.key',
    )
  })

  it('accepts an alternate map for a typed key', () => {
    const en = { ...hrMessages, 'nav.pocetna': 'Home' } satisfies MessageMap
    expect(t('nav.pocetna', en)).toBe('Home')
  })
})
