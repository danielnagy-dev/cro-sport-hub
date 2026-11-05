import {
  packageId as sharedTypesPackageId,
  type AthleteName,
  type PublishedMatch,
} from '@cro-sport-hub/shared-types'
import { MatchCard, packageId as uiPackageId, type MatchCardProps } from '@cro-sport-hub/ui'

export function cardProps(match: PublishedMatch): MatchCardProps {
  if (match.sport === 'tennis') {
    return {
      sport: 'tennis',
      playerA: match.playerA,
      playerB: match.playerB,
      sets: match.score,
      retired: match.retired,
      winner: match.winner,
    }
  }
  return {
    sport: 'football',
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
  }
}

function ResultsSection({ items }: { items: readonly PublishedMatch[] | undefined }) {
  if (items === undefined) return <p>Results are unavailable.</p>
  if (items.length === 0) return <p>No published results.</p>
  return (
    <ul className="results">
      {items.map((item) => (
        <li key={item.id}>
          <MatchCard {...cardProps(item)} />
        </li>
      ))}
    </ul>
  )
}

function AthleteLinks({ athletes }: { athletes: readonly AthleteName[] }) {
  if (athletes.length === 0) return null
  return (
    <nav className="sport-athletes" aria-label="Athletes">
      <ul className="sport-athletes__list">
        {athletes.map((athlete) => (
          <li key={athlete.slug}>
            <a href={`/athletes/${athlete.slug}`}>{athlete.name}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Shared results list inside `main`. Empty and failed-fetch copy match the home page. */
export function ResultsMain({ items }: { items: readonly PublishedMatch[] | undefined }) {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <h1>Cro Sport Hub</h1>
      <ResultsSection items={items} />
    </main>
  )
}

/** Sport page: optional athlete links plus the shared results list. */
export function SportResultsMain({
  items,
  athletes,
}: {
  items: readonly PublishedMatch[] | undefined
  athletes: readonly AthleteName[] | undefined
}) {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <h1>Cro Sport Hub</h1>
      {athletes === undefined ? null : <AthleteLinks athletes={athletes} />}
      <ResultsSection items={items} />
    </main>
  )
}
