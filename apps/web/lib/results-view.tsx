import {
  packageId as sharedTypesPackageId,
  type AthleteName,
  type PublishedMatch,
} from '@cro-sport-hub/shared-types'
import { MatchCard, packageId as uiPackageId, type MatchCardProps } from '@cro-sport-hub/ui'
import {
  appearanceParticipantLabel,
  appearanceResultLabel,
  isLiveAppearance,
  shiftIsoDay,
} from './day-list'
import type { PublicAppearance } from './public-editorial-schemas'

export const LIVE_LABEL = 'u tijeku'
export const DAY_EMPTY_COPY = 'Nema nastupa za ovaj dan.'
export const DAY_UNAVAILABLE_COPY = 'Nastupi nisu dostupni.'

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

export function ResultsMain({
  day,
  items,
  now = new Date(),
}: {
  day: string
  items: readonly PublicAppearance[] | undefined
  now?: Date
}) {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <h1>Cro Sport Hub</h1>
      <nav className="day-nav" aria-label="Dan">
        <a href={`/?day=${shiftIsoDay(day, -1)}`}>‹</a>
        <time dateTime={day}>{day}</time>
        <a href={`/?day=${shiftIsoDay(day, 1)}`}>›</a>
      </nav>
      {items === undefined ? (
        <p>{DAY_UNAVAILABLE_COPY}</p>
      ) : items.length === 0 ? (
        <p>{DAY_EMPTY_COPY}</p>
      ) : (
        <ul className="results">
          {items.map((appearance) => {
            const live = isLiveAppearance(appearance, now)
            const resultLabel = appearanceResultLabel(appearance)
            return (
              <li key={appearance.id}>
                <p>
                  {appearanceParticipantLabel(appearance)} · {appearance.opponentLabel} ·{' '}
                  {appearance.sportSlug}
                </p>
                {live ? <p>{LIVE_LABEL}</p> : null}
                {!live && resultLabel !== undefined ? <p>{resultLabel}</p> : null}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

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
