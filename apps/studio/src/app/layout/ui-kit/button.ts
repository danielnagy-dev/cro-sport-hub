import { Component, input } from '@angular/core'
import type { KitSize, KitTone, KitVariant } from './kit-variants'

@Component({
  selector: 'button[cshUiButton]',
  template: `<ng-content />`,
  host: {
    class: 'csh-button csh-kit',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class CshUiButton {
  readonly tone = input<KitTone>('neutral')
  readonly size = input<KitSize>('md')
  readonly variant = input<KitVariant>('solid')
}
