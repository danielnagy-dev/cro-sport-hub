import { Component, computed, inject, OnDestroy, signal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import type { GalleryView } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { GalleryApi } from '../../core/gallery-api'
import { GalleryShell } from './gallery-shell'

function captionsFromGallery(gallery: GalleryView): Record<number, string> {
  const captions: Record<number, string> = {}
  for (const slide of gallery.slides) captions[slide.index] = slide.caption
  return captions
}

function readConflictMessage(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (typeof message === 'string') return message
  }
  return fallback
}

@Component({
  selector: 'app-gallery',
  imports: [GalleryShell],
  template: `
    <app-gallery-shell skipLabel="Skip to gallery">
      @if (loadStatus() === 'loading') {
        <p role="status">Loading gallery.</p>
      } @else if (loadStatus() === 'not-found') {
        <p role="alert">Gallery not found</p>
      } @else if (loadStatus() === 'error') {
        <p role="alert">The gallery could not be loaded.</p>
      } @else if (gallery(); as gallery) {
        <h2>Gallery {{ gallery.id }}</h2>
        <p role="status">Status: {{ gallery.status }}</p>
        @if (showSubmitForReview()) {
          <div>
            <button type="button" [disabled]="actionPending()" (click)="onSubmitForReview()">
              Submit for review
            </button>
          </div>
        }
        @if (showAdminActions()) {
          <div>
            <button type="button" [disabled]="actionPending()" (click)="onReject()">Reject</button>
            <button type="button" [disabled]="actionPending()" (click)="onPublish()">
              Publish
            </button>
          </div>
        }
        @if (showDownload()) {
          <button type="button" [disabled]="downloadPending()" (click)="onDownload()">
            Download
          </button>
        }
        @if (actionError(); as message) {
          <p role="alert">{{ message }}</p>
        }
        @if (downloadError(); as message) {
          <p role="alert">{{ message }}</p>
        }
        @for (slide of gallery.slides; track slide.index) {
          <section>
            <h3>Slide {{ slide.index + 1 }}</h3>
            <label [for]="'caption-' + slide.index">Caption</label>
            <input
              [id]="'caption-' + slide.index"
              type="text"
              [value]="captionFor(slide.index)"
              (input)="setCaption(slide.index, readInput($event))"
            />
            <button type="button" (click)="saveCaption(slide.index)">Save caption</button>
            <button type="button" (click)="preview(slide.index)">Preview PNG</button>
            @if (saveErrorIndex() === slide.index) {
              <p role="alert">The caption could not be saved.</p>
            }
            @if (previewErrorIndex() === slide.index) {
              <p role="alert">The preview could not be loaded.</p>
            }
            @if (previewUrlFor(slide.index); as previewUrl) {
              <img [src]="previewUrl" alt="Rendered slide preview" />
            }
          </section>
        }
      }
    </app-gallery-shell>
  `,
})
export class GalleryPage implements OnDestroy {
  private readonly api = inject(GalleryApi)
  private readonly route = inject(ActivatedRoute)
  private pending: Subscription | undefined
  private readonly galleryId = this.route.snapshot.paramMap.get('id') ?? ''

  protected readonly auth = inject(AuthStore)
  protected readonly gallery = signal<GalleryView | null>(null)
  protected readonly captions = signal<Record<number, string>>({})
  protected readonly previewUrls = signal<Record<number, string>>({})
  protected readonly loadStatus = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading')
  protected readonly saveErrorIndex = signal<number | null>(null)
  protected readonly previewErrorIndex = signal<number | null>(null)
  protected readonly actionError = signal<string | undefined>(undefined)
  protected readonly downloadError = signal<string | undefined>(undefined)
  protected readonly actionPending = signal(false)
  protected readonly downloadPending = signal(false)

  protected readonly showAdminActions = computed(() => {
    const session = this.auth.session()
    return session?.role === 'admin' && this.gallery()?.status === 'review'
  })

  protected readonly showSubmitForReview = computed(() => this.gallery()?.status === 'draft')

  protected readonly showDownload = computed(() => this.gallery()?.status === 'published')

  constructor() {
    if (this.galleryId.length === 0) {
      this.loadStatus.set('not-found')
      return
    }
    this.pending = this.api.readGallery(this.galleryId).subscribe({
      next: (value) => {
        this.gallery.set(value)
        this.captions.set(captionsFromGallery(value))
        this.loadStatus.set('ready')
      },
      error: (error: unknown) => {
        this.loadStatus.set(
          error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error',
        )
      },
    })
  }

  ngOnDestroy(): void {
    this.pending?.unsubscribe()
    for (const index of Object.keys(this.previewUrls()).map(Number)) this.revokePreview(index)
  }

