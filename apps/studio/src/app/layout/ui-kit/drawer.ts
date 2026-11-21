import { Component, input, output } from '@angular/core'
import { CshUiButton } from './button'

@Component({
  selector: 'csh-ui-drawer',
  imports: [CshUiButton],
  template: `
    @if (open()) {
      <div class="csh-drawer" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <button
          type="button"
          class="csh-drawer__backdrop"
          aria-label="Close drawer"
          (click)="closed.emit()"
        ></button>
        <aside class="csh-drawer__panel">
          <header class="csh-drawer__header">
            <h2 class="csh-drawer__title">{{ title() }}</h2>
            <button cshUiButton type="button" variant="outline" size="sm" (click)="closed.emit()">
              Close
            </button>
          </header>
          <div class="csh-drawer__body">
            <ng-content />
          </div>
        </aside>
      </div>
    }
  `,
})
export class CshUiDrawer {
  readonly title = input.required<string>()
  readonly open = input(false)
  readonly closed = output<void>()
}
