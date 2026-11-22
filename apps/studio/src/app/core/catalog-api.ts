import { inject, Injectable } from '@angular/core'
import { sportSchema, type Sport } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const sportsPath = '/api/sports'

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(StudioHttp)

  sports(): Observable<Sport[]> {
    return this.http.get(sportsPath, (body) => sportSchema.array().parse(body))
  }
}
