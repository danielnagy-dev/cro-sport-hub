import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-pocetna',
  imports: [StudioSectionHeader],
  templateUrl: './pocetna.html',
})
export class PocetnaPage {
  private readonly route = inject(ActivatedRoute)

  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('admin') === '1')),
    { initialValue: false },
  )
}
