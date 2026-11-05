import { computed, inject } from '@angular/core'
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals'
import type { Match, Sport, SportSlug } from '@cro-sport-hub/shared-types'
import { forkJoin, type Subscription } from 'rxjs'
import { CatalogApi } from '../../core/catalog-api'

type EditorStatus = 'loading' | 'ready' | 'error'

type EditorState = {
  sports: Sport[]
  matches: Match[]
  sportSlug: SportSlug
  status: EditorStatus
}

const initialState: EditorState = {
  sports: [],
  matches: [],
  sportSlug: 'tennis',
  status: 'loading',
}

export const EditorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    visibleMatches: computed(() => {
      const sport = store.sports().find((item) => item.slug === store.sportSlug())
      if (sport === undefined) {
        return []
      }
      return store.matches().filter((match) => match.sportId === sport.id)
    }),
  })),
  withMethods((store, api = inject(CatalogApi)) => {
    let pending: Subscription | undefined

    return {
      load(): void {
        pending?.unsubscribe()
        patchState(store, { status: 'loading' })
        pending = forkJoin({
          sports: api.sports(),
          matches: api.matches(),
        }).subscribe({
          next: ({ sports, matches }) => {
            patchState(store, { sports, matches, status: 'ready' })
          },
          error: () => {
            patchState(store, { sports: [], matches: [], status: 'error' })
          },
        })
      },
      selectSport(sportSlug: SportSlug): void {
        patchState(store, { sportSlug })
      },
    }
  }),
  withHooks({
    onInit(store) {
      store.load()
    },
  }),
)
