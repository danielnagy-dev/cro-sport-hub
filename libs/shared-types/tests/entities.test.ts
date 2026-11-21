import { expect, test } from 'vite-plus/test'
import {
  appearanceIssues,
  appearanceSchema,
  appearanceStatusSchema,
  athleteSchema,
  athleteTeamSchema,
  cardTypeSchema,
  competitionSchema,
  creatorKindSchema,
  footballMatchSchema,
  matchSchema,
  networkSchema,
  publishSlotStatusSchema,
  roleSchema,
  sportSchema,
  sportSlugSchema,
  statusSchema,
  teamSchema,
} from '../src/index.ts'

test('parses the shared enums and rejects values outside them', () => {
  expect(statusSchema.parse('published')).toBe('published')
  expect(statusSchema.safeParse('approved').success).toBe(false)
  expect(roleSchema.parse('editor')).toBe('editor')
  expect(roleSchema.safeParse('viewer').success).toBe(false)
  expect(sportSlugSchema.parse('tennis')).toBe('tennis')
  expect(sportSlugSchema.parse('football')).toBe('football')
  expect(sportSlugSchema.parse('basketball')).toBe('basketball')
  expect(sportSlugSchema.safeParse('handball').success).toBe(false)
  expect(sportSchema.parse({ id: 'sport-tennis', slug: 'tennis', name: 'Tennis' }).slug).toBe(
    'tennis',
  )
  expect(
    sportSchema.parse({ id: 'sport-basketball', slug: 'basketball', name: 'Basketball' }).slug,
  ).toBe('basketball')
  expect(cardTypeSchema.parse('yellow')).toBe('yellow')
  expect(cardTypeSchema.parse('red')).toBe('red')
  expect(cardTypeSchema.safeParse('blue').success).toBe(false)
})

test('parses editorial appearance, publish-slot, network, and creator enums', () => {
  expect(appearanceStatusSchema.parse('scheduled')).toBe('scheduled')
  expect(appearanceStatusSchema.parse('in_progress')).toBe('in_progress')
  expect(appearanceStatusSchema.parse('completed')).toBe('completed')
  expect(appearanceStatusSchema.parse('cancelled')).toBe('cancelled')
  expect(appearanceStatusSchema.safeParse('draft').success).toBe(false)

  expect(publishSlotStatusSchema.parse('planned')).toBe('planned')
  expect(publishSlotStatusSchema.parse('waiting_for_data')).toBe('waiting_for_data')
  expect(publishSlotStatusSchema.parse('ready_for_review')).toBe('ready_for_review')
  expect(publishSlotStatusSchema.parse('approved')).toBe('approved')
  expect(publishSlotStatusSchema.parse('published')).toBe('published')
  expect(publishSlotStatusSchema.parse('skipped')).toBe('skipped')
  expect(publishSlotStatusSchema.parse('error')).toBe('error')
  expect(publishSlotStatusSchema.safeParse('draft').success).toBe(false)

  expect(networkSchema.parse('instagram')).toBe('instagram')
  expect(networkSchema.parse('facebook')).toBe('facebook')
  expect(networkSchema.parse('x')).toBe('x')
  expect(networkSchema.safeParse('tiktok').success).toBe(false)

  expect(creatorKindSchema.parse('bot')).toBe('bot')
  expect(creatorKindSchema.parse('manual')).toBe('manual')
  expect(creatorKindSchema.safeParse('import').success).toBe(false)
})

test('parses athletes, clubs, club spells, and competitions', () => {
  expect(
    athleteSchema.parse({
      id: 'player-one',
      slug: 'player-one',
      name: 'Player One',
      sportId: 'sport-football',
      country: 'HR',
      birthYear: 1998,
      position: 'Midfielder',
      photoUrl: 'https://example.com/player.png',
    }).photoUrl,
  ).toBe('https://example.com/player.png')

  expect(
    athleteSchema.safeParse({
      id: 'player-one',
      slug: 'Player One',
      name: ' Player One',
      sportId: 'sport-football',
      country: 'Croatia',
      birthYear: 2020,
      photoUrl: 'http://example.com/photo.png',
    }).success,
  ).toBe(false)

  expect(
    teamSchema.parse({
      id: 'club-north',
      sportId: 'sport-football',
      slug: 'club-north',
      name: 'Club North',
      shortName: 'CN',
      country: 'HR',
    }).crestUrl,
  ).toBeUndefined()
  expect(
    teamSchema.safeParse({
      id: 'club-north',
      sportId: 'sport-football',
      slug: 'club-north',
      name: 'Club North',
      shortName: 'CN',
      country: 'HR',
      nationalTeam: true,
    }).success,
  ).toBe(false)

  expect(
    athleteTeamSchema.parse({
      athleteId: 'player-one',
      teamId: 'club-north',
      from: '2024-07-01',
    }).to,
  ).toBeUndefined()
  expect(
    athleteTeamSchema.safeParse({
      athleteId: 'player-one',
      teamId: 'club-north',
      from: '2024-07-01',
      to: '2024-06-30',
    }).success,
  ).toBe(false)
  expect(
    athleteTeamSchema.safeParse({
      athleteId: 'player-one',
      teamId: 'club-north',
      from: '2023-02-29',
      to: '2024-02-29',
    }).success,
  ).toBe(false)

  expect(
    competitionSchema.parse({
      id: 'comp-city',
      sportId: 'sport-tennis',
      name: 'City Open 2026',
      season: '2026',
      level: 'international',
    }).level,
  ).toBe('international')
  expect(
    competitionSchema.parse({
      id: 'comp-league',
      sportId: 'sport-football',
      name: 'National League',
      season: '2026/27',
      level: 'domestic',
    }).season,
  ).toBe('2026/27')
  expect(
    competitionSchema.parse({
      id: 'comp-old',
      sportId: 'sport-football',
      name: 'National League',
      season: '1999/00',
      level: 'domestic',
    }).season,
  ).toBe('1999/00')
  expect(
    competitionSchema.safeParse({
      id: 'comp-league',
      sportId: 'sport-football',
      name: 'National League',
      season: '2026/28',
      level: 'friendly',
    }).success,
  ).toBe(false)
})

function draftMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'match-1',
    sportId: 'sport-football',
    competitionId: 'comp-league',
    date: '2026-10-23',
    round: 'Matchday 8',
    status: 'draft',
    source: 'manual',
    createdBy: 'editor-1',
    ...overrides,
  }
}

test('enforces the match workflow and the import source ref', () => {
  expect(matchSchema.parse(draftMatch()).status).toBe('draft')
  expect(matchSchema.safeParse(draftMatch({ reviewedBy: 'editor-2' })).success).toBe(false)
  expect(matchSchema.safeParse(draftMatch({ source: 'import' })).success).toBe(false)
  expect(matchSchema.safeParse(draftMatch({ sourceRef: 'fixture-1' })).success).toBe(false)
  expect(
    matchSchema.parse(draftMatch({ source: 'import', sourceRef: 'fixture-1' })).sourceRef,
  ).toBe('fixture-1')

  const published = draftMatch({
    status: 'published',
    reviewedBy: 'editor-2',
    publishedAt: '2026-10-23T18:04:00+02:00',
  })
  expect(matchSchema.parse(published).publishedAt).toBe('2026-10-23T18:04:00+02:00')
  expect(
    matchSchema.safeParse(draftMatch({ status: 'published', reviewedBy: 'editor-2' })).success,
  ).toBe(false)
  expect(
    matchSchema.safeParse(
      draftMatch({ status: 'review', publishedAt: '2026-10-23T18:04:00+02:00' }),
    ).success,
  ).toBe(false)
  expect(matchSchema.safeParse(draftMatch({ date: '2026-02-31' })).success).toBe(false)
})

test('parses football scores and appearance rules', () => {
  expect(
    footballMatchSchema.parse({
      matchId: 'match-1',
      homeTeamId: 'club-north',
      awayTeamId: 'club-south',
      homeGoals: 1,
      awayGoals: 1,
    }),
  ).toMatchObject({ homeGoals: 1, awayGoals: 1 })
  expect(
    footballMatchSchema.safeParse({
      matchId: 'match-1',
      homeTeamId: 'club-north',
      awayTeamId: 'club-north',
      homeGoals: 0,
      awayGoals: -1,
    }).success,
  ).toBe(false)

  const substitute = appearanceSchema.parse({
    matchId: 'match-1',
    athleteId: 'player-one',
    teamId: 'club-north',
    started: false,
    minutes: 30,
    goals: 1,
    assists: 0,
    yellowCards: 1,
    redCard: false,
  })
  expect(substitute.started).toBe(false)
  expect(appearanceIssues({ ...substitute, minutes: 0, goals: 0, yellowCards: 0 })).toEqual([])
  expect(
    appearanceSchema.parse({
      matchId: 'match-1',
      athleteId: 'player-one',
      teamId: 'club-north',
      started: false,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellowCards: 1,
      redCard: false,
    }).minutes,
  ).toBe(0)
  expect(
    appearanceIssues({
      started: true,
      minutes: 0,
      goals: 1,
      assists: 0,
      yellowCards: 1,
      redCard: false,
    }),
  ).toEqual([
    { path: ['started'], message: 'A player who started played at least one minute' },
    { path: ['goals'], message: 'A player with no minutes cannot have goals' },
  ])
  const twoYellows = appearanceSchema.safeParse({
    matchId: 'match-1',
    athleteId: 'player-one',
    teamId: 'club-north',
    started: true,
    minutes: 70,
    goals: 0,
    assists: 0,
    yellowCards: 2,
    redCard: false,
  })
  expect(twoYellows.success).toBe(false)
  if (!twoYellows.success) {
    expect(twoYellows.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['redCard'],
        message: 'A second yellow card is a sending-off',
      }),
    )
  }
  expect(
    appearanceSchema.safeParse({
      matchId: 'match-1',
      athleteId: 'player-one',
      teamId: 'club-north',
      started: true,
      minutes: 70,
      goals: 0,
      assists: 0,
      yellowCards: 2,
      redCard: true,
    }).success,
  ).toBe(true)
  expect(
    appearanceSchema.safeParse({
      matchId: 'match-1',
      athleteId: 'player-one',
      teamId: 'club-north',
      started: false,
      minutes: 90,
      goals: 0,
      assists: 0,
      yellowCards: 3,
      redCard: false,
    }).success,
  ).toBe(false)
  expect(
    appearanceSchema.safeParse({
      matchId: 'match-1',
      athleteId: 'player-one',
      teamId: 'club-north',
      started: false,
      minutes: 131,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCard: true,
    }).success,
  ).toBe(false)
})
