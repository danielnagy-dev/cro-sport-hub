import { expect, test } from 'vite-plus/test'
import { footballTemplate, type FootballPerson, type FootballSlide } from '../src/index.ts'

// Colour literals are copied from design/football-r13/tokens.json.

const karlo: FootballPerson = {
  name: 'Karlo Brkić',
  club: 'GNK Dinamo',
  number: 9,
  position: 'napadač',
  lineup: 'start',
  fixture: { home: 'Slaven Belupo', away: 'Dinamo', homeScore: 1, awayScore: 5, side: 'away' },
  stats: [
    { key: 'goals', label: 'GOLOVI', value: '2' },
    { key: 'assists', label: 'ASIST.', value: '1' },
    { key: 'minutes', label: 'MINUTE', value: '90’' },
    { key: 'shots', label: 'Udarci', value: '5', onTarget: '3' },
    { key: 'key_passes', label: 'Ključna dodavanja', value: '2' },
    { key: 'passes', label: 'Dodavanja', accurate: 25, total: 32 },
    { key: 'yellow', label: 'Žuti karton', value: '1' },
  ],
}

const player: FootballSlide = {
  kind: 'player',
  competition: 'SuperSport HNL',
  round: '10. kolo',
  date: '18. 10.',
  player: karlo,
}

test('the example player slide uses the round-13 hero rule', () => {
  const doc = footballTemplate(player)
  expect(doc).toMatchObject({
    width: 1080,
    height: 1350,
    designRound: '13-interim',
    colourway: 'navy',
    kind: 'player',
  })
  expect(doc.heroes.map((hero) => hero.key)).toEqual(['goals'])
  // Token note for this slide: 278px. Chrome on the reference HTML reported 278.164.
  expect(Math.round(doc.heroes[0]?.fontPx ?? 0)).toBe(278)
  for (const bit of [
    'data-design="13-interim"',
    '78%',
    '25/32',
    '(3)',
    'Udarci (u okvir)',
    'acc',
    '#0E1431',
    '1080px',
    '1350px',
    'font:800 1em/.82',
  ])
    expect(doc.html).toContain(bit)
  // The handoff's value face is 1em with line-height .82. twoRow measures that face.
  expect(doc.html).not.toContain('font:800 .82em/1')
})

const filip: FootballPerson = {
  name: 'Filip Šarić',
  club: 'Como',
  number: 17,
  position: 'desni bek',
  lineup: 'start',
  fixture: { home: 'Fiorentina', away: 'Como', homeScore: 1, awayScore: 3, side: 'away' },
  stats: [
    { key: 'minutes', label: 'MINUTE', value: '90’' },
    { key: 'assists', label: 'ASIST.', value: '1' },
    { key: 'key_passes', label: 'Ključna dodavanja', value: '3' },
    { key: 'passes', label: 'Dodavanja', accurate: 38, total: 45 },
    { key: 'shots', label: 'Udarci', value: '1' },
    { key: 'yellow', label: 'Žuti karton', value: '1' },
  ],
}

const mateo: FootballPerson = {
  name: 'Mateo Jurčić',
  club: 'Lazio',
  number: 6,
  position: 'branič',
  lineup: 'start',
  fixture: { home: 'Juventus', away: 'Lazio', homeScore: 1, awayScore: 1, side: 'away' },
  stats: [
    { key: 'minutes', label: 'MINUTE', value: '90’' },
    { key: 'passes', label: 'Dodavanja', accurate: 46, total: 50 },
    { key: 'yellow', label: 'Žuti karton', value: '1' },
  ],
}

const leon: FootballPerson = {
  name: 'Leon Vuković',
  club: 'Milan',
  number: 14,
  position: 'vezni',
  lineup: 'start',
  fixture: { home: 'Milan', away: 'Atalanta', homeScore: 3, awayScore: 2, side: 'home' },
  stats: [
    { key: 'minutes', label: 'MINUTE', value: '90’' },
    { key: 'goals', label: 'GOLOVI', value: '1' },
    { key: 'assists', label: 'ASIST.', value: '1' },
    { key: 'shots', label: 'Udarci', value: '3', onTarget: '2' },
    { key: 'key_passes', label: 'Ključna dodavanja', value: '4' },
    { key: 'passes', label: 'Dodavanja', accurate: 67, total: 72 },
    { key: 'yellow', label: 'Žuti karton', value: '1' },
  ],
}

const bruno: FootballPerson = {
  name: 'Bruno Perić',
  club: 'Atalanta',
  number: 8,
  position: 'vezni',
  lineup: 'sub',
  fixture: { home: 'Milan', away: 'Atalanta', homeScore: 3, awayScore: 2, side: 'away' },
  stats: [
    { key: 'minutes', label: 'MINUTE', value: '32’' },
    { key: 'goals', label: 'GOLOVI', value: '1' },
    { key: 'shots', label: 'Udarci', value: '2' },
    { key: 'passes', label: 'Dodavanja', accurate: 16, total: 20 },
  ],
}

