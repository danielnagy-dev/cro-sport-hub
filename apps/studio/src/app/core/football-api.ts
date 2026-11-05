import { inject, Injectable } from '@angular/core'
import { editorFootballDraftSchema, type EditorFootballDraft } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const footballDraftsPath = '/api/matches/football'

export function editorFootballDraftPath(id: string): string {
  return `/api/editor/matches/football/${id}`
}

export function footballDraftUpdatePath(id: string): string {
  return `/api/matches/football/${id}`
}

export type FootballDraftSaved = { id: string; status: 'draft'; sport: 'football' }

function parseFootballDraftSaved(body: unknown): FootballDraftSaved {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid football draft response')
  const row = body as Record<string, unknown>
  if (row['status'] !== 'draft' || row['sport'] !== 'football' || typeof row['id'] !== 'string') {
    throw new Error('Invalid football draft response')
  }
  return { id: row['id'], status: 'draft', sport: 'football' }
}

@Injectable({ providedIn: 'root' })
export class FootballApi {
  private readonly http = inject(StudioHttp)

  createFootballDraft(body: unknown): Observable<FootballDraftSaved> {
    return this.http.post(footballDraftsPath, body, parseFootballDraftSaved)
  }

  updateFootballDraft(id: string, body: unknown): Observable<FootballDraftSaved> {
    return this.http.put(footballDraftUpdatePath(id), body, parseFootballDraftSaved)
  }

  loadEditorFootballDraft(id: string): Observable<EditorFootballDraft> {
    return this.http.get(editorFootballDraftPath(id), (response) =>
      editorFootballDraftSchema.parse(response),
    )
  }
}
