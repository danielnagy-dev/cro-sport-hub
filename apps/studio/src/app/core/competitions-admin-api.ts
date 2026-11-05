import { inject, Injectable } from '@angular/core'
import { competitionSchema, type Competition } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const adminCompetitionsPath = '/api/admin/competitions'

export function adminCompetitionPath(id: string): string {
  return `${adminCompetitionsPath}/${id}`
}

@Injectable({ providedIn: 'root' })
export class CompetitionsAdminApi {
  private readonly http = inject(StudioHttp)

  list(): Observable<Competition[]> {
    return this.http.get(adminCompetitionsPath, (body) => competitionSchema.array().parse(body))
  }

  create(body: Competition): Observable<Competition> {
    return this.http.post(adminCompetitionsPath, body, (response) =>
      competitionSchema.parse(response),
    )
  }

  update(id: string, body: Competition): Observable<Competition> {
    return this.http.put(adminCompetitionPath(id), body, (response) =>
      competitionSchema.parse(response),
    )
  }

  remove(id: string): Observable<void> {
    return this.http.delete(adminCompetitionPath(id))
  }
}
