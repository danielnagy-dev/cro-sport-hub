import type { TennisSetScore } from '@cro-sport-hub/shared-types'
import type { ReactNode } from 'react'
import { Badge } from './badge.tsx'

type TennisCard = {
  sport: 'tennis'
  playerA: string
  playerB: string
  sets: readonly TennisSetScore[]
  retired?: boolean
  /** Side that won. Omitted for a retirement that has no winner yet. */
  winner?: 'a' | 'b'
}

type FootballCard = {
  sport: 'football'
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
}

export type MatchCardProps = TennisCard | FootballCard

function playerName(name: string, winner: boolean): ReactNode {
  if (!winner) return name
  return (
    <>
      {name} <Badge>Winner</Badge>
    </>
  )
}

/**
 * The third set number is the loser's tiebreak total. It is read with that
 * player, and the superscript is hidden from assistive tech so it is not
 * announced twice.
 */
function gamesCell(set: TennisSetScore, side: 'a' | 'b'): ReactNode {
  const games = side === 'a' ? set[0] : set[1]
  const opponent = side === 'a' ? set[1] : set[0]
  const tiebreak = set.length === 3 ? set[2] : undefined
  if (tiebreak === undefined || games >= opponent) return games

  return (
    <>
      {games}
      <span className="csh-match-card__tiebreak">
        <span className="csh-visually-hidden">, tiebreak {tiebreak}</span>
        <sup aria-hidden="true">{tiebreak}</sup>
      </span>
    </>
  )
}

function TennisScoreboard({ playerA, playerB, sets, retired = false, winner }: TennisCard) {
  const row = (side: 'a' | 'b', name: string) => (
    <tr>
      <th scope="row">{playerName(name, winner === side)}</th>
      {sets.map((set, index) => (
        <td key={`set-${index + 1}`}>{gamesCell(set, side)}</td>
      ))}
    </tr>
  )

  return (
    <div className="csh-match-card">
      <table>
        <caption>
          {playerA} versus {playerB}
        </caption>
        <thead>
          <tr>
            <th scope="col">Player</th>
            {sets.map((_, index) => (
              <th key={`heading-${index + 1}`} scope="col">
                Set {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row('a', playerA)}
          {row('b', playerB)}
        </tbody>
      </table>
      {retired ? <p className="csh-match-card__note">Retired</p> : null}
    </div>
  )
}

function FootballScoreline({ homeTeam, awayTeam, homeGoals, awayGoals }: FootballCard) {
  return (
    <div className="csh-match-card">
      <table>
        <caption>
          {homeTeam} versus {awayTeam}
        </caption>
        <thead>
          <tr>
            <th scope="col">Club</th>
            <th scope="col">Goals</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{homeTeam}</th>
            <td>{homeGoals}</td>
          </tr>
          <tr>
            <th scope="row">{awayTeam}</th>
            <td>{awayGoals}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Tennis set scoreboard or football score. Football has no winner. */
export function MatchCard(props: MatchCardProps) {
  if (props.sport === 'tennis') return <TennisScoreboard {...props} />
  return <FootballScoreline {...props} />
}
