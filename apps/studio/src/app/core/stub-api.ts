import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http'
import { sportSchema, type Sport } from '@cro-sport-hub/shared-types'
import { of } from 'rxjs'
import { sportsPath } from './catalog-api'

export const stubSports: Sport[] = sportSchema.array().parse([
  { id: 'sport-tennis', slug: 'tennis', name: 'Tennis' },
  { id: 'sport-football', slug: 'football', name: 'Football' },
])

export const stubApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method === 'GET' && request.url === sportsPath) {
    return of(new HttpResponse({ status: 200, body: stubSports }))
  }

  return next(request)
}
