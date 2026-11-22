import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { t } from '../../core/messages'
import { samplePublishSlot } from '../../core/publish-slots-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { PublishSlotDrawer } from '../../layout/publish-slot-drawer/publish-slot-drawer'
import { CshUiButton } from '../../layout/ui-kit/button'
import { CshUiFilterBar } from '../../layout/ui-kit/filter-bar'
import type { KitStatus, KitTone } from '../../layout/ui-kit/kit-variants'
import { editorialDayLabel, shiftEditorialDay, startOfLocalDay } from '../editorial-day'

@Component({
  selector: 'app-pocetna',
  imports: [StudioSectionHeader, CshUiFilterBar, CshUiButton, PublishSlotDrawer],
  templateUrl: './pocetna.html',
})
export class PocetnaPage {
  private readonly route = inject(ActivatedRoute)

  protected readonly title = t('pocetna.title')
  protected readonly lead = t('pocetna.lead')
  protected readonly adminOnly = t('pocetna.admin-only')
  protected readonly previewLabel = t('publish-drawer.preview')
  protected readonly harnessSlot = samplePublishSlot
  protected readonly drawerOpen = signal(false)

  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('admin') === '1')),
    { initialValue: false },
  )

  protected readonly day = signal(startOfLocalDay())
  protected readonly dayLabel = computed(() => editorialDayLabel(this.day()))
  protected readonly sport: KitTone = 'tennis'
  protected readonly athlete = 'Svi sportaši'
  protected readonly status: KitStatus = 'draft'

  protected onPreviousDay(): void {
    this.day.update((current) => shiftEditorialDay(current, -1))
  }

  protected onNextDay(): void {
    this.day.update((current) => shiftEditorialDay(current, 1))
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true)
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false)
  }
}
