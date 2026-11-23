import { expect, test } from 'vite-plus/test'
import { retiredSportHubRedirects } from '../next.config'
import { staticPublicPaths } from '../lib/public-sitemap'

test('retired tennis and football hubs permanently redirect to Početna', () => {
  expect(retiredSportHubRedirects).toEqual([
    { source: '/tennis', destination: '/', permanent: true },
    { source: '/football', destination: '/', permanent: true },
  ])
})

test('public sitemap static paths omit retired sport hubs', () => {
  expect(staticPublicPaths).toEqual(['/'])
  expect(staticPublicPaths).not.toContain('/tennis')
  expect(staticPublicPaths).not.toContain('/football')
})
