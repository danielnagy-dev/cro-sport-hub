import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http'
import { matchSchema, sportSchema, type Match, type Sport } from '@cro-sport-hub/shared-types'
import { of } from 'rxjs'
import { matchesPath, sportsPath } from './catalog-api'

/** Seed rows for the read client. No live API and no personal data. */
export const stubSports: Sport[] = sportSchema.array().parse([
  { id: 'sport-tennis', slug: 'tennis', name: 'Tennis' },
  { id: 'sport-football', slug: 'football', name: 'Football' },
])

export const stubMatches: Match[] = matchSchema.array().parse([
  {
    id: 'match-tennis-draft',
    sportId: 'sport-tennis',
    competitionId: 'comp-vienna',
    date: '2026-10-20',
    round: 'QF',
    status: 'draft',
    source: 'manual',
    createdBy: 'editor-1',
  },
  {
    id: 'match-tennis-published',
    sportId: 'sport-tennis',
    competitionId: 'comp-vienna',
    date: '2026-10-18',
    round: 'R16',
    status: 'published',
    source: 'manual',
    createdBy: 'editor-1',
    reviewedBy: 'editor-2',
    publishedAt: '2026-10-18T18:00:00+00:00',
  },
  {
    id: 'match-football-review',
    sportId: 'sport-football',
    competitionId: 'comp-league',
    date: '2026-10-19',
    round: 'Matchday 8',
    status: 'review',
    source: 'import',
    sourceRef: 'fixture-league-8',
    createdBy: 'editor-1',
  },
])

/** Same-origin stand-in for the public read endpoints. */
export const stubApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method === 'GET' && request.url === sportsPath) {
    return of(new HttpResponse({ status: 200, body: stubSports }))
  }

  if (request.method === 'GET' && request.url === matchesPath) {
    return of(new HttpResponse({ status: 200, body: stubMatches }))
  }

  return next(request)
}
