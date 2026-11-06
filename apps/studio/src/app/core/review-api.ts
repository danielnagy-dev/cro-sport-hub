import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type {
  EditorFootballDraft,
  EditorMatch,
  EditorTennisDraft,
  SportSlug,
  Status,
  TennisSetScore,
} from '@cro-sport-hub/shared-types'
import { forkJoin, map, switchMap, throwError, type Observable } from 'rxjs'
import { FootballApi } from './football-api'
import { EditorLookupsApi } from './editor-lookups-api'
import { MatchesApi } from './matches-api'
import { StudioHttp } from './studio-http'
import { TennisApi } from './tennis-api'

export function matchRejectPath(id: string): string {
  return `/api/matches/${id}/reject`
}

export function matchPublishPath(id: string): string {
  return `/api/matches/${id}/publish`
}

export type MatchRejected = { id: string; status: 'draft' }
export type MatchPublished = { id: string; status: 'published' }

export type ReviewMatchSummary = {
  id: string
  sport: SportSlug
  status: Status
  label: string
}

export type ReviewMatchDetail =
  | {
      kind: 'tennis'
      summary: ReviewMatchSummary
      competition: string
      date: string
      round: string
      playerA: string
      playerB: string
      sets: { label: string; score: string }[]
      winner: string
      retired: boolean
    }
  | {
      kind: 'football'
      summary: ReviewMatchSummary
      competition: string
      date: string
      round: string
      homeClub: string
      awayClub: string
      homeGoals: number
      awayGoals: number
      appearances: {
        athlete: string
        club: string
        started: boolean
        minutes: number
        goals: number
        assists: number
        cardsLabel: string
      }[]
    }

function parseReject(body: unknown): MatchRejected {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid reject response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'draft')
    throw new Error('Invalid reject response')
  return { id: row['id'], status: 'draft' }
}

function parsePublish(body: unknown): MatchPublished {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid publish response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'published') {
    throw new Error('Invalid publish response')
  }
  return { id: row['id'], status: 'published' }
}

function name<T extends { id: string; name: string }>(rows: readonly T[], id: string): string {
  return rows.find((r) => r.id === id)?.name ?? id
}

function tennisSetLabel(set: TennisSetScore, index: number): { label: string; score: string } {
  const [a, b, tb] = set
  return {
    label: `Set ${index + 1}`,
    score: tb === undefined ? `${a}-${b}` : `${a}-${b} (tiebreak ${tb})`,
  }
}

function cards(a: { yellowCards: number; redCard: boolean }): string {
  if (a.yellowCards === 0 && !a.redCard) return '—'
  const yellow = a.yellowCards > 0 ? `${a.yellowCards}Y` : ''
  const red = a.redCard ? 'R' : ''
  return yellow + red
}

@Injectable({ providedIn: 'root' })
export class ReviewApi {
  private readonly http = inject(StudioHttp)
  private readonly tennis = inject(TennisApi)
  private readonly football = inject(FootballApi)
  private readonly matches = inject(MatchesApi)
  private readonly lookups = inject(EditorLookupsApi)

  loadMatchForReview(id: string): Observable<ReviewMatchDetail> {
    return this.matches.editorMatches().pipe(
      switchMap((page) => {
        const row = page.items.find((item) => item.id === id)
        if (row === undefined) {
          return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
        }
        return this.detail(row)
      }),
    )
  }

  rejectMatch(id: string): Observable<MatchRejected> {
    return this.http.post(matchRejectPath(id), null, parseReject)
  }

  publishMatch(id: string): Observable<MatchPublished> {
    return this.http.post(matchPublishPath(id), null, parsePublish)
  }

  private detail(row: EditorMatch): Observable<ReviewMatchDetail> {
    const summary: ReviewMatchSummary = {
      id: row.id,
      sport: row.sport,
      status: row.status,
      label: row.label,
    }
    if (row.sport === 'tennis') {
      return forkJoin({
        d: this.tennis.loadEditorTennisDraft(row.id),
        c: this.lookups.editorCompetitions('tennis'),
        a: this.lookups.editorAthletes('tennis'),
      }).pipe(
        map(({ d, c, a }) => {
          const playerA = name(a, d.playerAId)
          const playerB = name(a, d.playerBId)
          return {
            kind: 'tennis' as const,
            summary,
            competition: name(c, d.competitionId),
            date: d.date,
            round: d.round,
            playerA,
            playerB,
            sets: d.score.map(tennisSetLabel),
            winner: (() => {
              if (d.winnerId === d.playerAId) return playerA
              if (d.winnerId === d.playerBId) return playerB
              return name(a, d.winnerId)
            })(),
            retired: d.retired === true,
          }
        }),
      )
    }
    return forkJoin({
      d: this.football.loadEditorFootballDraft(row.id),
      c: this.lookups.editorCompetitions('football'),
      a: this.lookups.editorAthletes('football'),
      t: this.lookups.editorTeams(),
    }).pipe(
      map(({ d, c, a, t }) => ({
        kind: 'football' as const,
        summary,
        competition: name(c, d.competitionId),
        date: d.date,
        round: d.round,
        homeClub: name(t, d.homeTeamId),
        awayClub: name(t, d.awayTeamId),
        homeGoals: d.homeGoals,
        awayGoals: d.awayGoals,
        appearances: (d.appearances ?? []).map((x) => ({
          athlete: name(a, x.athleteId),
          club: name(t, x.teamId),
          started: x.started,
          minutes: x.minutes,
          goals: x.goals,
          assists: x.assists,
          cardsLabel: cards(x),
        })),
      })),
    )
  }
}
