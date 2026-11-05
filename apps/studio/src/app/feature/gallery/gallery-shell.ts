import { Component, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '../../core/auth'

@Component({
  selector: 'app-gallery-shell',
  imports: [RouterLink],
  template: `
    <div class="shell">
      <header class="shell-header">
        <a class="skip-link" href="#content">{{ skipLabel() }}</a>
        <p class="shell-mark">Cro Sport Hub</p>
        <h1>Studio</h1>
        <nav class="shell-nav" aria-label="Studio sections">
          <a routerLink="/">Home</a>
          <a routerLink="/matches">Matches</a>
          <a routerLink="/galleries/new" [attr.aria-current]="galleriesCurrent()">Galleries</a>
        </nav>
        @if (auth.session(); as session) {
          <div class="shell-session">
            <span>{{ session.id }}</span>
            <button type="button" (click)="auth.logOut()">Log out</button>
          </div>
        }
      </header>
      <main id="content" tabindex="-1"><ng-content /></main>
    </div>
  `,
})
export class GalleryShell {
  protected readonly auth = inject(AuthStore)
  readonly skipLabel = input('Skip to content')
  readonly galleriesCurrent = input<'page' | null>(null)
}