const serie: FootballSlide = {
  kind: 'list',
  competition: 'Serie A',
  round: '9. kolo',
  date: '18. 10.',
  players: [filip, mateo, leon, bruno],
}

test('the example list slide uses text passes and the round-13 hero sizes', () => {
  const doc = footballTemplate(serie)
  expect(doc).toMatchObject({
    width: 1080,
    height: 1350,
    designRound: '13-interim',
    colourway: 'navy',
    kind: 'list',
    zoom: 1.15,
  })
  // Chrome 156 on html/02-list_alt-no-donut.html at 1080×1350.
  // Filip's first row is taller by the 12px fraction, so his hero is 143.247.
  // Leon and Bruno stay on the plain second-row baseline, 123.504.
  expect(doc.heroes.map((hero) => hero.key)).toEqual(['assists', 'goals', 'goals'])
  expect(doc.heroes[0]?.fontPx).toBeCloseTo(143.247, 0)
  expect(doc.heroes[1]?.fontPx).toBeCloseTo(123.504, 0)
  expect(doc.heroes[2]?.fontPx).toBeCloseTo(123.504, 0)
  for (const bit of [
    'data-kind="list"',
    '--list-zoom:1.15',
    '128px repeat(3,104px)',
    '84%',
    '38/45',
    '92%',
    '46/50',
    '93%',
    '67/72',
    '80%',
    '16/20',
    'ASIST.',
    'Klj. dod.',
    'Udarci (okv.)',
    '(2)',
    'Žuti',
    'Como',
    'Šarić',
  ])
    expect(doc.html).toContain(bit)
  expect(doc.html).not.toContain('stroke-dasharray')
})

test('list values paint at the handoff size, not 0.82×', () => {
  const html = footballTemplate(serie).html
  const face = /\.num,\.pass\{font:800 ([^/]+)\/([^\s]+) BS/.exec(html)
  expect(face?.[1]).toBe('1em')
  expect(face?.[2]).toBe('.82')
  expect(html).toContain('font-size:34px;line-height:1')
  expect(html).toContain('font:700 12px/1 AR')
  expect(html).toContain('.kv .pass.text{gap:4px}')
  expect(html).not.toContain('.82em')
  expect(html).not.toContain('kv .frac{font-size:22px')
  expect(html).not.toContain('kv .pct{font-size:21px')
})

test('list zoom, a switched-off hero, and the player cap are template options', () => {
  const rows = (count: number): FootballSlide => ({
    kind: 'list',
    competition: 'Serie A',
    round: '9. kolo',
    date: '18. 10.',
    players: Array.from({ length: count }, () => mateo),
  })
  expect(footballTemplate(rows(2)).zoom).toBe(1.5)
  expect(footballTemplate(rows(3)).zoom).toBe(1.3)
  expect(footballTemplate(rows(4)).zoom).toBe(1.15)
  expect(() => footballTemplate(rows(5))).toThrow('at most 4')
  const plain = footballTemplate(serie, { hero: 'off' })
  expect(plain.heroes).toEqual([])
  expect(plain.html).toContain('repeat(4,104px)')
  expect(plain.html).not.toContain('128px')
  expect(footballTemplate(serie, { heroFontPx: 100 }).heroes).toEqual([
    { key: 'assists', fontPx: 100 },
    { key: 'goals', fontPx: 100 },
    { key: 'goals', fontPx: 100 },
  ])
})

test('hero size, colourway, and the missing cover are template options', () => {
  expect(footballTemplate(player, { hero: 'off' }).heroes).toEqual([])
  expect(footballTemplate({ ...player, player: { ...karlo, hero: 'none' } }).heroes).toEqual([])
  expect(footballTemplate(player, { heroFontPx: 200 }).heroes).toEqual([
    { key: 'goals', fontPx: 200 },
  ])
  const red = footballTemplate(player, { colourway: 'red' })
  expect(red.colourway).toBe('red')
  expect(red.html).toContain('#43122A')
  expect(red.html).toContain('not re-reviewed')
  expect(footballTemplate(player, { colourway: 'light' }).html).toContain('#F4EEE1')
  expect(() => footballTemplate({ kind: 'cover' } as never)).toThrow('Round 13 has no cover slide')
})

test('optional shirt number and caption stay off the handoff defaults', () => {
  expect(footballTemplate(player).html).toContain('#9')
  const bare = footballTemplate({
    ...player,
    player: { ...karlo, number: undefined, position: 'Forward' },
  })
  expect(bare.html).not.toMatch(/#9</)
  expect(bare.html).toContain('Forward</span>')
  expect(footballTemplate(player).html).not.toContain('Sample night')
  const captioned = footballTemplate({ ...player, caption: 'Sample night' })
  expect(captioned.html).toContain('Sample night')
  expect(footballTemplate({ ...player, caption: '' }).html).not.toContain('Sample night')
  expect(footballTemplate({ ...serie, caption: 'List note' }).html).toContain('List note')
})
