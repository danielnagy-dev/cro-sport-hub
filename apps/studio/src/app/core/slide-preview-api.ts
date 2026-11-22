import { inject, Injectable } from '@angular/core'
import { idSchema } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { samplePublishSlot } from './publish-slots-api'
import { StudioHttp } from './studio-http'

export const slidePreviewsPath = (publishSlotId: string) =>
  `/api/editor/publish-slots/${publishSlotId}/slide-previews`

export type SlidePreviewItem = {
  appearanceId: string
  sportSlug: 'football' | 'tennis' | 'basketball'
  html: string
  width: number
  height: number
}
export type SlidePreviewsResponse = { publishSlotId: string; slides: SlidePreviewItem[] }

const rec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function parseItem(value: unknown): SlidePreviewItem {
  if (
    !rec(value) ||
    typeof value['html'] !== 'string' ||
    !value['html'] ||
    (value['sportSlug'] !== 'football' &&
      value['sportSlug'] !== 'tennis' &&
      value['sportSlug'] !== 'basketball') ||
    typeof value['width'] !== 'number' ||
    typeof value['height'] !== 'number'
  ) {
    throw new Error('Invalid slide preview')
  }
  return {
    appearanceId: idSchema.parse(value['appearanceId']),
    sportSlug: value['sportSlug'],
    html: value['html'],
    width: value['width'],
    height: value['height'],
  }
}

export function parseSlidePreviews(value: unknown): SlidePreviewsResponse {
  if (!rec(value) || !Array.isArray(value['slides'])) throw new Error('Invalid slide previews')
  return {
    publishSlotId: idSchema.parse(value['publishSlotId']),
    slides: value['slides'].map(parseItem),
  }
}

export const sampleSlidePreviews = parseSlidePreviews({
  publishSlotId: samplePublishSlot.id,
  slides: samplePublishSlot.slideOrder.map((appearanceId, i) => ({
    appearanceId,
    sportSlug: i === 0 ? 'tennis' : 'football',
    html: `<html><body>${appearanceId}</body></html>`,
    width: 1080,
    height: 1350,
  })),
})

@Injectable({ providedIn: 'root' })
export class SlidePreviewApi {
  private readonly http = inject(StudioHttp)
  forSlot(id: string): Observable<SlidePreviewsResponse> {
    return this.http.get(slidePreviewsPath(id), parseSlidePreviews)
  }
}
