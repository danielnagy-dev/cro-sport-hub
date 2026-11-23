import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import SportasiPage, { metadata } from '../app/sportasi/page'
import { publicAthletesBySportPath } from '../lib/api-client'
import { t } from '../lib/messages'
import type { PublicAthleteIndexItem } from '../lib/public-editorial-schemas'
import { SITE_NAME } from '../lib/site-metadata'
import {
  parseSportSlug,
  SPORTASI_EMPTY_COPY,
  SPORTASI_UNAVAILABLE_COPY,
  SportasiMain,
} from '../lib/sportasi-view'

const tennisAthletes: PublicAthleteIndexItem[] = [
  { slug: 'sample-player-a', name: 'Sample Player A' },
  { slug: 'sample-player-b', name: 'Sample Player B' },
]
const basketballAthletes: PublicAthleteIndexItem[] = [
  { slug: 'sample-hooper-a', name: 'Sample Hooper A' },
]

async function renderSportasi(respond: () => Response | Promise<Response>, sport?: string) {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    urls.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return respond()
  }
  try {
    return {
      html: renderToStaticMarkup(
        await SportasiPage({
          searchParams: Promise.resolve(sport === undefined ? {} : { sport }),
        }),
      ),
      urls,
    }
  } finally {
    globalThis.fetch = previous
  }
}

test('parses sport query and defaults to tennis', () => {
  expect(parseSportSlug(undefined)).toBe('tennis')
  expect(parseSportSlug('football')).toBe('football')
  expect(parseSportSlug(['basketball'])).toBe('basketball')
  expect(parseSportSlug('handball')).toBe('tennis')
})

test('Sportaši index: filter links, athlete hrefs, empty and unavailable', async () => {
  const list = renderToStaticMarkup(
    SportasiMain({ sport: 'basketball', athletes: basketballAthletes }),
  )
  expect(list).toContain(`<h1>${t('sportasi.title')}</h1>`)
  expect(list).toContain('href="/sportasi?sport=tennis"')
  expect(list).toContain('href="/sportasi?sport=football"')
  expect(list).toContain('href="/sportasi?sport=basketball"')
  expect(list).toContain('aria-current="page"')
  expect(list).toContain('href="/athletes/sample-hooper-a"')
  expect(list).toContain('Sample Hooper A')
  expect(list).not.toContain('MatchCard')
  expect(list).not.toContain('draft')

  expect(renderToStaticMarkup(SportasiMain({ sport: 'tennis', athletes: [] }))).toContain(
    SPORTASI_EMPTY_COPY,
  )
  expect(renderToStaticMarkup(SportasiMain({ sport: 'tennis', athletes: undefined }))).toContain(
    SPORTASI_UNAVAILABLE_COPY,
  )

  const ok = await renderSportasi(
    () => new Response(JSON.stringify(tennisAthletes), { status: 200 }),
    'tennis',
  )
  expect(ok.urls).toEqual([`http://localhost:3001${publicAthletesBySportPath('tennis')}`])
  expect(ok.html).toContain('href="/athletes/sample-player-a"')
  expect(ok.html).toContain('Sample Player A')
  expect(ok.html).toContain('aria-current="page"')

  const basketball = await renderSportasi(
    () => new Response(JSON.stringify(basketballAthletes), { status: 200 }),
    'basketball',
  )
  expect(basketball.urls).toEqual([
    `http://localhost:3001${publicAthletesBySportPath('basketball')}`,
  ])
  expect(basketball.html).toContain('href="/athletes/sample-hooper-a"')

  expect(
    (await renderSportasi(() => new Response('[]', { status: 200 }), 'football')).html,
  ).toContain(SPORTASI_EMPTY_COPY)
  expect((await renderSportasi(() => Promise.reject(new Error('down')))).html).toContain(
    SPORTASI_UNAVAILABLE_COPY,
  )
})

test('Sportaši metadata matches the index URL', () => {
  const title = `${t('sportasi.title')} · ${t('chrome.brand')}`
  const description = t('sportasi.lead')
  expect(metadata).toMatchObject({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'http://localhost:3000/sportasi',
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary', title, description },
  })
})
