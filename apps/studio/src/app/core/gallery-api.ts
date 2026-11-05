import { inject, Injectable } from '@angular/core'
import {
  galleryCreatedSchema,
  galleryRenderResponseSchema,
  galleryViewSchema,
  type GalleryView,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const galleriesPath = '/api/galleries'

export function galleryPath(id: string): string {
  return `${galleriesPath}/${id}`
}

export function gallerySlidePath(id: string, index: number): string {
  return `${galleriesPath}/${id}/slides/${index}`
}

@Injectable({ providedIn: 'root' })
export class GalleryApi {
  private readonly http = inject(StudioHttp)

  createGallery(matchIds: string[]): Observable<{ id: string; slideIndexes: number[] }> {
    return this.http.post(galleriesPath, { matchIds }, (body) => galleryCreatedSchema.parse(body))
  }

  readGallery(id: string): Observable<GalleryView> {
    return this.http.get(galleryPath(id), (body) => galleryViewSchema.parse(body))
  }

  patchGallerySlideCaption(id: string, index: number, caption: string): Observable<GalleryView> {
    return this.http.patch(gallerySlidePath(id, index), { caption }, (body) =>
      galleryViewSchema.parse(body),
    )
  }

  renderGallery(id: string): Observable<{ slideCount: number }> {
    return this.http.post(`${galleryPath(id)}/render`, null, (body) =>
      galleryRenderResponseSchema.parse(body),
    )
  }

  fetchGallerySlidePng(id: string, index: number): Observable<Blob> {
    return this.http.getBlob(`${gallerySlidePath(id, index)}.png`)
  }
}