  protected captionFor(index: number): string {
    return this.captions()[index] ?? ''
  }

  protected setCaption(index: number, value: string): void {
    this.captions.set({ ...this.captions(), [index]: value })
  }

  protected readInput(event: Event): string {
    const target = event.target
    return target instanceof HTMLInputElement ? target.value : ''
  }

  protected saveCaption(index: number): void {
    this.saveErrorIndex.set(null)
    this.pending?.unsubscribe()
    this.pending = this.api
      .patchGallerySlideCaption(this.galleryId, index, this.captionFor(index))
      .subscribe({
        next: (value) => {
          this.gallery.set(value)
          this.captions.set(captionsFromGallery(value))
        },
        error: () => this.saveErrorIndex.set(index),
      })
  }

  protected preview(index: number): void {
    this.previewErrorIndex.set(null)
    this.pending?.unsubscribe()
    this.pending = this.api.renderGallery(this.galleryId).subscribe({
      next: () => {
        this.pending?.unsubscribe()
        this.pending = this.api.fetchGallerySlidePng(this.galleryId, index).subscribe({
          next: (blob) => {
            this.revokePreview(index)
            this.previewUrls.set({
              ...this.previewUrls(),
              [index]: URL.createObjectURL(blob),
            })
          },
          error: () => this.previewErrorIndex.set(index),
        })
      },
      error: () => this.previewErrorIndex.set(index),
    })
  }

  protected previewUrlFor(index: number): string | undefined {
    return this.previewUrls()[index]
  }

  protected onSubmitForReview(): void {
    if (!this.showSubmitForReview() || this.actionPending()) return
    this.actionError.set(undefined)
    this.actionPending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.submitGallery(this.galleryId).subscribe({
      next: (saved) => {
        this.patchGalleryStatus(saved.status)
        this.actionPending.set(false)
      },
      error: (error: unknown) => this.onActionError(error, 'submit'),
    })
  }

  protected onReject(): void {
    if (!this.showAdminActions() || this.actionPending()) return
    this.actionError.set(undefined)
    this.actionPending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.rejectGallery(this.galleryId).subscribe({
      next: (saved) => {
        this.patchGalleryStatus(saved.status)
        this.actionPending.set(false)
      },
      error: (error: unknown) => this.onActionError(error, 'reject'),
    })
  }

  protected onPublish(): void {
    if (!this.showAdminActions() || this.actionPending()) return
    this.actionError.set(undefined)
    this.actionPending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.publishGallery(this.galleryId).subscribe({
      next: (saved) => {
        this.patchGalleryStatus(saved.status)
        this.actionPending.set(false)
      },
      error: (error: unknown) => this.onActionError(error, 'publish'),
    })
  }

  protected onDownload(): void {
    if (!this.showDownload() || this.downloadPending()) return
    this.downloadError.set(undefined)
    this.downloadPending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.downloadGalleryZip(this.galleryId).subscribe({
      next: (blob) => {
        this.downloadPending.set(false)
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${this.galleryId}.zip`
        anchor.click()
        URL.revokeObjectURL(url)
      },
      error: () => {
        this.downloadPending.set(false)
        this.downloadError.set('The gallery could not be downloaded.')
      },
    })
  }

  private patchGalleryStatus(status: GalleryView['status']): void {
    const current = this.gallery()
    if (current === null) return
    this.gallery.set({ ...current, status })
  }

  private onActionError(error: unknown, kind: 'submit' | 'reject' | 'publish'): void {
    this.actionPending.set(false)
    if (error instanceof HttpErrorResponse && error.status === 409) {
      let fallback: string
      switch (kind) {
        case 'submit':
          fallback = 'Only a draft gallery can be submitted'
          break
        case 'publish':
          fallback = 'Only a gallery in review can be published'
          break
        case 'reject':
          fallback = 'Only a gallery in review can be rejected'
          break
        default: {
          const exhaustive: never = kind
          throw exhaustive
        }
      }
      this.actionError.set(readConflictMessage(error, fallback))
      return
    }
    let message: string
    switch (kind) {
      case 'submit':
        message = 'The gallery could not be submitted for review.'
        break
      case 'publish':
        message = 'The gallery could not be published.'
        break
      case 'reject':
        message = 'The gallery could not be rejected.'
        break
      default: {
        const exhaustive: never = kind
        throw exhaustive
      }
    }
    this.actionError.set(message)
  }

  private revokePreview(index: number): void {
    const url = this.previewUrls()[index]
    if (url !== undefined) URL.revokeObjectURL(url)
  }
}
