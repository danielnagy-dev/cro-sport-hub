import { Component, inject, OnDestroy, signal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import type { GalleryView } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { StudioApi } from '../../core/studio-api'
import { GalleryShell } from './gallery-shell'

function captionsFromGallery(gallery: GalleryView): Record<number, string> {
  const captions: Record<number, string> = {}
  for (const slide of gallery.slides) captions[slide.index] = slide.caption
  return captions
}

@Component({
  selector: 'app-gallery',
  imports: [GalleryShell],
  template: `
    <app-gallery-shell skipLabel="Skip to gallery">
      @if (loadStatus() === 'loading') {
        <p role="status">Loading gallery.</p>
      } @else if (loadStatus() === 'not-found') {
        <p role="alert">Unknown gallery.</p>
      } @else if (loadStatus() === 'error') {
        <p role="alert">The gallery could not be loaded.</p>
      } @else if (gallery(); as gallery) {
        <h2>Gallery {{ gallery.id }}</h2>
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
  private readonly api = inject(StudioApi)
  private readonly route = inject(ActivatedRoute)
  private pending: Subscription | undefined
  private readonly galleryId = this.route.snapshot.paramMap.get('id') ?? ''

  protected readonly gallery = signal<GalleryView | null>(null)
  protected readonly captions = signal<Record<number, string>>({})
  protected readonly previewUrls = signal<Record<number, string>>({})
  protected readonly loadStatus = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading')
  protected readonly saveErrorIndex = signal<number | null>(null)
  protected readonly previewErrorIndex = signal<number | null>(null)

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

  private revokePreview(index: number): void {
    const url = this.previewUrls()[index]
    if (url !== undefined) URL.revokeObjectURL(url)
  }
}
