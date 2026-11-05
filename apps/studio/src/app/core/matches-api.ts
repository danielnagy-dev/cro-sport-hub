import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  editorMatchPageSchema,
  type EditorMatchPage,
  type MatchSource,
  type SportSlug,
  type Status,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const editorMatchesPath = '/api/editor/matches'

export type EditorMatchFilters = {
  sport?: SportSlug
  status?: Status
  source?: MatchSource
}

@Injectable({ providedIn: 'root' })
export class MatchesApi {
  private readonly http = inject(StudioHttp)

  editorMatches(filters: EditorMatchFilters = {}): Observable<EditorMatchPage> {
    let params = new HttpParams()
    if (filters.sport !== undefined) params = params.set('sport', filters.sport)
    if (filters.status !== undefined) params = params.set('status', filters.status)
    if (filters.source !== undefined) params = params.set('source', filters.source)
    return this.http.get(editorMatchesPath, (body) => editorMatchPageSchema.parse(body), params)
  }
}
