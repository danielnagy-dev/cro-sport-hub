import { Component } from '@angular/core'
import { t } from '../../core/messages'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-objave',
  imports: [StudioSectionHeader],
  templateUrl: './objave.html',
})
export class ObjavePage {
  protected readonly skipLabel = t('objave.skip')
  protected readonly title = t('objave.title')
  protected readonly lead = t('objave.lead')
}
