import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import { AthleteHeader } from '../src/athlete-header.tsx'
import { Badge } from '../src/badge.tsx'
import { nextSport } from '../src/sports.ts'
import { SportTabs } from '../src/sport-tabs.tsx'

test('arrow keys move between the v1 sports', () => {
  expect(nextSport('tennis', 'ArrowRight')).toBe('football')
  expect(nextSport('football', 'ArrowRight')).toBe('basketball')
  expect(nextSport('basketball', 'ArrowRight')).toBe('tennis')
  expect(nextSport('football', 'ArrowLeft')).toBe('tennis')
  expect(nextSport('tennis', 'ArrowUp')).toBe('basketball')
  expect(nextSport('tennis', 'Home')).toBe('tennis')
  expect(nextSport('tennis', 'End')).toBe('basketball')
  expect(nextSport('tennis', 'Enter')).toBeUndefined()
})

test('badge tone is a class', () => {
  const html = renderToStaticMarkup(createElement(Badge, { tone: 'tennis', children: 'Tennis' }))

  expect(html).toContain('csh-badge--tennis')
  expect(html).toContain('Tennis')
})

test('sport tabs expose one selected tab and hide the other panels', () => {
  const html = renderToStaticMarkup(
    createElement(SportTabs, {
      value: 'football',
      onChange: () => {},
      panels: {
        tennis: 'Tennis panel',
        football: 'Football panel',
        basketball: 'Basketball panel',
      },
    }),
  )

  expect(html).toContain('role="tablist"')
  expect(html).toContain('aria-label="Sports"')
  expect(html).toContain('aria-selected="true"')
  expect(html).toContain('Football')
  expect(html).toContain('Basketball')
  expect(html).toMatch(/hidden=""[^>]*>Tennis panel/)
  expect(html).toMatch(/hidden=""[^>]*>Basketball panel/)
  expect(html).not.toMatch(/hidden=""[^>]*>Football panel/)
})

test('athlete header omits optional facts', () => {
  const html = renderToStaticMarkup(
    createElement(AthleteHeader, { name: 'Sample Athlete', country: 'HR', sport: 'tennis' }),
  )

  expect(html).toContain('Sample Athlete')
  expect(html).toContain('HR')
  expect(html).toContain('Tennis')
  expect(html).not.toContain('Born')
  expect(html).not.toContain('Position')
})

test('athlete header shows birth year and position', () => {
  const html = renderToStaticMarkup(
    createElement(AthleteHeader, {
      name: 'Sample Athlete',
      country: 'HR',
      sport: 'football',
      birthYear: 1998,
      position: 'Midfielder',
    }),
  )

  expect(html).toContain('Born')
  expect(html).toContain('1998')
  expect(html).toContain('Midfielder')
})
