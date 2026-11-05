import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '../../core/auth'
import { EditorStore } from './editor.store'

@Component({
  selector: 'app-shell',
  imports: [RouterLink],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly editor = inject(EditorStore)
  protected readonly auth = inject(AuthStore)

  protected logOut(): void {
    this.auth.logOut()
  }
}
