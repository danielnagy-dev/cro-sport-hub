import type { Appearance, Competition, Match } from '@cro-sport-hub/shared-types'

export type AppearanceLine = {
  appearance: Appearance
  competition: Pick<Competition, 'name' | 'season'>
  match: Pick<Match, 'date' | 'round'>
}

export type AppearancesTableProps = {
  athleteName: string
  rows: readonly AppearanceLine[]
}

const HEADERS = [
  'Date',
  'Competition',
  'Round',
  'Started',
  'Minutes',
  'Goals',
  'Assists',
  'Cards',
] as const

function cardLabel(yellowCards: number, redCard: boolean): string {
  if (yellowCards >= 2) return 'Second yellow'
  if (yellowCards === 1 && redCard) return 'Yellow, red'
  if (redCard) return 'Red'
  if (yellowCards === 1) return 'Yellow'
  return 'None'
}

/** One athlete's appearances, one row per match. */
export function AppearancesTable({ athleteName, rows }: AppearancesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="csh-appearances">
        <p>{athleteName} appearances</p>
        <p>No appearances</p>
      </div>
    )
  }

  return (
    <div className="csh-appearances">
      <table>
        <caption>{athleteName} appearances</caption>
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((line) => (
            <tr key={line.appearance.matchId}>
              <th scope="row">{line.match.date}</th>
              <td>
                {line.competition.name} {line.competition.season}
              </td>
              <td>{line.match.round}</td>
              <td>{line.appearance.started ? 'Yes' : 'No'}</td>
              <td>{line.appearance.minutes}</td>
              <td>{line.appearance.goals}</td>
              <td>{line.appearance.assists}</td>
              <td>{cardLabel(line.appearance.yellowCards, line.appearance.redCard)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
