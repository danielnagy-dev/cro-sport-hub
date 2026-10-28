import { z } from 'zod'
import { idSchema } from './common.ts'

/**
 * Sets are stored from player A's side: `[gamesA, gamesB]` or
 * `[gamesA, gamesB, tiebreakPointsLost]`.
 *
 * The third number is only present on a 7-6 set. It is the loser's
 * tiebreak total. The winner's tiebreak total is not stored. A 7-point
 * tiebreak and a 10-point final-set tiebreak both end 7-6 in games, so
 * the same number covers both.
 *
 * v1 accepts standard sets only: 6-0 through 6-4, 7-5, or 7-6 with a
 * tiebreak.
 *
 * `bestOf` is not on the spec's field list. It is required here because
 * a 2-0 score is a finished best-of-3, while a 3-0 score is a finished
 * best-of-5, and a 2-1 score is not finished in a best-of-5.
 */
/** Games in a standard set. Match tiebreaks (for example 10-8) and advantage final sets are intentionally out of scope for v1. */
const MAX_GAMES = 7
const MAX_TIEBREAK_POINTS = 99

export const tennisBestOfSchema = z.union([z.literal(3), z.literal(5)])
export type TennisBestOf = z.infer<typeof tennisBestOfSchema>

const gamesSchema = z.int().min(0).max(MAX_GAMES)
const tiebreakPointsSchema = z.int().min(0).max(MAX_TIEBREAK_POINTS)

export const tennisSetSchema = z.union([
  z.tuple([gamesSchema, gamesSchema, tiebreakPointsSchema]),
  z.tuple([gamesSchema, gamesSchema]),
])

export type TennisSetScore = z.infer<typeof tennisSetSchema>

export type TennisScoreEvaluation =
  | { readonly ok: true; readonly setsWonByA: number; readonly setsWonByB: number }
  | { readonly ok: false; readonly message: string }

function isWhole(value: number | undefined, max: number): value is number {
  return value !== undefined && Number.isInteger(value) && value >= 0 && value <= max
}

function isPlainSetWin(gamesA: number, gamesB: number): boolean {
  const high = Math.max(gamesA, gamesB)
  const low = Math.min(gamesA, gamesB)
  return (high === 6 && low <= 4) || (high === 7 && low === 5)
}

function isTiebreakSet(gamesA: number, gamesB: number): boolean {
  return (gamesA === 7 && gamesB === 6) || (gamesA === 6 && gamesB === 7)
}

type SetKind = 'complete' | 'in-progress' | 'invalid'

function classifySet(set: readonly number[]): SetKind {
  const gamesA = set[0]
  const gamesB = set[1]
  if (!isWhole(gamesA, MAX_GAMES) || !isWhole(gamesB, MAX_GAMES)) {
    return 'invalid'
  }

  if (set.length === 3) {
    if (!isWhole(set[2], MAX_TIEBREAK_POINTS) || !isTiebreakSet(gamesA, gamesB)) {
      return 'invalid'
    }
    return 'complete'
  }

  if (set.length !== 2) {
    return 'invalid'
  }

  if (isTiebreakSet(gamesA, gamesB)) {
    return 'invalid'
  }

  if (isPlainSetWin(gamesA, gamesB)) {
    return 'complete'
  }

  if (gamesA <= 6 && gamesB <= 6) {
    return 'in-progress'
  }

  return 'invalid'
}

function setMessage(set: readonly number[]): string {
  const gamesA = set[0]
  const gamesB = set[1]
  const tiebreak = gamesA !== undefined && gamesB !== undefined && isTiebreakSet(gamesA, gamesB)

  if (set.length === 2 && tiebreak) {
    return 'A 7-6 set needs the tiebreak points scored by the player who lost the set'
  }

  if (set.length === 3 && tiebreak && !isWhole(set[2], MAX_TIEBREAK_POINTS)) {
    return 'Tiebreak points are a whole number from 0 to 99'
  }

  if (set.length === 3 && !tiebreak) {
    return 'Tiebreak points belong only on a 7-6 set'
  }

  return "A set must be 6-0 to 6-4, 7-5, or 7-6 with the loser's tiebreak points"
}

export function evaluateTennisScore(
  score: readonly (readonly number[])[],
  bestOf: TennisBestOf,
  retired: boolean,
): TennisScoreEvaluation {
  if (score.length === 0) {
    return { ok: false, message: 'A tennis score needs at least one set' }
  }

  if (score.length > bestOf) {
    return {
      ok: false,
      message: `A best-of-${bestOf} match cannot have more than ${bestOf} sets`,
    }
  }

  const setsNeeded = bestOf === 3 ? 2 : 3
  let setsWonByA = 0
  let setsWonByB = 0

  for (let index = 0; index < score.length; index += 1) {
    const set = score[index]
    if (set === undefined) {
      return { ok: false, message: 'A tennis score needs at least one set' }
    }

    if (setsWonByA >= setsNeeded || setsWonByB >= setsNeeded) {
      return { ok: false, message: 'A set was played after the match was already decided' }
    }

    const kind = classifySet(set)
    if (kind === 'complete') {
      const gamesA = set[0] ?? 0
      const gamesB = set[1] ?? 0
      if (gamesA > gamesB) {
        setsWonByA += 1
      } else {
        setsWonByB += 1
      }
      continue
    }

    if (kind === 'in-progress' && retired && index === score.length - 1) {
      continue
    }

    if (kind === 'in-progress') {
      return {
        ok: false,
        message: 'An unfinished set is only allowed as the last set of a retirement',
      }
    }

    return { ok: false, message: setMessage(set) }
  }

  if (retired) {
    if (setsWonByA >= setsNeeded || setsWonByB >= setsNeeded) {
      return { ok: false, message: 'A finished match cannot be marked retired' }
    }
    return { ok: true, setsWonByA, setsWonByB }
  }

  if (Math.max(setsWonByA, setsWonByB) !== setsNeeded) {
    return {
      ok: false,
      message: `A best-of-${bestOf} match needs a player to win ${setsNeeded} sets`,
    }
  }

  return { ok: true, setsWonByA, setsWonByB }
}

export const tennisMatchSchema = z
  .strictObject({
    matchId: idSchema,
    playerAId: idSchema,
    playerBId: idSchema,
    winnerId: idSchema,
    bestOf: tennisBestOfSchema,
    score: z.array(tennisSetSchema).min(1).max(5),
    retired: z.boolean().optional(),
  })
  .superRefine((match, ctx) => {
    if (match.playerAId === match.playerBId) {
      ctx.addIssue({
        code: 'custom',
        path: ['playerBId'],
        message: 'The two players must be different athletes',
      })
    }

    if (match.winnerId !== match.playerAId && match.winnerId !== match.playerBId) {
      ctx.addIssue({
        code: 'custom',
        path: ['winnerId'],
        message: 'The winner must be one of the two players',
      })
    }

    const evaluated = evaluateTennisScore(match.score, match.bestOf, match.retired === true)
    if (!evaluated.ok) {
      ctx.addIssue({ code: 'custom', path: ['score'], message: evaluated.message })
      return
    }

    if (match.retired === true) {
      return
    }

    const expectedWinner =
      evaluated.setsWonByA > evaluated.setsWonByB ? match.playerAId : match.playerBId
    if (match.winnerId !== expectedWinner) {
      ctx.addIssue({
        code: 'custom',
        path: ['winnerId'],
        message: 'The winner does not match the set score',
      })
    }
  })

export type TennisMatch = z.infer<typeof tennisMatchSchema>
