import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  sportSlugSchema,
  teamLookupSchema,
  type AthleteLookup,
  type CompetitionLookup,
  type SportSlug,
  type TeamLookup,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const editorCompetitionsPath = '/api/editor/competitions'
export const editorAthletesPath = '/api/editor/athletes'
export const editorTeamsPath = '/api/editor/teams'

@Injectable({ providedIn: 'root' })
export class EditorLookupsApi {
  private readonly http = inject(StudioHttp)

  editorCompetitions(sport: SportSlug): Observable<CompetitionLookup[]> {
    const params = new HttpParams().set('sport', sportSlugSchema.parse(sport))
    return this.http.get(
      editorCompetitionsPath,
      (body) => competitionLookupSchema.array().parse(body),
      params,
    )
  }

  editorAthletes(sport: SportSlug): Observable<AthleteLookup[]> {
    const params = new HttpParams().set('sport', sportSlugSchema.parse(sport))
    return this.http.get(
      editorAthletesPath,
      (body) => athleteLookupSchema.array().parse(body),
      params,
    )
  }

  editorTeams(): Observable<TeamLookup[]> {
    return this.http.get(editorTeamsPath, (body) => teamLookupSchema.array().parse(body))
  }
}
