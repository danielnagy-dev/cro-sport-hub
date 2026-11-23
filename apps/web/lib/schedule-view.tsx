import type { SportSlug } from '@cro-sport-hub/shared-types'
import { appearanceParticipantLabel, appearanceResultLabel, isLiveAppearance } from './day-list'
import { t } from './messages'
import type { SeededNationalTeam } from './national-teams'
import type { NationalTeamSchedule, PublicAppearance } from './public-editorial-schemas'
import { LIVE_LABEL } from './results-view'

export const SCHEDULE_UNAVAILABLE_COPY = 'Raspored nije dostupan.'
export const SCHEDULE_BUCKET_EMPTY_COPY = 'Nema nastupa.'

const SPORT_LABEL: Record<SportSlug, string> = {
  football: 'Nogomet',
  basketball: 'Košarka',
  tennis: 'Tenis',
}

function AppearanceRows({ items, now }: { items: readonly PublicAppearance[]; now: Date }) {
  if (items.length === 0) return <p>{SCHEDULE_BUCKET_EMPTY_COPY}</p>
  return (
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
  )
}

function Bucket({
  heading,
  items,
  now,
}: {
  heading: string
  items: readonly PublicAppearance[]
  now: Date
}) {
  return (
    <section>
      <h2>{heading}</h2>
      <AppearanceRows items={items} now={now} />
    </section>
  )
}

export function ScheduleMain({
  sport,
  teams,
  schedule,
  now = new Date(),
}: {
  sport: SportSlug
  teams: readonly SeededNationalTeam[]
  schedule: NationalTeamSchedule | undefined
  now?: Date
}) {
  return (
    <main id="content" tabIndex={-1}>
      <h1>{t('reprezentacija.title')}</h1>
      <p>{t('reprezentacija.lead')}</p>
      <nav className="sport-athletes" aria-label={t('reprezentacija.sport-aria')}>
        <ul className="sport-athletes__list">
          {teams.map((team) => {
            const selected = team.sportSlug === sport
            const href = `/reprezentacija?sport=${team.sportSlug}`
            return (
              <li key={team.slug}>
                <a href={href} aria-current={selected ? 'page' : undefined}>
                  {SPORT_LABEL[team.sportSlug]}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      {schedule === undefined ? (
        <p>{SCHEDULE_UNAVAILABLE_COPY}</p>
      ) : (
        <>
          <Bucket heading={t('reprezentacija.past')} items={schedule.past} now={now} />
          <Bucket heading={t('reprezentacija.current')} items={schedule.current} now={now} />
          <Bucket heading={t('reprezentacija.upcoming')} items={schedule.upcoming} now={now} />
        </>
      )}
    </main>
  )
}
