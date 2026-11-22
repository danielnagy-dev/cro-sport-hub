import { HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import {
  creatorKindSchema,
  idSchema,
  isoDateSchema,
  networkPostStatusSchema,
  networkSchema,
  publishSlotStatusSchema,
  timestampSchema,
  type CreatorKind,
  type Network,
  type NetworkPostStatus,
  type PublishSlotStatus,
} from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const publishSlotsPath = '/api/editor/publish-slots'
export const publishSlotsNextPath = `${publishSlotsPath}/next`
export const publishSlotPath = (id: string) => `${publishSlotsPath}/${id}`
export const publishSlotApprovePath = (id: string) => `${publishSlotPath(id)}/approve`
export type NetworkPost = {
  id: string
  publishSlotId: string
  network: Network
  bodyText: string
  status: NetworkPostStatus
  externalPostId: string | null
}
export type PublishSlot = {
  id: string
  slotDate: string
  slotClockId: string
  clockTime: string
  status: PublishSlotStatus
  slideOrder: string[]
  creatorKind: CreatorKind
  createdAt: string
  updatedAt: string
  networkPosts: NetworkPost[]
}
export type PatchPublishSlotBody = {
  slideOrder?: string[]
  networkPosts?: {
    network: Network
    bodyText?: string
    status?: NetworkPostStatus
    externalPostId?: string | null
  }[]
}

const rec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
function parsePost(value: unknown): NetworkPost {
  if (!rec(value) || typeof value['bodyText'] !== 'string') throw new Error('Invalid network post')
  const external = value['externalPostId']
  if (!(external === null || typeof external === 'string')) throw new Error('Invalid network post')
  return {
    id: idSchema.parse(value['id']),
    publishSlotId: idSchema.parse(value['publishSlotId']),
    network: networkSchema.parse(value['network']),
    bodyText: value['bodyText'],
    status: networkPostStatusSchema.parse(value['status']),
    externalPostId: external,
  }
}

export function parsePublishSlot(value: unknown): PublishSlot {
  if (
    !rec(value) ||
    typeof value['clockTime'] !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value['clockTime']) ||
    !Array.isArray(value['slideOrder']) ||
    !Array.isArray(value['networkPosts'])
  ) {
    throw new Error('Invalid publish slot')
  }
  return {
    id: idSchema.parse(value['id']),
    slotDate: isoDateSchema.parse(value['slotDate']),
    slotClockId: idSchema.parse(value['slotClockId']),
    clockTime: value['clockTime'],
    status: publishSlotStatusSchema.parse(value['status']),
    slideOrder: value['slideOrder'].map((id) => idSchema.parse(id)),
    creatorKind: creatorKindSchema.parse(value['creatorKind']),
    createdAt: timestampSchema.parse(value['createdAt']),
    updatedAt: timestampSchema.parse(value['updatedAt']),
    networkPosts: value['networkPosts'].map(parsePost),
  }
}

export const samplePublishSlot: PublishSlot = parsePublishSlot({
  id: 'publish-slot-sample-1530',
  slotDate: '2026-11-22',
  slotClockId: 'slot-clock-1530',
  clockTime: '15:30',
  status: 'ready_for_review',
  slideOrder: ['appearance-sample-tennis', 'appearance-sample-football'],
  creatorKind: 'manual',
  createdAt: '2026-11-22T12:00:00.000Z',
  updatedAt: '2026-11-22T12:00:00.000Z',
  networkPosts: (['instagram', 'facebook', 'x'] as const).map((network) => ({
    id: `np-publish-slot-sample-1530-${network}`,
    publishSlotId: 'publish-slot-sample-1530',
    network,
    bodyText: `${network} draft`,
    status: 'ready_for_review',
    externalPostId: null,
  })),
})

@Injectable({ providedIn: 'root' })
export class PublishSlotsApi {
  private readonly http = inject(StudioHttp)

  listForDay(day: string): Observable<PublishSlot[]> {
    const parse = (body: unknown) => {
      if (!Array.isArray(body)) throw new Error('Invalid publish slot list')
      return body.map(parsePublishSlot)
    }
    return this.http.get(publishSlotsPath, parse, new HttpParams().set('day', day))
  }

  next(): Observable<PublishSlot> {
    return this.http.get(publishSlotsNextPath, parsePublishSlot)
  }

  patch(id: string, body: PatchPublishSlotBody): Observable<PublishSlot> {
    return this.http.patch(publishSlotPath(id), body, parsePublishSlot)
  }

  approve(id: string): Observable<PublishSlot> {
    return this.http.post(publishSlotApprovePath(id), null, parsePublishSlot)
  }
}
