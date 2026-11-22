import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { httpsUrlSchema, idSchema, timestampSchema } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const sourcesPath = '/api/editor/sources'

export type AppearanceSource = {
  appearanceId: string
  sourceId: string
  url: string
  fetchedAt: string
  disagrees: boolean
}

function parseSource(body: unknown): AppearanceSource {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid appearance source')
  const row = body as Record<string, unknown>
  if (typeof row['disagrees'] !== 'boolean') throw new Error('Invalid appearance source')
  return {
    appearanceId: idSchema.parse(row['appearanceId']),
    sourceId: idSchema.parse(row['sourceId']),
    url: httpsUrlSchema.parse(row['url']),
    fetchedAt: timestampSchema.parse(row['fetchedAt']),
    disagrees: row['disagrees'],
  }
}

@Injectable({ providedIn: 'root' })
export class SourcesApi {
  private readonly http = inject(StudioHttp)

  listForAppearance(appearanceId: string): Observable<AppearanceSource[]> {
    const params = new HttpParams().set('appearanceId', idSchema.parse(appearanceId))
    return this.http.get(
      sourcesPath,
      (body) => {
        if (!Array.isArray(body)) throw new Error('Invalid appearance sources response')
        return body.map(parseSource)
      },
      params,
    )
  }
}
