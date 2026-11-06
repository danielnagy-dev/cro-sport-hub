import { Component, input } from '@angular/core'
import { StudioSectionHeader } from '../../core/studio-section-header'

@Component({
  selector: 'app-gallery-shell',
  imports: [StudioSectionHeader],
  template: `
    <div class="shell">
      <app-studio-section-header [skipLabel]="skipLabel()" />
      <main id="content" class="matches-main" tabindex="-1"><ng-content /></main>
    </div>
  `,
})
export class GalleryShell {
  readonly skipLabel = input('Skip to content')
}
