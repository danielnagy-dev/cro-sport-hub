import type { Catalog } from './catalog.js'

export async function writeSampleMatches(catalog: Catalog): Promise<void> {
  await catalog.write('match', {
    id: 'match-sample-final',
    sportId: 'sport-tennis',
    competitionId: 'comp-sample-cup',
    date: '2026-10-18',
    round: 'Final',
    status: 'published',
    source: 'manual',
    createdBy: 'editor-demo',
    reviewedBy: 'admin-demo',
    publishedAt: '2026-10-18T18:00:00+00:00',
  })
  await catalog.write('tennisMatch', {
    matchId: 'match-sample-final',
    playerAId: 'sample-player-a',
    playerBId: 'sample-player-b',
    winnerId: 'sample-player-a',
    bestOf: 3,
    score: [
      [6, 4],
      [7, 6, 5],
    ],
    retired: false,
  })
  await catalog.write('tennisMatchStats', {
    matchId: 'match-sample-final',
    athleteId: 'sample-player-a',
    aces: 3,
    doubleFaults: 1,
    firstServeIn: 6,
    firstServeTotal: 10,
    firstServePointsWon: 4,
    secondServePointsWon: 2,
    secondServeTotal: 4,
    breakPointsSaved: 1,
    breakPointsFaced: 2,
    breakPointsWon: 2,
    breakPointsTotal: 4,
    winners: 8,
    unforcedErrors: 5,
    totalPointsWon: 20,
  })
  await catalog.write('tennisMatchStats', {
    matchId: 'match-sample-final',
    athleteId: 'sample-player-b',
    aces: 1,
    doubleFaults: 2,
    firstServeIn: 4,
    firstServeTotal: 8,
    firstServePointsWon: 2,
    secondServePointsWon: 1,
    secondServeTotal: 4,
    breakPointsSaved: 0,
    breakPointsFaced: 1,
    breakPointsWon: 1,
    breakPointsTotal: 2,
    totalPointsWon: 12,
  })
  await catalog.write('match', {
    id: 'match-sample-qf',
    sportId: 'sport-tennis',
    competitionId: 'comp-sample-cup',
    date: '2026-10-16',
    round: 'QF',
    status: 'draft',
    source: 'manual',
    createdBy: 'editor-demo',
  })
  await catalog.write('tennisMatch', {
    matchId: 'match-sample-qf',
    playerAId: 'sample-player-c',
    playerBId: 'sample-player-d',
    winnerId: 'sample-player-c',
    bestOf: 3,
    score: [
      [6, 3],
      [4, 2],
    ],
    retired: true,
  })
  await catalog.write('match', {
    id: 'match-sample-league',
    sportId: 'sport-football',
    competitionId: 'comp-sample-league',
    date: '2026-10-19',
    round: 'Matchday 8',
    status: 'published',
    source: 'manual',
    createdBy: 'editor-demo',
    reviewedBy: 'admin-demo',
    publishedAt: '2026-10-19T20:00:00+00:00',
  })
  await catalog.write('footballMatch', {
    matchId: 'match-sample-league',
    homeTeamId: 'club-sample-home',
    awayTeamId: 'club-sample-away',
    homeGoals: 2,
    awayGoals: 1,
  })
  for (const line of [
    {
      athleteId: 'karlo-brkic',
      teamId: 'club-sample-home',
      started: true,
      minutes: 90,
      goals: 2,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    },
    {
      athleteId: 'mateo-jurcic',
      teamId: 'club-sample-home',
      started: true,
      minutes: 75,
      goals: 0,
      assists: 1,
      yellowCards: 1,
      redCard: false,
    },
    {
      athleteId: 'leon-vukovic',
      teamId: 'club-sample-home',
      started: true,
      minutes: 90,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    },
    {
      athleteId: 'filip-saric',
      teamId: 'club-sample-away',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      yellowCards: 2,
      redCard: true,
    },
    {
      athleteId: 'bruno-peric',
      teamId: 'club-sample-away',
      started: false,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellowCards: 1,
      redCard: false,
    },
  ] as const) {
    await catalog.write('appearance', {
      matchId: 'match-sample-league',
      ...line,
    })
  }
}
