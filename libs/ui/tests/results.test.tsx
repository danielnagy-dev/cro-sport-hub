import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import { MatchCard, type MatchCardProps } from '../src/match-card.tsx'

function markup(props: MatchCardProps): string {
  return renderToStaticMarkup(createElement(MatchCard, props))
}

function tableRow(html: string, label: string): string {
  const found = html
    .split('<tr>')
    .slice(1)
    .find((part) => part.includes(`>${label}`))
  if (found === undefined) throw new Error(`Missing row ${label}`)
  return found
}

test("tennis scoreboard shows sets, the loser's tiebreak, and the winner", () => {
  const html = markup({
    sport: 'tennis',
    playerA: 'Sample Player A',
    playerB: 'Sample Player B',
    sets: [
      [6, 4],
      [7, 6, 4],
    ],
    winner: 'a',
  })
  const playerA = tableRow(html, 'Sample Player A')
  const playerB = tableRow(html, 'Sample Player B')

  expect(html).toContain('<caption>Sample Player A versus Sample Player B</caption>')
  expect(html).toContain('Set 1')
  expect(html).toContain('Set 2')
  expect(html).toContain('scope="col"')
  expect(html).toContain('scope="row"')
  expect(playerA).toContain('Winner')
  expect(playerA).not.toContain('tiebreak')
  expect(playerB).toContain('tiebreak 4')
  expect(playerB).toContain('aria-hidden="true"')
  expect(playerB).not.toContain('Winner')
})

test('a retirement shows the unfinished set and does not name a winner', () => {
  const html = markup({
    sport: 'tennis',
    playerA: 'Sample Player A',
    playerB: 'Sample Player B',
    sets: [
      [6, 3],
      [3, 2],
    ],
    retired: true,
  })

  expect(html).toContain('Retired')
  expect(html).toContain('Set 2')
  expect(tableRow(html, 'Sample Player B')).toContain('>2</td>')
  expect(html).not.toContain('Winner')
})

test('football score lists both clubs and never names a winner', () => {
  const html = markup({
    sport: 'football',
    homeTeam: 'Sample Home',
    awayTeam: 'Sample Away',
    homeGoals: 2,
    awayGoals: 0,
  })

  expect(html).toContain('<caption>Sample Home versus Sample Away</caption>')
  expect(html).toContain('>2</td>')
  expect(html).toContain('>0</td>')
  expect(html).not.toContain('Winner')
  expect(tableRow(html, 'Sample Home')).toContain('scope="row"')
})
