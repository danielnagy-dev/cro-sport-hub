import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { SportSlug, Status } from '@cro-sport-hub/shared-types'
import { catchError, map, switchMap, throwError, type Observable } from 'rxjs'
import { FootballApi } from './football-api'
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

function parseMatchRejected(body: unknown): MatchRejected {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid reject response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'draft') {
    throw new Error('Invalid reject response')
  }
  return { id: row['id'], status: 'draft' }
}

function parseMatchPublished(body: unknown): MatchPublished {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid publish response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'published') {
    throw new Error('Invalid publish response')
  }
  return { id: row['id'], status: 'published' }
}

@Injectable({ providedIn: 'root' })
export class ReviewApi {
  private readonly http = inject(StudioHttp)
  private readonly tennis = inject(TennisApi)
  private readonly football = inject(FootballApi)
  private readonly matches = inject(MatchesApi)

  loadSummary(id: string): Observable<ReviewMatchSummary> {
    return this.loadDraft(id).pipe(
      switchMap((draft) =>
        this.matches.editorMatches({ sport: draft.sport }).pipe(
          map((page) => {
            const row = page.items.find((item) => item.id === id)
            return {
              id,
              sport: draft.sport,
              status: draft.status,
              label: row?.label ?? id,
            }
          }),
        ),
      ),
    )
  }

  rejectMatch(id: string): Observable<MatchRejected> {
    return this.http.post(matchRejectPath(id), null, parseMatchRejected)
  }

  publishMatch(id: string): Observable<MatchPublished> {
    return this.http.post(matchPublishPath(id), null, parseMatchPublished)
  }

  private loadDraft(id: string): Observable<{ sport: SportSlug; status: Status }> {
    return this.tennis.loadEditorTennisDraft(id).pipe(
      map((draft) => ({ sport: 'tennis' as const, status: draft.status })),
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
          return throwError(() => error)
        }
        return this.football.loadEditorFootballDraft(id).pipe(
          map((draft) => ({ sport: 'football' as const, status: draft.status })),
        )
      }),
    )
  }
}
