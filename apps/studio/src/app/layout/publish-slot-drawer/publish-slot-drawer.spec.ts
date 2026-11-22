import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import {
  publishSlotApprovePath,
  publishSlotPath,
  samplePublishSlot,
  type PublishSlot,
} from '../../core/publish-slots-api'
import { sampleSlidePreviews, slidePreviewsPath } from '../../core/slide-preview-api'
import { PublishSlotDrawer } from './publish-slot-drawer'

@Component({
  imports: [PublishSlotDrawer],
  template: `
    <p>Host page</p>
    <csh-publish-slot-drawer
      [open]="open()"
      [slot]="slot()"
      (closed)="open.set(false)"
      (approved)="lastApproved = $event"
    />
  `,
})
class Host {
  readonly open = signal(false)
  readonly slot = signal<PublishSlot | null>(samplePublishSlot)
  lastApproved: PublishSlot | null = null
}

describe('PublishSlotDrawer', () => {
  let http: HttpTestingController
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })
  afterEach(() => http.verify())

  it('opens with previews, patches order/text, approves', async () => {
    const fixture = TestBed.createComponent(Host)
    const router = TestBed.inject(Router)
    const before = router.url
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('.csh-drawer')).toBeNull()
    fixture.componentInstance.open.set(true)
    fixture.detectChanges()
    await fixture.whenStable()
    http.expectOne(slidePreviewsPath(samplePublishSlot.id)).flush(sampleSlidePreviews)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(router.url).toBe(before)
    expect(root.querySelector('.csh-drawer')?.getAttribute('role')).toBe('dialog')
    expect(root.querySelectorAll('iframe').length).toBe(2)

    const ig = root.querySelector('#publish-network-instagram')
    if (!(ig instanceof HTMLInputElement)) throw new Error('missing IG')
    ig.value = 'IG copy'
    ig.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    ;(root.querySelector('button[aria-label="Pomakni dolje"]') as HTMLButtonElement).click()
    fixture.detectChanges()
    const approve = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Odobri i objavi'),
    )
    if (!(approve instanceof HTMLButtonElement)) throw new Error('missing approve')
    approve.click()
    fixture.detectChanges()

    const patchReq = http.expectOne(publishSlotPath(samplePublishSlot.id))
    expect(patchReq.request.body).toMatchObject({
      slideOrder: ['appearance-sample-football', 'appearance-sample-tennis'],
      networkPosts: expect.arrayContaining([
        expect.objectContaining({ network: 'instagram', bodyText: 'IG copy' }),
      ]),
    })
    const patched = {
      ...samplePublishSlot,
      slideOrder: ['appearance-sample-football', 'appearance-sample-tennis'],
    }
    patchReq.flush(patched)
    await fixture.whenStable()
    const approved = { ...patched, status: 'approved' as const }
    http.expectOne(publishSlotApprovePath(samplePublishSlot.id)).flush(approved)
    await fixture.whenStable()
    http.expectOne(slidePreviewsPath(samplePublishSlot.id)).flush(sampleSlidePreviews)
    await fixture.whenStable()
    expect(fixture.componentInstance.lastApproved).toEqual(approved)

    ;(root.querySelector('button[aria-label="Close drawer"]') as HTMLButtonElement).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.open()).toBe(false)
  })
})
