import { Component, effect, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { AuthStore } from './core/auth'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  private readonly auth = inject(AuthStore)
  private readonly router = inject(Router)

  constructor() {
    let signedIn = false
    effect(() => {
      if (this.auth.session() !== null) {
        signedIn = true
        return
      }
      if (!signedIn || this.router.url.startsWith('/login')) return
      void this.router.navigateByUrl('/login')
    })
  }
}
