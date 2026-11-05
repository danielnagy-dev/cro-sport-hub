import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  editorMatchPageSchema,
  matchSchema,
  sportSchema,
  sportSlugSchema,
  teamLookupSchema,
  type AthleteLookup,
  type CompetitionLookup,
  type EditorMatchPage,
  type Match,
  type MatchSource,
  type Sport,
  type SportSlug,
  type Status,
  type TeamLookup,
} from '@cro-sport-hub/shared-types'
import { map, type Observable } from 'rxjs'

export const sportsPath = '/api/sports'
export const matchesPath = '/api/matches'
export const editorMatchesPath = '/api/editor/matches'
export const editorCompetitionsPath = '/api/editor/competitions'
export const editorAthletesPath = '/api/editor/athletes'
export const editorTeamsPath = '/api/editor/teams'
export const tennisDraftsPath = '/api/matches/tennis'
export const footballDraftsPath = '/api/matches/football'

export function matchSubmitPath(id: string): string {
  return `/api/matches/${id}/submit`
}

export type TennisDraftSaved = { id: string; status: 'draft'; sport: 'tennis' }
export type FootballDraftSaved = { id: string; status: 'draft'; sport: 'football' }
export type MatchSubmitted = { id: string; status: 'review' }

function parseFootballDraftSaved(body: unknown): FootballDraftSaved {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid football draft response')
  const row = body as Record<string, unknown>
  if (row['status'] !== 'draft' || row['sport'] !== 'football' || typeof row['id'] !== 'string') {
    throw new Error('Invalid football draft response')
  }
  return { id: row['id'], status: 'draft', sport: 'football' }
}

function parseTennisDraftSaved(body: unknown): TennisDraftSaved {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid tennis draft response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'draft' || row['sport'] !== 'tennis') {
    throw new Error('Invalid tennis draft response')
  }
  return { id: row['id'], status: 'draft', sport: 'tennis' }
}

function parseMatchSubmitted(body: unknown): MatchSubmitted {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid submit response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'review') {
    throw new Error('Invalid submit response')
  }
  return { id: row['id'], status: 'review' }
}

export type EditorMatchFilters = {
  sport?: SportSlug
  status?: Status
  source?: MatchSource
}

/**
 * Read-only client for sports and matches.
 * Writes are a later change. Login lives on the auth store.
 */
@Injectable({ providedIn: 'root' })
export class StudioApi {
  private readonly http = inject(HttpClient)

  sports(): Observable<Sport[]> {
    return this.http.get(sportsPath).pipe(map((body) => sportSchema.array().parse(body)))
  }

  matches(): Observable<Match[]> {
    return this.http.get(matchesPath).pipe(map((body) => matchSchema.array().parse(body)))
  }

  editorMatches(filters: EditorMatchFilters = {}): Observable<EditorMatchPage> {
    let params = new HttpParams()
    if (filters.sport !== undefined) params = params.set('sport', filters.sport)
    if (filters.status !== undefined) params = params.set('status', filters.status)
    if (filters.source !== undefined) params = params.set('source', filters.source)
    return this.http
      .get(editorMatchesPath, { params })
      .pipe(map((body) => editorMatchPageSchema.parse(body)))
  }

  editorCompetitions(sport: SportSlug): Observable<CompetitionLookup[]> {
    const params = new HttpParams().set('sport', sportSlugSchema.parse(sport))
    return this.http
      .get(editorCompetitionsPath, { params })
      .pipe(map((body) => competitionLookupSchema.array().parse(body)))
  }

  editorAthletes(sport: SportSlug): Observable<AthleteLookup[]> {
    const params = new HttpParams().set('sport', sportSlugSchema.parse(sport))
    return this.http
      .get(editorAthletesPath, { params })
      .pipe(map((body) => athleteLookupSchema.array().parse(body)))
  }

  editorTeams(): Observable<TeamLookup[]> {
    return this.http.get(editorTeamsPath).pipe(map((body) => teamLookupSchema.array().parse(body)))
  }

  createTennisDraft(body: unknown): Observable<TennisDraftSaved> {
    return this.http
      .post(tennisDraftsPath, body)
      .pipe(map((response) => parseTennisDraftSaved(response)))
  }

  createFootballDraft(body: unknown): Observable<FootballDraftSaved> {
    return this.http
      .post(footballDraftsPath, body)
      .pipe(map((response) => parseFootballDraftSaved(response)))
  }

  submitMatch(id: string): Observable<MatchSubmitted> {
    return this.http
      .post(matchSubmitPath(id), null)
      .pipe(map((response) => parseMatchSubmitted(response)))
  }
}
