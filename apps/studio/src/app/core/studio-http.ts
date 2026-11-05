import { HttpClient, type HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, type Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class StudioHttp {
  private readonly http = inject(HttpClient)

  get<T>(url: string, parse: (body: unknown) => T, params?: HttpParams): Observable<T> {
    const request = params === undefined ? this.http.get(url) : this.http.get(url, { params })
    return request.pipe(map((body) => parse(body)))
  }

  post<T>(url: string, body: unknown, parse: (response: unknown) => T): Observable<T> {
    return this.http.post(url, body).pipe(map((response) => parse(response)))
  }

  put<T>(url: string, body: unknown, parse: (response: unknown) => T): Observable<T> {
    return this.http.put(url, body).pipe(map((response) => parse(response)))
  }

  patch<T>(url: string, body: unknown, parse: (response: unknown) => T): Observable<T> {
    return this.http.patch(url, body).pipe(map((response) => parse(response)))
  }

  delete(url: string): Observable<void> {
    return this.http.delete(url).pipe(map(() => undefined))
  }

  getBlob(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' })
  }
}
