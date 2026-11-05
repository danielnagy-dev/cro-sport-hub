import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export function matchSubmitPath(id: string): string {
  return `/api/matches/${id}/submit`
}

export type MatchSubmitted = { id: string; status: 'review' }

function parseMatchSubmitted(body: unknown): MatchSubmitted {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid submit response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'review') {
    throw new Error('Invalid submit response')
  }
  return { id: row['id'], status: 'review' }
}

@Injectable({ providedIn: 'root' })
export class MatchSubmitApi {
  private readonly http = inject(StudioHttp)

  submitMatch(id: string): Observable<MatchSubmitted> {
    return this.http.post(matchSubmitPath(id), null, parseMatchSubmitted)
  }
}
