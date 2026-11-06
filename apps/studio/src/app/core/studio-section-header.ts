import { Component, computed, inject, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, map, startWith } from 'rxjs'
import { AuthStore } from './auth'

type StudioNavSection = 'home' | 'matches' | 'review-queue' | 'galleries' | 'admin'

function readFirstQueryValue(params: Record<string, unknown>, key: string): string | undefined {
  const raw = params[key]
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  return undefined
}

function readStudioNavSection(router: Router): StudioNavSection | null {
  const tree = router.parseUrl(router.url)
  const primary = tree.root.children['primary']
  if (primary === undefined) return 'home'
  const segments = primary.segments
  if (segments.length === 0) return 'home'
  const first = segments[0]?.path
  if (first === 'matches') {
    if (segments.length >= 3 && segments[2]?.path === 'review') return 'review-queue'
    if (segments.length === 1) {
      const qp = tree.queryParams as Record<string, unknown>
      const status = readFirstQueryValue(qp, 'status')
      if (status === 'review') return 'review-queue'
      return 'matches'
    }
    return 'matches'
  }
  if (first === 'galleries') return 'galleries'
  if (first === 'admin') return 'admin'
  return null
}

@Component({
  selector: 'app-studio-section-header',
  imports: [RouterLink],
  templateUrl: './studio-section-header.html',
})
export class StudioSectionHeader {
  private readonly router = inject(Router)
  protected readonly auth = inject(AuthStore)

  readonly skipLabel = input('Skip to content')

  private readonly section = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => readStudioNavSection(this.router)),
      startWith(readStudioNavSection(this.router)),
    ),
    { initialValue: readStudioNavSection(this.router) },
  )

  protected readonly ariaHome = computed(() => (this.section() === 'home' ? 'page' : null))

  protected readonly ariaMatches = computed(() => (this.section() === 'matches' ? 'page' : null))

  protected readonly ariaReviewQueue = computed(() =>
    this.section() === 'review-queue' ? 'page' : null,
  )

  protected readonly ariaGalleries = computed(() =>
    this.section() === 'galleries' ? 'page' : null,
  )

  protected readonly ariaAdmin = computed(() => (this.section() === 'admin' ? 'page' : null))

  protected logOut(): void {
    this.auth.logOut()
  }
}
