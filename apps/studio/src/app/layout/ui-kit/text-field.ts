import { Component, input, model } from '@angular/core'
import type { KitSize } from './kit-variants'

@Component({
  selector: 'csh-ui-text-field',
  template: `
    <label class="csh-text-field" [attr.data-size]="size()" [attr.for]="fieldId()">
      <span class="csh-text-field__label">{{ label() }}</span>
      <input
        class="csh-text-field__input"
        [id]="fieldId()"
        [type]="type()"
        [name]="name()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
      />
    </label>
  `,
})
export class CshUiTextField {
  readonly label = input.required<string>()
  readonly size = input<KitSize>('md')
  readonly fieldId = input('csh-text-field')
  readonly type = input('text')
  readonly name = input('')
  readonly placeholder = input('')
  readonly disabled = input(false)
  readonly value = model('')

  protected onInput(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      this.value.set(target.value)
    }
  }
}
