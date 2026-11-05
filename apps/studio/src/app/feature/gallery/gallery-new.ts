import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import type { EditorMatch } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { GalleryApi } from '../../core/gallery-api'
import { MatchesApi } from '../../core/matches-api'
import { GalleryShell } from './gallery-shell'

function publishedFootballMatches(items: readonly EditorMatch[]): EditorMatch[] {
  return items.filter((row) => row.sport === 'football' && row.status === 'published')
}

@Component({
  selector: 'app-gallery-new',
  imports: [GalleryShell],
  template: `
    <app-gallery-shell skipLabel="Skip to match picker" galleriesCurrent="page">
      <h2>New gallery</h2>
      <p>Pick published football matches. Each match becomes one slide.</p>
      @if (loadStatus() === 'loading') {
        <p role="status">Loading matches.</p>
      } @else if (loadStatus() === 'error') {
        <p role="alert">The match list could not be loaded.</p>
      } @else {
        <form (submit)="onCreate($event)">
          <fieldset>
            <legend>Published football matches</legend>
            <ul>
              @for (row of rows(); track row.id) {
                <li>
                  <label>
                    <input
                      type="checkbox"
                      [checked]="selected().includes(row.id)"
                      (change)="onToggle(row.id, $event)"
                    />
                    {{ row.label }} ({{ row.date }})
                  </label>
                </li>
              } @empty {
                <li>No published football matches.</li>
              }
            </ul>
          </fieldset>
          @if (createStatus() === 'error') {
            <p role="alert">The gallery could not be created.</p>
          }
          <button type="submit" [disabled]="selected().length === 0 || createStatus() === 'saving'">
            Create gallery
          </button>
        </form>
      }
    </app-gallery-shell>
  `,
})
export class GalleryNewPage {
  private readonly matches = inject(MatchesApi)
  private readonly galleries = inject(GalleryApi)
  private readonly router = inject(Router)
  private pending: Subscription | undefined

  protected readonly rows = signal<EditorMatch[]>([])
  protected readonly selected = signal<string[]>([])
  protected readonly loadStatus = signal<'loading' | 'ready' | 'error'>('loading')
  protected readonly createStatus = signal<'idle' | 'saving' | 'error'>('idle')

  constructor() {
    this.pending = this.matches
      .editorMatches({ sport: 'football', status: 'published' })
      .subscribe({
        next: (page) => {
          this.rows.set(publishedFootballMatches(page.items))
          this.loadStatus.set('ready')
        },
        error: () => {
          this.rows.set([])
          this.loadStatus.set('error')
        },
      })
  }

  protected onToggle(id: string, event: Event): void {
    const target = event.target
    const checked = target instanceof HTMLInputElement ? target.checked : false
    const current = this.selected()
    this.selected.set(checked ? [...current, id] : current.filter((rowId) => rowId !== id))
  }

  protected onCreate(event: Event): void {
    event.preventDefault()
    if (this.selected().length === 0 || this.createStatus() === 'saving') return
    this.createStatus.set('saving')
    this.pending?.unsubscribe()
    this.pending = this.galleries.createGallery(this.selected()).subscribe({
      next: ({ id }) => void this.router.navigate(['/galleries', id]),
      error: () => this.createStatus.set('error'),
    })
  }
}
