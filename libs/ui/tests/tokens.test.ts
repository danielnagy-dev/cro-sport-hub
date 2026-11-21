import { readFileSync } from 'node:fs'
import { expect, test } from 'vite-plus/test'
import storybookConfig from '../.storybook/main.ts'
import {
  KIT_DATA_ATTRIBUTES,
  KIT_SIZES,
  KIT_STATUSES,
  KIT_TONES,
  KIT_VARIANTS,
} from '../src/variant-contract.ts'

const css = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8')

function lum(hex: string): number {
  const lin = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  const r = lin(Number.parseInt(hex.slice(1, 3), 16) / 255)
  const g = lin(Number.parseInt(hex.slice(3, 5), 16) / 255)
  const b = lin(Number.parseInt(hex.slice(5, 7), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function color(name: string): string {
  const hex = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]
  if (hex === undefined) throw new Error(`Missing ${name}`)
  return hex
}

test('token colors used by the components clear WCAG contrast', () => {
  const pairs = [
    ['--csh-color-text', '--csh-color-canvas', 4.5],
    ['--csh-color-muted', '--csh-color-surface', 4.5],
    ['--csh-color-on-accent', '--csh-color-tennis', 4.5],
    ['--csh-color-on-accent', '--csh-color-football', 4.5],
    ['--csh-color-on-accent', '--csh-color-basketball', 4.5],
    ['--csh-color-text', '--csh-color-neutral-bg', 4.5],
    ['--csh-color-focus', '--csh-color-surface', 3],
  ] as const

  for (const [foreground, background, minimum] of pairs) {
    const lighter = Math.max(lum(color(foreground)), lum(color(background)))
    const darker = Math.min(lum(color(foreground)), lum(color(background)))
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(minimum)
  }
})

test('tokens register @property and required custom properties', () => {
  const required = [
    '--csh-color-canvas',
    '--csh-color-surface',
    '--csh-color-text',
    '--csh-color-muted',
    '--csh-color-border',
    '--csh-color-focus',
    '--csh-color-on-accent',
    '--csh-color-tennis',
    '--csh-color-football',
    '--csh-color-basketball',
    '--csh-color-neutral-bg',
    '--csh-space-1',
    '--csh-space-2',
    '--csh-space-3',
    '--csh-space-4',
    '--csh-space-5',
    '--csh-space-6',
    '--csh-radius-sm',
    '--csh-radius',
    '--csh-radius-lg',
    '--csh-font-sans',
    '--csh-font-size-sm',
    '--csh-font-size',
    '--csh-font-size-lg',
    '--csh-line-height',
    '--csh-focus-ring-width',
  ] as const

  for (const name of required) {
    expect(css).toContain(`${name}:`)
  }

  for (const registered of [
    '--csh-color-canvas',
    '--csh-color-basketball',
    '--csh-space-4',
    '--csh-radius',
    '--csh-font-size',
  ] as const) {
    expect(css).toMatch(new RegExp(`@property\\s+${registered}\\b`))
  }
})

test('tokens.css demonstrates data-attribute variant selectors', () => {
  expect(css).toContain("[data-tone='tennis']")
  expect(css).toContain("[data-tone='basketball']")
  expect(css).toContain("[data-size='sm']")
  expect(css).toContain("[data-variant='outline']")
  expect(css).toContain("[data-status='published']")
})

test('variant contract exports the kit data-* names and values', () => {
  expect(KIT_DATA_ATTRIBUTES).toEqual({
    tone: 'data-tone',
    size: 'data-size',
    variant: 'data-variant',
    status: 'data-status',
  })
  expect(KIT_TONES).toEqual(['neutral', 'tennis', 'football', 'basketball'])
  expect(KIT_SIZES).toEqual(['sm', 'md', 'lg'])
  expect(KIT_VARIANTS).toEqual(['solid', 'soft', 'outline'])
  expect(KIT_STATUSES).toEqual(['draft', 'review', 'published'])
})

test('storybook registers the a11y addon and exports tokens for the studio', () => {
  const manifest = readFileSync(new URL('../package.json', import.meta.url), 'utf8')

  expect(storybookConfig.addons).toContain('@storybook/addon-a11y')
  expect(manifest).toContain('"./tokens.css": "./dist/tokens.css"')
})
