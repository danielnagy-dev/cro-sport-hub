import { Component, input, output } from '@angular/core'
import { CshUiButton } from './button'
import type { KitStatus, KitTone } from './kit-variants'
import { CshUiStatusPill } from './status-pill'

@Component({
  selector: 'csh-ui-filter-bar',
  imports: [CshUiButton, CshUiStatusPill],
  template: `
    <div class="csh-filter-bar" role="group" aria-label="Filters">
      <div class="csh-filter-bar__day">
        <button
          cshUiButton
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous day"
          (click)="previousDay.emit()"
        >
          ‹
        </button>
        <span class="csh-filter-bar__day-label">{{ dayLabel() }}</span>
        <button
          cshUiButton
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next day"
          (click)="nextDay.emit()"
        >
          ›
        </button>
      </div>
      <span class="csh-kit" [attr.data-tone]="sport()" data-size="sm">{{ sport() }}</span>
      <span class="csh-filter-bar__athlete">{{ athlete() }}</span>
      <csh-ui-status-pill [status]="status()">{{ status() }}</csh-ui-status-pill>
    </div>
  `,
})
export class CshUiFilterBar {
  readonly dayLabel = input.required<string>()
  readonly sport = input<KitTone>('neutral')
  readonly athlete = input('All athletes')
  readonly status = input<KitStatus>('draft')
  readonly previousDay = output<void>()
  readonly nextDay = output<void>()
}
