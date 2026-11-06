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

export function galleryRejectPath(id: string): string {
  return `${galleryPath(id)}/reject`
}

export function galleryPublishPath(id: string): string {
  return `${galleryPath(id)}/publish`
}

export function gallerySubmitPath(id: string): string {
  return `${galleryPath(id)}/submit`
}

export function galleryDownloadPath(id: string): string {
  return `${galleryPath(id)}/download`
}

export type GalleryRejected = { id: string; status: 'draft' }
export type GalleryPublished = { id: string; status: 'published' }
export type GallerySubmitted = { id: string; status: 'review' }

function parseGalleryRejected(body: unknown): GalleryRejected {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid reject response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'draft') {
    throw new Error('Invalid reject response')
  }
  return { id: row['id'], status: 'draft' }
}

function parseGalleryPublished(body: unknown): GalleryPublished {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid publish response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'published') {
    throw new Error('Invalid publish response')
  }
  return { id: row['id'], status: 'published' }
}

function parseGallerySubmitted(body: unknown): GallerySubmitted {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid submit response')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string' || row['status'] !== 'review') {
    throw new Error('Invalid submit response')
  }
  return { id: row['id'], status: 'review' }
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

  rejectGallery(id: string): Observable<GalleryRejected> {
    return this.http.post(galleryRejectPath(id), null, parseGalleryRejected)
  }

  publishGallery(id: string): Observable<GalleryPublished> {
    return this.http.post(galleryPublishPath(id), null, parseGalleryPublished)
  }

  submitGallery(id: string): Observable<GallerySubmitted> {
    return this.http.post(gallerySubmitPath(id), null, parseGallerySubmitted)
  }

  downloadGalleryZip(id: string): Observable<Blob> {
    return this.http.getBlob(galleryDownloadPath(id))
  }
}
