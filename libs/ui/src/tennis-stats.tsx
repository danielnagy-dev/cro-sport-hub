import { tennisPercentages, type TennisStatCounts } from '@cro-sport-hub/shared-types'

export type TennisStatsProps = {
  player: string
  stats: TennisStatCounts
}

const statRows = [
  ['First serve', 'firstServePct'],
  ['First-serve points won', 'firstServePointsWonPct'],
  ['Second-serve points won', 'secondServePointsWonPct'],
  ['Break points saved', 'breakPointsSavedPct'],
  ['Break points converted', 'breakPointsConvertedPct'],
] as const

/** One decimal when needed. `null` is a zero denominator, which is not 0%. */
function formatPercentage(value: number | null): string {
  if (value === null) return 'No attempts'
  const tenths = Math.round(value * 10) / 10
  return `${Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1)}%`
}

/** Serve and return percentages for one player in one match. */
export function TennisStats({ player, stats }: TennisStatsProps) {
  const percentages = tennisPercentages(stats)

  return (
    <div className="csh-tennis-stats">
      <table>
        <caption>{player} serve and return</caption>
        <thead>
          <tr>
            <th scope="col">Stat</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {statRows.map(([label, key]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td>{formatPercentage(percentages[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
