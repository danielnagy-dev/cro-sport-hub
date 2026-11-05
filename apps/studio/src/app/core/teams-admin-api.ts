import { inject, Injectable } from '@angular/core'
import { teamSchema, type Team } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const adminTeamsPath = '/api/admin/teams'

export function adminTeamPath(id: string): string {
  return `${adminTeamsPath}/${id}`
}

@Injectable({ providedIn: 'root' })
export class TeamsAdminApi {
  private readonly http = inject(StudioHttp)

  list(): Observable<Team[]> {
    return this.http.get(adminTeamsPath, (body) => teamSchema.array().parse(body))
  }

  create(body: Team): Observable<Team> {
    return this.http.post(adminTeamsPath, body, (response) => teamSchema.parse(response))
  }

  update(id: string, body: Team): Observable<Team> {
    return this.http.put(adminTeamPath(id), body, (response) => teamSchema.parse(response))
  }

  remove(id: string): Observable<void> {
    return this.http.delete(adminTeamPath(id))
  }
}
