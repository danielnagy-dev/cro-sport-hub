import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { Subscription } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { ImportAdminApi, type ImportRun } from '../../core/import-admin-api'

type LoadStatus = 'loading' | 'ready' | 'error'

@Component({
  selector: 'app-import-admin',
  imports: [RouterLink],
  templateUrl: './import-admin.html',
})
export class ImportAdminPage {
  private readonly api = inject(ImportAdminApi)
  private listPending: Subscription | undefined
  private runRequest: Subscription | undefined

  protected readonly auth = inject(AuthStore)
  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly rows = signal<ImportRun[]>([])
  protected readonly runError = signal<string | undefined>(undefined)
  protected readonly runBusy = signal(false)

  constructor() {
    this.reload()
  }

  protected logOut(): void {
    this.auth.logOut()
  }

  protected onRunNow(): void {
    if (this.runBusy()) return
    this.runError.set(undefined)
    this.runBusy.set(true)
    this.runRequest?.unsubscribe()
    this.runRequest = this.api.runNow().subscribe({
      next: () => {
        this.runBusy.set(false)
        this.reload()
      },
      error: () => {
        this.runBusy.set(false)
        this.runError.set('The import could not be started.')
      },
    })
  }

  private reload(): void {
    this.listPending?.unsubscribe()
    this.loadStatus.set('loading')
    this.listPending = this.api.listRuns().subscribe({
      next: (items) => {
        this.rows.set(items)
        this.loadStatus.set('ready')
      },
      error: () => {
        this.rows.set([])
        this.loadStatus.set('error')
      },
    })
  }
}
