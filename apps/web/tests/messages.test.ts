import { expect, test } from 'vite-plus/test'
import { hrMessages, MESSAGE_KEYS, resolveMessage, t } from '../lib/messages'
import type { MessageMap } from '../lib/messages'

test('resolves every key to a non-empty HR string', () => {
  for (const key of MESSAGE_KEYS) {
    const value = t(key)
    expect(value.length).toBeGreaterThan(0)
    expect(value).toBe(hrMessages[key])
  }
})

test('returns HR chrome and stub copy', () => {
  expect(t('nav.pocetna')).toBe('Početna')
  expect(t('nav.sportasi')).toBe('Sportaši')
  expect(t('nav.reprezentacija')).toBe('Reprezentacija')
  expect(t('chrome.skip')).toBe('Preskoči na sadržaj')
  expect(t('chrome.nav-aria')).toBe('Glavna navigacija')
  expect(t('chrome.brand')).toBe('Cro Sport Hub')
  expect(t('sportasi.title')).toBe('Sportaši')
  expect(t('reprezentacija.title')).toBe('Reprezentacija')
  expect(t('reprezentacija.past')).toBe('Prošli')
  expect(t('reprezentacija.current')).toBe('U tijeku')
  expect(t('reprezentacija.upcoming')).toBe('Nadolazeći')
})

test('throws on a missing key', () => {
  const incomplete = { 'nav.pocetna': 'Početna' } as Partial<MessageMap>
  expect(() => resolveMessage(incomplete, 'nav.sportasi')).toThrowError(
    'Missing web message: nav.sportasi',
  )
})

test('accepts an alternate map for a typed key', () => {
  const en = { ...hrMessages, 'nav.pocetna': 'Home' } satisfies MessageMap
  expect(t('nav.pocetna', en)).toBe('Home')
})
