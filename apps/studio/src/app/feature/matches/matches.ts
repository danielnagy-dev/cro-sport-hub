import { Component, DestroyRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import type { EditorMatch, MatchSource, SportSlug, Status } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { MatchesApi } from '../../core/matches-api'
import { StudioSectionHeader } from '../../core/studio-section-header'

type MatchesState = {
  items: EditorMatch[]
  sport: SportSlug | ''
  status: Status | ''
  source: MatchSource | ''
  loadStatus: 'loading' | 'ready' | 'error'
}

const initialMatchesState: MatchesState = {
  items: [],
  sport: '',
  status: '',
  source: '',
  loadStatus: 'loading',
}

function parseSportParam(value: string | null): SportSlug | '' {
  if (value === 'tennis' || value === 'football') return value
  return ''
}

function parseStatusParam(value: string | null): Status | '' {
  if (value === 'draft' || value === 'review' || value === 'published') return value
  return ''
}

function parseSourceParam(value: string | null): MatchSource | '' {
  if (value === 'manual' || value === 'import') return value
  return ''
}

const MatchesStore = signalStore(
  withState(initialMatchesState),
  withMethods((store, api = inject(MatchesApi)) => {
    let pending: Subscription | undefined

    function reload(): void {
      pending?.unsubscribe()
      patchState(store, { loadStatus: 'loading' })
      const sport = store.sport()
      const status = store.status()
      const source = store.source()
      pending = api
        .editorMatches({
          sport: sport === '' ? undefined : sport,
          status: status === '' ? undefined : status,
          source: source === '' ? undefined : source,
        })
        .subscribe({
          next: (page) => patchState(store, { items: page.items, loadStatus: 'ready' }),
          error: () => patchState(store, { items: [], loadStatus: 'error' }),
        })
    }

    return {
      syncFromQuery(params: ParamMap): void {
        patchState(store, {
          sport: parseSportParam(params.get('sport')),
          status: parseStatusParam(params.get('status')),
          source: parseSourceParam(params.get('source')),
        })
        reload()
      },
    }
  }),
)

function readSelectValue(event: Event): string {
  const target = event.target
  return target instanceof HTMLSelectElement ? target.value : ''
}

@Component({
  selector: 'app-matches',
  imports: [RouterLink, StudioSectionHeader],
  templateUrl: './matches.html',
  providers: [MatchesStore],
})
export class MatchesPage {
  protected readonly store = inject(MatchesStore)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.store.syncFromQuery(params)
    })
  }

  protected onFilter(kind: 'sport' | 'status' | 'source', event: Event): void {
    const value = readSelectValue(event)
    const sport: SportSlug | '' = kind === 'sport' ? (value as SportSlug | '') : this.store.sport()
    const status: Status | '' = kind === 'status' ? (value as Status | '') : this.store.status()
    const source: MatchSource | '' =
      kind === 'source' ? (value as MatchSource | '') : this.store.source()
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sport: sport === '' ? undefined : sport,
        status: status === '' ? undefined : status,
        source: source === '' ? undefined : source,
      },
      replaceUrl: true,
    })
  }
}
