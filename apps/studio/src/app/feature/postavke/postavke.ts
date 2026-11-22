import { Component } from '@angular/core'
import { t } from '../../core/messages'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-postavke',
  imports: [StudioSectionHeader],
  templateUrl: './postavke.html',
})
export class PostavkePage {
  protected readonly skipLabel = t('postavke.skip')
  protected readonly title = t('postavke.title')
  protected readonly lead = t('postavke.lead')
}
