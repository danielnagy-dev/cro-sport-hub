import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  editorMatchPageSchema,
  matchSchema,
  sportSchema,
  type EditorMatchPage,
  type Match,
  type MatchSource,
  type Sport,
  type SportSlug,
  type Status,
} from '@cro-sport-hub/shared-types'
import { map, type Observable } from 'rxjs'

export const sportsPath = '/api/sports'
export const matchesPath = '/api/matches'
export const editorMatchesPath = '/api/editor/matches'

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
}
