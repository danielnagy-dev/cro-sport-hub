import {
  packageId as sharedTypesPackageId,
  type PublicAthlete,
  type PublicClubSpell,
} from '@cro-sport-hub/shared-types'
import { AthleteHeader, packageId as uiPackageId } from '@cro-sport-hub/ui'

function clubRange(spell: PublicClubSpell): string {
  return spell.to === undefined ? spell.from : `${spell.from} – ${spell.to}`
}

/** Athlete profile inside `main`. Omits tennis results and football appearances (later slices). */
export function AthleteProfileMain({ profile }: { profile: PublicAthlete }) {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <AthleteHeader
        name={profile.name}
        country={profile.country}
        sport={profile.sport}
        birthYear={profile.birthYear}
        position={profile.position}
      />
      <section className="athlete-clubs" aria-labelledby="athlete-clubs-heading">
        <h2 id="athlete-clubs-heading">Clubs</h2>
        {profile.clubs.length === 0 ? (
          <p>No clubs.</p>
        ) : (
          <ul className="athlete-clubs__list">
            {profile.clubs.map((club) => (
              <li key={`${club.name}-${club.from}`}>
                {club.name} ({clubRange(club)})
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

/** Shell and copy when the profile fetch failed but the slug was not missing. */
export function AthleteUnavailableMain() {
  return (
    <main id="content" tabIndex={-1}>
      <h1>Cro Sport Hub</h1>
      <p>This athlete is unavailable.</p>
    </main>
  )
}
