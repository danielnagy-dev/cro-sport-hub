import { Component, computed, inject, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, map, startWith } from 'rxjs'
import { AuthStore } from './auth'

type StudioNavSection = 'pocetna' | 'sportasi' | 'objave' | 'postavke'

function readStudioNavSection(router: Router): StudioNavSection | null {
  const tree = router.parseUrl(router.url)
  const primary = tree.root.children['primary']
  if (primary === undefined) return 'pocetna'
  const segments = primary.segments
  if (segments.length === 0) return 'pocetna'
  const first = segments[0]?.path
  if (first === 'pocetna') return 'pocetna'
  if (first === 'sportasi') return 'sportasi'
  if (first === 'objave') return 'objave'
  if (first === 'postavke') return 'postavke'
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

  protected readonly ariaPocetna = computed(() => (this.section() === 'pocetna' ? 'page' : null))

  protected readonly ariaSportasi = computed(() => (this.section() === 'sportasi' ? 'page' : null))

  protected readonly ariaObjave = computed(() => (this.section() === 'objave' ? 'page' : null))

  protected readonly ariaPostavke = computed(() => (this.section() === 'postavke' ? 'page' : null))

  protected logOut(): void {
    this.auth.logOut()
  }
}
