import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http'
import { sportSchema, type Sport } from '@cro-sport-hub/shared-types'
import { of } from 'rxjs'
import { sportsPath } from './catalog-api'

/** Seed rows for the read client. No live API and no personal data. */
export const stubSports: Sport[] = sportSchema.array().parse([
  { id: 'sport-tennis', slug: 'tennis', name: 'Tennis' },
  { id: 'sport-football', slug: 'football', name: 'Football' },
])

/** Same-origin stand-in for the public read endpoints. */
export const stubApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method === 'GET' && request.url === sportsPath) {
    return of(new HttpResponse({ status: 200, body: stubSports }))
  }

  return next(request)
}
