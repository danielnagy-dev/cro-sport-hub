import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import ReprezentacijaPage from '../app/reprezentacija/page'
import { SiteShell } from '../app/shell'
import SportasiPage from '../app/sportasi/page'
import { t } from '../lib/messages'

test('shell shows Croatian IA nav without tennis or football hubs', () => {
  const html = renderToStaticMarkup(
    createElement(SiteShell, null, createElement('main', { id: 'content', tabIndex: -1 }, 'body')),
  )

  expect(html).toContain('class="skip-link" href="#content"')
  expect(html).toContain(t('chrome.skip'))
  expect(html).toContain('class="shell-home" href="/"')
  expect(html).toContain(t('chrome.brand'))
  expect(html).toContain(`aria-label="${t('chrome.nav-aria')}"`)
  expect(html).toContain('class="shell-nav-link" href="/"')
  expect(html).toContain(`>${t('nav.pocetna')}</a>`)
  expect(html).toContain('class="shell-nav-link" href="/sportasi"')
  expect(html).toContain(`>${t('nav.sportasi')}</a>`)
  expect(html).toContain('class="shell-nav-link" href="/reprezentacija"')
  expect(html).toContain(`>${t('nav.reprezentacija')}</a>`)
  expect(html).not.toContain('href="/tennis"')
  expect(html).not.toContain('href="/football"')
  expect(html).not.toContain('>tennis</a>')
  expect(html).not.toContain('>football</a>')
  expect(html).not.toContain('Skip to content')
})

test('sportasi and reprezentacija stubs render inside the shell', () => {
  const sportasi = renderToStaticMarkup(createElement(SiteShell, null, createElement(SportasiPage)))
  expect(sportasi).toContain('<main id="content" tabindex="-1"')
  expect(sportasi).toContain(`<h1>${t('sportasi.title')}</h1>`)
  expect(sportasi).toContain(t('sportasi.lead'))
  expect(sportasi).toContain(`>${t('nav.sportasi')}</a>`)

  const reprezentacija = renderToStaticMarkup(
    createElement(SiteShell, null, createElement(ReprezentacijaPage)),
  )
  expect(reprezentacija).toContain('<main id="content" tabindex="-1"')
  expect(reprezentacija).toContain(`<h1>${t('reprezentacija.title')}</h1>`)
  expect(reprezentacija).toContain(t('reprezentacija.lead'))
  expect(reprezentacija).toContain(`>${t('nav.reprezentacija')}</a>`)
})

test('the shell styles use the shared UI tokens', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

  expect(layout).toContain('@cro-sport-hub/ui/tokens.css')
  expect(layout).toContain('lang="hr"')
  expect(css).toContain('var(--csh-color-canvas)')
  expect(css).toContain('var(--csh-color-text)')
  expect(css).toContain('var(--csh-font-sans)')
  expect(css).toContain('var(--csh-color-on-accent)')
  expect(css).toContain('var(--csh-color-focus)')
  expect(css).toContain('.shell-nav')
  expect(css).toContain('.shell-nav-link')
  expect(css).not.toContain('.shell-sports')
  expect(css).not.toContain('.shell-sport')
})
