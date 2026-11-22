import { HttpErrorResponse } from '@angular/common/http'
import { Component, inject, OnDestroy, signal } from '@angular/core'
import { forkJoin, type Subscription } from 'rxjs'
import { httpErrorBodyMessage } from '../../core/admin-form-messages'
import { t, type MessageKey } from '../../core/messages'
import { SettingsApi, type ConnectedAccount, type PublishSlotClock } from '../../core/settings-api'
import { StudioSectionHeader } from '../../core/studio-section-header'

type LoadStatus = 'loading' | 'ready' | 'error'
const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const NETWORK_KEYS = {
  instagram: 'postavke.network.instagram',
  facebook: 'postavke.network.facebook',
  x: 'postavke.network.x',
} as const satisfies Record<ConnectedAccount['network'], MessageKey>

@Component({
  selector: 'app-postavke',
  imports: [StudioSectionHeader],
  templateUrl: './postavke.html',
})
export class PostavkePage implements OnDestroy {
  private readonly api = inject(SettingsApi)
  private pending: Subscription | undefined
  protected readonly copy = {
    skip: t('postavke.skip'),
    title: t('postavke.title'),
    clocksHeading: t('postavke.clocks-heading'),
    clockLabel: t('postavke.clock-label'),
    clockTime: t('postavke.clock-time'),
    clockActive: t('postavke.clock-active'),
    save: t('postavke.save'),
    accountsHeading: t('postavke.accounts-heading'),
    accountsLead: t('postavke.accounts-lead'),
    loading: t('postavke.loading'),
    loadError: t('postavke.load-error'),
    loginChecked: t('postavke.login-checked'),
    loginUnchecked: t('postavke.login-unchecked'),
  }
  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly clocks = signal<PublishSlotClock[]>([])
  protected readonly accounts = signal<ConnectedAccount[]>([])
  protected readonly fieldErrors = signal<Record<string, string>>({})
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly saveSuccess = signal<string | undefined>(undefined)
  protected readonly savePending = signal(false)

  constructor() {
    this.reload()
  }

  ngOnDestroy(): void {
    this.pending?.unsubscribe()
  }

  protected networkLabel(network: ConnectedAccount['network']): string {
    return t(NETWORK_KEYS[network])
  }

  protected clockTimeError(id: string): string | undefined {
    return this.fieldErrors()[id]
  }

  protected onClockTime(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.clocks.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, clockTime: value } : row)),
    )
    this.saveSuccess.set(undefined)
  }

  protected onClockActive(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    this.clocks.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, active: checked } : row)),
    )
    this.saveSuccess.set(undefined)
  }

  protected onSave(event: Event): void {
    event.preventDefault()
    this.saveError.set(undefined)
    this.saveSuccess.set(undefined)
    const errors: Record<string, string> = {}
    for (const clock of this.clocks()) {
      if (!CLOCK_TIME_PATTERN.test(clock.clockTime))
        errors[clock.id] = t('postavke.clock-time-invalid')
    }
    this.fieldErrors.set(errors)
    const firstId = Object.keys(errors)[0]
    if (firstId !== undefined) {
      queueMicrotask(() => globalThis.document.getElementById(`clock-time-${firstId}`)?.focus())
      return
    }
    if (this.savePending()) return
    this.savePending.set(true)
    this.pending?.unsubscribe()
    this.pending = this.api.updatePublishSlotClocks({ clocks: this.clocks() }).subscribe({
      next: (rows) => {
        this.savePending.set(false)
        this.clocks.set(rows)
        this.saveSuccess.set(t('postavke.save-success'))
      },
      error: (error: unknown) => {
        this.savePending.set(false)
        this.saveError.set(
          error instanceof HttpErrorResponse && error.status === 400
            ? httpErrorBodyMessage(error, t('postavke.save-error'))
            : t('postavke.save-error'),
        )
      },
    })
  }

  private reload(): void {
    this.loadStatus.set('loading')
    this.pending?.unsubscribe()
    this.pending = forkJoin({
      clocks: this.api.listPublishSlotClocks(),
      accounts: this.api.listConnectedAccounts(),
    }).subscribe({
      next: ({ clocks, accounts }) => {
        this.clocks.set(clocks)
        this.accounts.set(accounts)
        this.loadStatus.set('ready')
      },
      error: () => this.loadStatus.set('error'),
    })
  }
}
