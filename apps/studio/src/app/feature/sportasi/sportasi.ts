import { Component } from '@angular/core'
import { t } from '../../core/messages'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-sportasi',
  imports: [StudioSectionHeader],
  templateUrl: './sportasi.html',
})
export class SportasiPage {
  protected readonly skipLabel = t('sportasi.skip')
  protected readonly title = t('sportasi.title')
  protected readonly lead = t('sportasi.lead')
}
