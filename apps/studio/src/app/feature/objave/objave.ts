import { Component, computed, signal } from '@angular/core'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { CshUiFilterBar } from '../../layout/ui-kit/filter-bar'
import type { KitStatus, KitTone } from '../../layout/ui-kit/kit-variants'
import { editorialDayLabel, shiftEditorialDay, startOfLocalDay } from '../editorial-day'

@Component({
  selector: 'app-objave',
  imports: [StudioSectionHeader, CshUiFilterBar],
  templateUrl: './objave.html',
})
export class ObjavePage {
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
}
