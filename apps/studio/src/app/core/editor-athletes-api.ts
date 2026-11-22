import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  athleteSchema,
  sportSlugSchema,
  type Athlete,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const editorTrackedAthletesPath = '/api/editor/tracked-athletes'

export function editorTrackedAthletePath(id: string): string {
  return `${editorTrackedAthletesPath}/${id}`
}

export type EditorAthlete = Athlete & { clubName?: string }

const SPORT_IDS = {
  tennis: 'sport-tennis',
  football: 'sport-football',
  basketball: 'sport-basketball',
} as const satisfies Record<SportSlug, string>

export function sportIdForSlug(sport: SportSlug): string {
  return SPORT_IDS[sport]
}

export function sportSlugForId(sportId: string): SportSlug | undefined {
  for (const [slug, id] of Object.entries(SPORT_IDS) as [SportSlug, string][]) {
    if (id === sportId) return slug
  }
  return undefined
}

/** `athleteSchema` is strict and rejects `clubName`, so pick known fields first. */
export function parseEditorAthlete(body: unknown): EditorAthlete {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new Error('Invalid editor athlete')
  }
  const row = body as Record<string, unknown>
  const base = athleteSchema.parse({
    id: row['id'],
    slug: row['slug'],
    name: row['name'],
    sportId: row['sportId'],
    country: row['country'],
    ...(row['birthYear'] !== undefined ? { birthYear: row['birthYear'] } : {}),
    ...(row['position'] !== undefined ? { position: row['position'] } : {}),
    ...(row['photoUrl'] !== undefined ? { photoUrl: row['photoUrl'] } : {}),
  })
  return typeof row['clubName'] === 'string' ? { ...base, clubName: row['clubName'] } : base
}

@Injectable({ providedIn: 'root' })
export class EditorAthletesApi {
  private readonly http = inject(StudioHttp)

  list(sport: SportSlug): Observable<EditorAthlete[]> {
    const params = new HttpParams().set('sport', sportSlugSchema.parse(sport))
    return this.http.get(
      editorTrackedAthletesPath,
      (body) => {
        if (!Array.isArray(body)) throw new Error('Invalid editor athlete list')
        return body.map(parseEditorAthlete)
      },
      params,
    )
  }

  create(body: EditorAthlete): Observable<EditorAthlete> {
    return this.http.post(editorTrackedAthletesPath, body, parseEditorAthlete)
  }

  update(id: string, body: EditorAthlete): Observable<EditorAthlete> {
    return this.http.put(editorTrackedAthletePath(id), body, parseEditorAthlete)
  }
}
