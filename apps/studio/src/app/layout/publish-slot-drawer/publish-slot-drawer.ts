import { Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser'
import type { Network } from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { t } from '../../core/messages'
import { PublishSlotsApi, type PublishSlot } from '../../core/publish-slots-api'
import { SlidePreviewApi } from '../../core/slide-preview-api'
import { CshUiButton } from '../ui-kit/button'
import { CshUiDrawer } from '../ui-kit/drawer'
import type { KitStatus } from '../ui-kit/kit-variants'
import { CshUiStatusPill } from '../ui-kit/status-pill'
import { CshUiTextField } from '../ui-kit/text-field'

const LABELS: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
}

type PreviewFrame = { objectUrl: string; safeUrl: SafeResourceUrl }

function pill(status: PublishSlot['status']): KitStatus {
  if (status === 'published' || status === 'approved') return 'published'
  return status === 'ready_for_review' ? 'review' : 'draft'
}

@Component({
  selector: 'csh-publish-slot-drawer',
  imports: [CshUiDrawer, CshUiButton, CshUiStatusPill, CshUiTextField],
  templateUrl: './publish-slot-drawer.html',
  styles: `
    .csh-slide-preview {
      width: 180px;
      height: 225px;
      overflow: hidden;
      background: #0e1431;
    }
    .csh-slide-preview iframe {
      width: 1080px;
      height: 1350px;
      border: 0;
      transform: scale(0.1666667);
      transform-origin: top left;
    }
  `,
})
export class PublishSlotDrawer {
  private readonly api = inject(PublishSlotsApi)
  private readonly previews = inject(SlidePreviewApi)
  private readonly sanitizer = inject(DomSanitizer)
  readonly open = input(false)
  readonly slot = input<PublishSlot | null>(null)
  readonly closed = output<void>()
  readonly approved = output<PublishSlot>()
  protected readonly networks = ['instagram', 'facebook', 'x'] as const
  protected readonly labels = LABELS
  protected readonly title = t('publish-drawer.title')
  protected readonly approveLabel = t('publish-drawer.approve')
  protected readonly slideOrderLabel = t('publish-drawer.slide-order')
  protected readonly slidePreviewLabel = t('publish-drawer.slide-preview')
  protected readonly working = signal<PublishSlot | null>(null)
  protected readonly busy = signal(false)
  protected readonly error = signal<string | null>(null)
  protected readonly previewError = signal<string | null>(null)
  protected readonly frames = signal<ReadonlyMap<string, PreviewFrame>>(new Map())
  protected readonly texts = signal<Record<Network, string>>({
    instagram: '',
    facebook: '',
    x: '',
  })
  protected readonly statusPill = computed(() => {
    const s = this.working()
    return s ? pill(s.status) : null
  })
  protected readonly summary = computed(() => {
    const s = this.working()
    return s && { date: s.slotDate, clock: s.clockTime, status: s.status, n: s.slideOrder.length }
  })
  constructor() {
    effect(() => {
      const slot = this.slot()
      if (this.open() && slot !== null) this.apply(slot)
    })
  }
  protected onClosed(): void {
    this.revokeFrames()
    this.closed.emit()
  }
  protected onText(network: Network, value: string): void {
    this.texts.update((cur) => ({ ...cur, [network]: value }))
  }
  protected moveSlide(index: number, delta: -1 | 1): void {
    const cur = this.working()
    if (!cur) return
    const next = index + delta
    if (next < 0 || next >= cur.slideOrder.length) return
    const order = [...cur.slideOrder]
    const [item] = order.splice(index, 1)
    if (!item) return
    order.splice(next, 0, item)
    this.working.set({ ...cur, slideOrder: order })
  }
  protected frameUrl(appearanceId: string): SafeResourceUrl | null {
    return this.frames().get(appearanceId)?.safeUrl ?? null
  }
  protected async approve(): Promise<void> {
    const cur = this.working()
    if (!cur || this.busy()) return
    this.busy.set(true)
    this.error.set(null)
    try {
      const texts = this.texts()
      const after = await firstValueFrom(
        this.api.patch(cur.id, {
          slideOrder: cur.slideOrder,
          networkPosts: this.networks.map((network) => ({ network, bodyText: texts[network] })),
        }),
      )
      const updated = await firstValueFrom(this.api.approve(after.id))
      this.apply(updated)
      this.approved.emit(updated)
    } catch {
      this.error.set(t('publish-drawer.error-approve'))
    } finally {
      this.busy.set(false)
    }
  }
  private apply(slot: PublishSlot): void {
    this.working.set(slot)
    const texts: Record<Network, string> = { instagram: '', facebook: '', x: '' }
    for (const post of slot.networkPosts) texts[post.network] = post.bodyText
    this.texts.set(texts)
    void this.loadPreviews(slot.id)
  }
  private async loadPreviews(slotId: string): Promise<void> {
    this.previewError.set(null)
    try {
      const response = await firstValueFrom(this.previews.forSlot(slotId))
      this.revokeFrames()
      const next = new Map<string, PreviewFrame>()
      for (const slide of response.slides) {
        const objectUrl = URL.createObjectURL(new Blob([slide.html], { type: 'text/html' }))
        next.set(slide.appearanceId, {
          objectUrl,
          safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl),
        })
      }
      this.frames.set(next)
    } catch {
      this.revokeFrames()
      this.previewError.set(t('publish-drawer.error-preview'))
    }
  }
  private revokeFrames(): void {
    for (const frame of this.frames().values()) URL.revokeObjectURL(frame.objectUrl)
    this.frames.set(new Map())
  }
}
