import { Component, input } from '@angular/core'
import type { KitSize, KitStatus } from './kit-variants'

@Component({
  selector: 'csh-ui-status-pill',
  template: `<ng-content />`,
  host: {
    class: 'csh-status-pill csh-kit',
    '[attr.data-status]': 'status()',
    '[attr.data-size]': 'size()',
  },
})
export class CshUiStatusPill {
  readonly status = input.required<KitStatus>()
  readonly size = input<KitSize>('sm')
}
