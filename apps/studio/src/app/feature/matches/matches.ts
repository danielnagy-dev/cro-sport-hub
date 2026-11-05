import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import type { EditorMatch, MatchSource, SportSlug, Status } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { StudioApi } from '../../core/studio-api'

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

const MatchesStore = signalStore(
  withState(initialMatchesState),
  withMethods((store, api = inject(StudioApi)) => {
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
      setSport(value: SportSlug | ''): void {
        patchState(store, { sport: value })
        reload()
      },
      setStatus(value: Status | ''): void {
        patchState(store, { status: value })
        reload()
      },
      setSource(value: MatchSource | ''): void {
        patchState(store, { source: value })
        reload()
      },
    }
  }),
  withHooks({
    onInit(store) {
      store.setSport(store.sport())
    },
  }),
)

function readSelectValue(event: Event): string {
  const target = event.target
  return target instanceof HTMLSelectElement ? target.value : ''
}

@Component({
  selector: 'app-matches',
  imports: [RouterLink],
  templateUrl: './matches.html',
  providers: [MatchesStore],
})
export class MatchesPage {
  protected readonly store = inject(MatchesStore)
  protected readonly auth = inject(AuthStore)

  protected onFilter(kind: 'sport' | 'status' | 'source', event: Event): void {
    const value = readSelectValue(event)
    if (kind === 'sport') this.store.setSport(value as SportSlug | '')
    if (kind === 'status') this.store.setStatus(value as Status | '')
    if (kind === 'source') this.store.setSource(value as MatchSource | '')
  }

  protected logOut(): void {
    this.auth.logOut()
  }
}
