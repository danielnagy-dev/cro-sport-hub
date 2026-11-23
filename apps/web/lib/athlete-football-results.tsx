import { appearanceScoreLabel, appearanceWhen } from './football-appearance-lines'
import type { PublicAppearance } from './public-editorial-schemas'

export const HISTORY_EMPTY_COPY = 'No history.'
export const UPCOMING_EMPTY_COPY = 'No upcoming appearances.'

export function AthleteAppearanceRows({
  items,
  empty,
}: {
  items: readonly PublicAppearance[]
  empty: string
}) {
  if (items.length === 0) return <p>{empty}</p>
  return (
    <ul className="results">
      {items.map((appearance) => {
        const score = appearanceScoreLabel(appearance)
        return (
          <li key={appearance.id}>
            <p>
              <time dateTime={appearance.startsAt}>{appearanceWhen(appearance)}</time>
              {' · '}
              {appearance.opponentLabel}
              {' · '}
              {appearance.sportSlug}
              {' · '}
              {appearance.status}
            </p>
            {score === undefined ? null : <p>{score}</p>}
          </li>
        )
      })}
    </ul>
  )
}

export function AthleteHistorySection({ items }: { items: readonly PublicAppearance[] }) {
  return (
    <section className="athlete-clubs" aria-labelledby="athlete-history-heading">
      <h2 id="athlete-history-heading">History</h2>
      <AthleteAppearanceRows items={items} empty={HISTORY_EMPTY_COPY} />
    </section>
  )
}

export function AthleteUpcomingSection({ items }: { items: readonly PublicAppearance[] }) {
  return (
    <section className="athlete-clubs" aria-labelledby="athlete-upcoming-heading">
      <h2 id="athlete-upcoming-heading">Upcoming</h2>
      <AthleteAppearanceRows items={items} empty={UPCOMING_EMPTY_COPY} />
    </section>
  )
}
