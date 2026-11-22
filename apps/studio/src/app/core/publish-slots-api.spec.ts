import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { expect } from 'vite-plus/test'
import {
  PublishSlotsApi,
  publishSlotApprovePath,
  publishSlotPath,
  publishSlotsNextPath,
  publishSlotsPath,
  samplePublishSlot,
} from './publish-slots-api'

describe('PublishSlotsApi', () => {
  let api: PublishSlotsApi
  let http: HttpTestingController
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    api = TestBed.inject(PublishSlotsApi)
    http = TestBed.inject(HttpTestingController)
  })
  afterEach(() => http.verify())

  it('lists, next, patch, approve; rejects bad list', async () => {
    const listed = firstValueFrom(api.listForDay('2026-11-22'))
    http.expectOne(`${publishSlotsPath}?day=2026-11-22`).flush([samplePublishSlot])
    await expect(listed).resolves.toEqual([samplePublishSlot])

    const next = firstValueFrom(api.next())
    http.expectOne(publishSlotsNextPath).flush(samplePublishSlot)
    await expect(next).resolves.toEqual(samplePublishSlot)

    const body = {
      slideOrder: ['appearance-sample-football'],
      networkPosts: [{ network: 'instagram' as const, bodyText: 'IG copy' }],
    }
    const patchedSlot = { ...samplePublishSlot, slideOrder: body.slideOrder }
    const patched = firstValueFrom(api.patch(samplePublishSlot.id, body))
    const req = http.expectOne(publishSlotPath(samplePublishSlot.id))
    expect(req.request.method).toBe('PATCH')
    req.flush(patchedSlot)
    await expect(patched).resolves.toEqual(patchedSlot)

    const approved = firstValueFrom(api.approve(samplePublishSlot.id))
    http.expectOne(publishSlotApprovePath(samplePublishSlot.id)).flush({
      ...patchedSlot,
      status: 'approved',
    })
    await expect(approved).resolves.toMatchObject({ status: 'approved' })

    const bad = firstValueFrom(api.listForDay('2026-11-22'))
    http.expectOne(`${publishSlotsPath}?day=2026-11-22`).flush([{ id: 'bad' }])
    await expect(bad).rejects.toThrow(/Invalid publish slot/)
  })
})
