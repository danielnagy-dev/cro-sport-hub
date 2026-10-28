import { z } from 'zod'
import { type FieldIssue, idSchema } from './common.ts'

/**
 * Raw counts for one player in one tennis match. Percentages are not
 * fields: `tennisPercentages` computes them.
 *
 * `secondServeTotal` is the first serves that missed. Points won on the
 * second serve cannot exceed the second serves that landed in
 * (`secondServeTotal - doubleFaults`). Aces are serve points won, so they
 * cannot exceed `firstServePointsWon + secondServePointsWon`.
 */
const MAX_COUNT = 500

const countSchema = z.int().nonnegative().max(MAX_COUNT)

export const tennisMatchStatsSchema = z
  .strictObject({
    matchId: idSchema,
    athleteId: idSchema,
    aces: countSchema,
    doubleFaults: countSchema,
    firstServeIn: countSchema,
    firstServeTotal: countSchema,
    firstServePointsWon: countSchema,
    secondServePointsWon: countSchema,
    secondServeTotal: countSchema,
    breakPointsSaved: countSchema,
    breakPointsFaced: countSchema,
    breakPointsWon: countSchema,
    breakPointsTotal: countSchema,
    winners: countSchema.optional(),
    unforcedErrors: countSchema.optional(),
    totalPointsWon: countSchema,
  })
  .superRefine((stats, ctx) => {
    for (const issue of tennisStatIssues(stats)) {
      ctx.addIssue({ code: 'custom', path: [...issue.path], message: issue.message })
    }
  })

export type TennisMatchStats = z.infer<typeof tennisMatchStatsSchema>

export type TennisStatCounts = {
  aces: number
  doubleFaults: number
  firstServeIn: number
  firstServeTotal: number
  firstServePointsWon: number
  secondServePointsWon: number
  secondServeTotal: number
  breakPointsSaved: number
  breakPointsFaced: number
  breakPointsWon: number
  breakPointsTotal: number
  totalPointsWon: number
}

export function tennisStatIssues(stats: TennisStatCounts): readonly FieldIssue[] {
  const issues: FieldIssue[] = []

  if (stats.firstServeIn > stats.firstServeTotal) {
    issues.push({
      path: ['firstServeIn'],
      message: 'First serves in cannot exceed first serves played',
    })
  }

  if (stats.firstServePointsWon > stats.firstServeIn) {
    issues.push({
      path: ['firstServePointsWon'],
      message: 'First-serve points won cannot exceed first serves in',
    })
  }

  if (stats.secondServeTotal !== stats.firstServeTotal - stats.firstServeIn) {
    issues.push({
      path: ['secondServeTotal'],
      message: 'Second serves played must equal the first serves that missed',
    })
  }

  if (stats.secondServePointsWon > stats.secondServeTotal) {
    issues.push({
      path: ['secondServePointsWon'],
      message: 'Second-serve points won cannot exceed second serves played',
    })
  }

  // secondServePointsWon is non-negative, so this also implies
  // doubleFaults <= secondServeTotal. That check is not repeated.
  if (stats.secondServePointsWon + stats.doubleFaults > stats.secondServeTotal) {
    issues.push({
      path: ['doubleFaults'],
      message: 'Second-serve points won cannot exceed second serves that landed in',
    })
  }

  const servePointsWon = stats.firstServePointsWon + stats.secondServePointsWon
  if (stats.aces > servePointsWon) {
    issues.push({ path: ['aces'], message: 'Aces cannot exceed serve points won' })
  }

  if (servePointsWon > stats.totalPointsWon) {
    issues.push({
      path: ['totalPointsWon'],
      message: 'Total points won cannot be lower than serve points won',
    })
  }

  if (stats.breakPointsSaved > stats.breakPointsFaced) {
    issues.push({
      path: ['breakPointsSaved'],
      message: 'Break points saved cannot exceed break points faced',
    })
  }

  if (stats.breakPointsFaced > stats.firstServeTotal) {
    issues.push({
      path: ['breakPointsFaced'],
      message: 'Break points faced cannot exceed service points played',
    })
  }

  if (stats.breakPointsWon > stats.breakPointsTotal) {
    issues.push({
      path: ['breakPointsWon'],
      message: 'Break points won cannot exceed break points played',
    })
  }

  return issues
}

/**
 * Percentages on a 0–100 scale, not rounded. `null` means the denominator
 * was 0, which is different from 0%.
 *
 * First-serve points won uses first serves in as the denominator.
 * Second-serve points won uses every second-serve point, including double
 * faults. Break points converted uses break points played (`breakPointsWon`
 * / `breakPointsTotal`), not break points faced.
 */
export type TennisPercentages = {
  firstServePct: number | null
  firstServePointsWonPct: number | null
  secondServePointsWonPct: number | null
  breakPointsSavedPct: number | null
  breakPointsConvertedPct: number | null
}

function percentage(count: number, total: number): number | null {
  if (total === 0) {
    return null
  }
  return (count / total) * 100
}

export function tennisPercentages(stats: TennisStatCounts): TennisPercentages {
  return {
    firstServePct: percentage(stats.firstServeIn, stats.firstServeTotal),
    firstServePointsWonPct: percentage(stats.firstServePointsWon, stats.firstServeIn),
    secondServePointsWonPct: percentage(stats.secondServePointsWon, stats.secondServeTotal),
    breakPointsSavedPct: percentage(stats.breakPointsSaved, stats.breakPointsFaced),
    breakPointsConvertedPct: percentage(stats.breakPointsWon, stats.breakPointsTotal),
  }
}
