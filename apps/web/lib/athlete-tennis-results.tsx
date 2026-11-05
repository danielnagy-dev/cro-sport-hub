import { type PublicTennisResult, type TennisStatCounts } from '@cro-sport-hub/shared-types'
import { MatchCard, TennisStats, type MatchCardProps } from '@cro-sport-hub/ui'

function matchCardProps(athleteName: string, result: PublicTennisResult): MatchCardProps {
  return {
    sport: 'tennis',
    playerA: athleteName,
    playerB: result.opponent,
    sets: result.score,
    retired: result.retired,
    winner: result.winner === 'athlete' ? 'a' : 'b',
  }
}

/** Raw counts when the API attached stats. Percentages stay inside `TennisStats`. */
function statCounts(result: PublicTennisResult): TennisStatCounts | null {
  if (result.percentages === null) return null
  return {
    aces: result.aces,
    doubleFaults: result.doubleFaults,
    firstServeIn: result.firstServeIn,
    firstServeTotal: result.firstServeTotal,
    firstServePointsWon: result.firstServePointsWon,
    secondServePointsWon: result.secondServePointsWon,
    secondServeTotal: result.secondServeTotal,
    breakPointsSaved: result.breakPointsSaved,
    breakPointsFaced: result.breakPointsFaced,
    breakPointsWon: result.breakPointsWon,
    breakPointsTotal: result.breakPointsTotal,
    totalPointsWon: result.totalPointsWon,
  }
}

/** Published tennis matches for one athlete profile. Football profiles omit this block. */
export function AthleteTennisResults({
  athleteName,
  results,
}: {
  athleteName: string
  results: readonly PublicTennisResult[]
}) {
  if (results.length === 0) return null

  return (
    <section className="athlete-tennis-results" aria-labelledby="athlete-tennis-results-heading">
      <h2 id="athlete-tennis-results-heading">Results</h2>
      <ul className="athlete-tennis-results__list">
        {results.map((result) => {
          const counts = statCounts(result)
          return (
            <li key={result.id}>
              <MatchCard {...matchCardProps(athleteName, result)} />
              {counts === null ? null : <TennisStats player={athleteName} stats={counts} />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
