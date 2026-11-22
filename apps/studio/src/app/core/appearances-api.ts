import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  appearanceStatusSchema,
  creatorKindSchema,
  idSchema,
  sportSlugSchema,
  timestampSchema,
  type AppearanceStatus,
  type CreatorKind,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const appearancesPath = '/api/editor/appearances'

export type Appearance = {
  id: string
  sportId: string
  sportSlug: SportSlug
  competitionId: string
  athleteId?: string
  athleteSport?: SportSlug
  nationalTeamId?: string
  opponentLabel: string
  startsAt: string
  endsAt?: string
  status: AppearanceStatus
  result?: Record<string, unknown>
  creatorKind: CreatorKind
  createdAt: string
  updatedAt: string
}

export type AppearanceListQuery = {
  day: string
  sportSlug?: SportSlug
}

const rec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export function parseAppearance(value: unknown): Appearance {
  if (!rec(value) || typeof value['opponentLabel'] !== 'string') {
    throw new Error('Invalid appearance')
  }
  const athleteId = value['athleteId']
  const athleteSport = value['athleteSport']
  const nationalTeamId = value['nationalTeamId']
  const endsAt = value['endsAt']
  const result = value['result']
  return {
    id: idSchema.parse(value['id']),
    sportId: idSchema.parse(value['sportId']),
    sportSlug: sportSlugSchema.parse(value['sportSlug']),
    competitionId: idSchema.parse(value['competitionId']),
    ...(typeof athleteId === 'string' ? { athleteId: idSchema.parse(athleteId) } : {}),
    ...(typeof athleteSport === 'string'
      ? { athleteSport: sportSlugSchema.parse(athleteSport) }
      : {}),
    ...(typeof nationalTeamId === 'string'
      ? { nationalTeamId: idSchema.parse(nationalTeamId) }
      : {}),
    opponentLabel: value['opponentLabel'],
    startsAt: timestampSchema.parse(value['startsAt']),
    ...(typeof endsAt === 'string' ? { endsAt: timestampSchema.parse(endsAt) } : {}),
    status: appearanceStatusSchema.parse(value['status']),
    ...(rec(result) ? { result } : {}),
    creatorKind: creatorKindSchema.parse(value['creatorKind']),
    createdAt: timestampSchema.parse(value['createdAt']),
    updatedAt: timestampSchema.parse(value['updatedAt']),
  }
}

export const sampleAppearance: Appearance = parseAppearance({
  id: 'appearance-sample-tennis',
  sportId: 'sport-tennis',
  sportSlug: 'tennis',
  competitionId: 'comp-sample-cup',
  athleteId: 'sample-player-a',
  athleteSport: 'tennis',
  opponentLabel: 'Sample Rival',
  startsAt: '2026-11-22T14:00:00.000Z',
  status: 'scheduled',
  creatorKind: 'manual',
  createdAt: '2026-11-22T12:00:00.000Z',
  updatedAt: '2026-11-22T12:00:00.000Z',
})

export const sampleNationalTeamAppearance: Appearance = parseAppearance({
  id: 'appearance-sample-football-nt',
  sportId: 'sport-football',
  sportSlug: 'football',
  competitionId: 'comp-sample-league',
  nationalTeamId: 'nt-croatia-football',
  opponentLabel: 'Sample Neighbours',
  startsAt: '2026-11-22T19:45:00.000Z',
  status: 'scheduled',
  creatorKind: 'manual',
  createdAt: '2026-11-22T12:00:00.000Z',
  updatedAt: '2026-11-22T12:00:00.000Z',
})

@Injectable({ providedIn: 'root' })
export class AppearancesApi {
  private readonly http = inject(StudioHttp)

  list(query: AppearanceListQuery): Observable<Appearance[]> {
    let params = new HttpParams().set('day', query.day)
    if (query.sportSlug !== undefined) params = params.set('sportSlug', query.sportSlug)
    return this.http.get(
      appearancesPath,
      (body) => {
        if (!Array.isArray(body)) throw new Error('Invalid appearance list')
        return body.map(parseAppearance)
      },
      params,
    )
  }
}
