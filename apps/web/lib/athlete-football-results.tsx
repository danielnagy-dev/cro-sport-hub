import { type PublicFootballResult } from '@cro-sport-hub/shared-types'
import { AppearancesTable } from '@cro-sport-hub/ui'
import { footballAppearanceLines } from './football-appearance-lines'

/** Published football appearances for one athlete profile. Tennis profiles omit this block. */
export function AthleteFootballResults({
  athleteSlug,
  athleteName,
  results,
}: {
  athleteSlug: string
  athleteName: string
  results: readonly PublicFootballResult[]
}) {
  return (
    <section
      className="athlete-football-results"
      aria-labelledby="athlete-football-results-heading"
    >
      <h2 id="athlete-football-results-heading">Appearances</h2>
      <AppearancesTable
        athleteName={athleteName}
        rows={footballAppearanceLines(athleteSlug, results)}
      />
    </section>
  )
}
