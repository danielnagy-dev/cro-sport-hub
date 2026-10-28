import { readFileSync } from 'node:fs'
import { expect, test } from 'vite-plus/test'
import storybookConfig from '../.storybook/main.ts'

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
    ['--csh-color-text', '--csh-color-neutral-bg', 4.5],
    ['--csh-color-focus', '--csh-color-surface', 3],
  ] as const

  for (const [foreground, background, minimum] of pairs) {
    const lighter = Math.max(lum(color(foreground)), lum(color(background)))
    const darker = Math.min(lum(color(foreground)), lum(color(background)))
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(minimum)
  }
})

test('storybook registers the a11y addon and exports tokens for the studio', () => {
  const manifest = readFileSync(new URL('../package.json', import.meta.url), 'utf8')

  expect(storybookConfig.addons).toContain('@storybook/addon-a11y')
  expect(manifest).toContain('"./tokens.css": "./dist/tokens.css"')
})
