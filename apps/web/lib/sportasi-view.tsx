import type { SportSlug } from '@cro-sport-hub/shared-types'
import { sportLabel, sportOrder } from '@cro-sport-hub/ui'
import { t } from './messages'
import type { PublicAthleteIndexItem } from './public-editorial-schemas'

export const SPORTASI_EMPTY_COPY = 'Nema sportaša za ovaj sport.'
export const SPORTASI_UNAVAILABLE_COPY = 'Sportaši nisu dostupni.'

export function parseSportSlug(raw: string | string[] | undefined): SportSlug {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'tennis' || value === 'football' || value === 'basketball') return value
  return sportOrder[0]
}

export function SportasiMain({
  sport,
  athletes,
}: {
  sport: SportSlug
  athletes: readonly PublicAthleteIndexItem[] | undefined
}) {
  return (
    <main id="content" tabIndex={-1}>
      <h1>{t('sportasi.title')}</h1>
      <p>{t('sportasi.lead')}</p>
      <nav className="sport-filter" aria-label={t('sportasi.sports-aria')}>
        <ul className="sport-filter__list">
          {sportOrder.map((slug) => {
            const selected = slug === sport
            return (
              <li key={slug}>
                <a
                  className="sport-filter__link"
                  href={`/sportasi?sport=${slug}`}
                  aria-current={selected ? 'page' : undefined}
                >
                  {sportLabel[slug]}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      {athletes === undefined ? (
        <p>{SPORTASI_UNAVAILABLE_COPY}</p>
      ) : athletes.length === 0 ? (
        <p>{SPORTASI_EMPTY_COPY}</p>
      ) : (
        <ul className="sport-athletes__list">
          {athletes.map((athlete) => (
            <li key={athlete.slug}>
              <a href={`/athletes/${athlete.slug}`}>{athlete.name}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
