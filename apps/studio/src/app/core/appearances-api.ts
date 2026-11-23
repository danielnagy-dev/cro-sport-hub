import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  creatorKindSchema,
  idSchema,
  sportSlugSchema,
  textSchema,
  timestampSchema,
  type AppearanceStatus,
  type CreatorKind,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const appearancesPath = '/api/editor/appearances'
export function appearanceLineupPath(id: string): string {
  return `${appearancesPath}/${id}/lineup`
}

export type EditorAppearance = {
  id: string
  sportSlug: SportSlug
  opponentLabel: string
  startsAt: string
  creatorKind: CreatorKind
}

export type AppearanceWriteBody = {
  id: string
  sportId: string
  sportSlug: SportSlug
  competitionId: string
  athleteId?: string
  athleteSport?: SportSlug
  nationalTeamId?: string
  opponentLabel: string
  startsAt: string
  status: AppearanceStatus
  creatorKind: CreatorKind
}

export type LineupWriteBody = {
  athleteId: string
  athleteSport: SportSlug
  started: boolean
  stats: Record<string, unknown>
}

function parseAppearance(body: unknown): EditorAppearance {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid appearance response')
  const row = body as Record<string, unknown>
  return {
    id: idSchema.parse(row['id']),
    sportSlug: sportSlugSchema.parse(row['sportSlug']),
    opponentLabel: textSchema(120).parse(row['opponentLabel']),
    startsAt: timestampSchema.parse(row['startsAt']),
    creatorKind: creatorKindSchema.parse(row['creatorKind']),
  }
}

function parseAppearanceList(body: unknown): EditorAppearance[] {
  if (!Array.isArray(body)) throw new Error('Invalid appearance list response')
  return body.map(parseAppearance)
}

@Injectable({ providedIn: 'root' })
export class AppearancesApi {
  private readonly http = inject(StudioHttp)

  list(query: { day: string; sportSlug: SportSlug }): Observable<EditorAppearance[]> {
    const params = new HttpParams().set('day', query.day).set('sportSlug', query.sportSlug)
    return this.http.get(appearancesPath, parseAppearanceList, params)
  }

  listForAthlete(athleteId: string): Observable<EditorAppearance[]> {
    const params = new HttpParams().set('athleteId', idSchema.parse(athleteId))
    return this.http.get(appearancesPath, parseAppearanceList, params)
  }

  create(body: AppearanceWriteBody): Observable<EditorAppearance> {
    return this.http.post(appearancesPath, body, parseAppearance)
  }

  createLineup(appearanceId: string, body: LineupWriteBody): Observable<unknown> {
    return this.http.post(appearanceLineupPath(appearanceId), body, (r) => r)
  }
}
