import { inject, Injectable } from '@angular/core'
import { editorTennisDraftSchema, type EditorTennisDraft } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const tennisDraftsPath = '/api/matches/tennis'

export function editorTennisDraftPath(id: string): string {
  return `/api/editor/matches/tennis/${id}`
}

export function tennisDraftUpdatePath(id: string): string {
  return `/api/matches/tennis/${id}`
}

export type TennisDraftSaved = { id: string; status: 'draft'; sport: 'tennis' }

function parseTennisDraftSaved(body: unknown): TennisDraftSaved {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid tennis draft response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'draft' || row['sport'] !== 'tennis') {
    throw new Error('Invalid tennis draft response')
  }
  return { id: row['id'], status: 'draft', sport: 'tennis' }
}

@Injectable({ providedIn: 'root' })
export class TennisApi {
  private readonly http = inject(StudioHttp)

  createTennisDraft(body: unknown): Observable<TennisDraftSaved> {
    return this.http.post(tennisDraftsPath, body, parseTennisDraftSaved)
  }

  updateTennisDraft(id: string, body: unknown): Observable<TennisDraftSaved> {
    return this.http.put(tennisDraftUpdatePath(id), body, parseTennisDraftSaved)
  }

  loadEditorTennisDraft(id: string): Observable<EditorTennisDraft> {
    return this.http.get(editorTennisDraftPath(id), (response) =>
      editorTennisDraftSchema.parse(response),
    )
  }
}
