import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { AuthStore } from '../../core/auth'

@Component({
  selector: 'app-shell',
  imports: [RouterLink],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(AuthStore)
  private readonly route = inject(ActivatedRoute)

  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('admin') === '1')),
    { initialValue: false },
  )

  protected logOut(): void {
    this.auth.logOut()
  }
}
