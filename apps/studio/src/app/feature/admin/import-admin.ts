import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import type { Subscription } from 'rxjs'
import { ImportAdminApi, type ImportRun } from '../../core/import-admin-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { formatImportLogIsoForDisplay } from './import-admin-format'

type LoadStatus = 'loading' | 'ready' | 'error'

@Component({
  selector: 'app-import-admin',
  imports: [RouterLink, StudioSectionHeader],
  templateUrl: './import-admin.html',
})
export class ImportAdminPage {
  private readonly api = inject(ImportAdminApi)
  private listPending: Subscription | undefined
  private runRequest: Subscription | undefined

  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly rows = signal<ImportRun[]>([])
  protected readonly runError = signal<string | undefined>(undefined)
  protected readonly runBusy = signal(false)

  constructor() {
    this.reload()
  }

  protected importLogDisplayTime(iso: string): string {
    return formatImportLogIsoForDisplay(iso)
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
