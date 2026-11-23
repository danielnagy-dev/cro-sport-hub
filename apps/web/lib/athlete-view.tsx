import { packageId as sharedTypesPackageId } from '@cro-sport-hub/shared-types'
import { AthleteHeader, packageId as uiPackageId } from '@cro-sport-hub/ui'
import { AthleteHistorySection, AthleteUpcomingSection } from './athlete-football-results'
import type { PublicAthleteProfile } from './public-editorial-schemas'

export const CLUB_EMPTY_COPY = 'No club.'
export const ATHLETE_UNAVAILABLE_COPY = 'This athlete is unavailable.'

export function AthleteProfileMain({ profile }: { profile: PublicAthleteProfile }) {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <AthleteHeader
        name={profile.name}
        country={profile.country}
        sport={profile.sport}
        birthYear={profile.birthYear}
        position={profile.position}
      />
      <section className="athlete-clubs" aria-labelledby="athlete-club-heading">
        <h2 id="athlete-club-heading">Club</h2>
        <p>{profile.clubName ?? CLUB_EMPTY_COPY}</p>
      </section>
      <AthleteHistorySection items={profile.history} />
      <AthleteUpcomingSection items={profile.upcoming} />
    </main>
  )
}

export function AthleteUnavailableMain() {
  return (
    <main id="content" tabIndex={-1}>
      <h1>Cro Sport Hub</h1>
      <p>{ATHLETE_UNAVAILABLE_COPY}</p>
    </main>
  )
}
