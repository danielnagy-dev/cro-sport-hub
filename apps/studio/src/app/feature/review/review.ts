import { Component, computed, inject, signal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, RouterLink } from '@angular/router'
import type { Status } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { ReviewApi, type ReviewMatchDetail } from '../../core/review-api'

type LoadStatus = 'loading' | 'ready' | 'not-found' | 'error'

function readConflictMessage(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (typeof message === 'string') return message
  }
  return fallback
}

@Component({
  selector: 'app-review',
  imports: [RouterLink],
  templateUrl: './review.html',
})
export class ReviewPage {
  private readonly api = inject(ReviewApi)
  private readonly route = inject(ActivatedRoute)
  private pending: Subscription | undefined
  private readonly matchId = this.route.snapshot.paramMap.get('id') ?? ''

  protected readonly auth = inject(AuthStore)
  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly detail = signal<ReviewMatchDetail | null>(null)
  protected readonly status = signal<Status | undefined>(undefined)
  protected readonly actionError = signal<string | undefined>(undefined)
  protected readonly actionPending = signal(false)

  protected readonly showAdminActions = computed(() => {
    const session = this.auth.session()
    return session?.role === 'admin' && this.status() === 'review'
  })

  constructor() {
    if (this.matchId.length === 0) {
      this.loadStatus.set('not-found')
      return
    }
    this.pending = this.api.loadMatchForReview(this.matchId).subscribe({
      next: (row) => {
        this.detail.set(row)
        this.status.set(row.summary.status)
        this.loadStatus.set('ready')
      },
      error: (error: unknown) => {
        this.loadStatus.set(
          error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error',
        )
      },
    })
  }

  protected logOut(): void {
    this.auth.logOut()
  }

  protected onReject(): void {
    if (!this.showAdminActions() || this.actionPending()) return
    this.actionError.set(undefined)
    this.actionPending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.rejectMatch(this.matchId).subscribe({
      next: (saved) => {
        this.status.set(saved.status)
        this.detail.update((current) =>
          current === null
            ? current
            : { ...current, summary: { ...current.summary, status: saved.status } },
        )
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
    this.pending = this.api.publishMatch(this.matchId).subscribe({
      next: (saved) => {
        this.status.set(saved.status)
        this.detail.update((current) =>
          current === null
            ? current
            : { ...current, summary: { ...current.summary, status: saved.status } },
        )
        this.actionPending.set(false)
      },
      error: (error: unknown) => this.onActionError(error, 'publish'),
    })
  }

  private onActionError(error: unknown, kind: 'reject' | 'publish'): void {
    this.actionPending.set(false)
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const fallback =
        kind === 'publish'
          ? 'Only a match in review can be published'
          : 'Only a match in review can be rejected'
      this.actionError.set(readConflictMessage(error, fallback))
      return
    }
    this.actionError.set(
      kind === 'publish' ? 'The match could not be published.' : 'The match could not be rejected.',
    )
  }
}
