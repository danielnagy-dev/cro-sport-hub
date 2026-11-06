import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { EditorMatch, SportSlug, Status, TennisSetScore } from '@cro-sport-hub/shared-types'
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
export type ReviewMatchSummary = { id: string; sport: SportSlug; status: Status; label: string }
type SetRow = { label: string; score: string }
type AppRow = {
  athlete: string
  club: string
  started: boolean
  minutes: number
  goals: number
  assists: number
  cardsLabel: string
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
      sets: SetRow[]
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
      appearances: AppRow[]
    }

function parseReject(body: unknown): MatchRejected {
  const r = body as Record<string, unknown>
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof r['id'] !== 'string' ||
    r['status'] !== 'draft'
  ) {
    throw new Error('Invalid reject response')
  }
  return { id: r['id'], status: 'draft' }
}

function parsePublish(body: unknown): MatchPublished {
  const r = body as Record<string, unknown>
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof r['id'] !== 'string' ||
    r['status'] !== 'published'
  ) {
    throw new Error('Invalid publish response')
  }
  return { id: r['id'], status: 'published' }
}

function nm<T extends { id: string; name: string }>(rows: readonly T[], id: string): string {
  return rows.find((x) => x.id === id)?.name ?? id
}

function setRow(s: TennisSetScore, i: number): SetRow {
  const [a, b, t] = s
  return {
    label: `Set ${i + 1}`,
    score: t === undefined ? `${a}-${b}` : `${a}-${b} (tiebreak ${t})`,
  }
}

function crd(x: { yellowCards: number; redCard: boolean }): string {
  if (x.yellowCards === 0 && !x.redCard) return '—'
  return `${x.yellowCards > 0 ? `${x.yellowCards}Y` : ''}${x.redCard ? 'R' : ''}`
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
        return row === undefined
          ? throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
          : this.detail(row)
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
          const pa = nm(a, d.playerAId)
          const pb = nm(a, d.playerBId)
          return {
            kind: 'tennis' as const,
            summary,
            competition: nm(c, d.competitionId),
            date: d.date,
            round: d.round,
            playerA: pa,
            playerB: pb,
            sets: d.score.map(setRow),
            winner:
              d.winnerId === d.playerAId ? pa : d.winnerId === d.playerBId ? pb : nm(a, d.winnerId),
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
        competition: nm(c, d.competitionId),
        date: d.date,
        round: d.round,
        homeClub: nm(t, d.homeTeamId),
        awayClub: nm(t, d.awayTeamId),
        homeGoals: d.homeGoals,
        awayGoals: d.awayGoals,
        appearances: (d.appearances ?? []).map((x) => ({
          athlete: nm(a, x.athleteId),
          club: nm(t, x.teamId),
          started: x.started,
          minutes: x.minutes,
          goals: x.goals,
          assists: x.assists,
          cardsLabel: crd(x),
        })),
      })),
    )
  }
}
