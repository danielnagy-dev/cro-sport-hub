import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { t } from '../../core/messages'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-shell',
  imports: [StudioSectionHeader],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly route = inject(ActivatedRoute)

  protected readonly title = t('pocetna.title')
  protected readonly lead = t('shell-home.lead')
  protected readonly adminOnly = t('pocetna.admin-only')

  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('admin') === '1')),
    { initialValue: false },
  )
}
