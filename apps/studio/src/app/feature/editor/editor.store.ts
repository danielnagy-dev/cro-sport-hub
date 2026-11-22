import { inject } from '@angular/core'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import type { Sport, SportSlug } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { CatalogApi } from '../../core/catalog-api'

type EditorStatus = 'loading' | 'ready' | 'error'

type EditorState = {
  sports: Sport[]
  sportSlug: SportSlug
  status: EditorStatus
}

const initialState: EditorState = {
  sports: [],
  sportSlug: 'tennis',
  status: 'loading',
}

export const EditorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, api = inject(CatalogApi)) => {
    let pending: Subscription | undefined

    return {
      load(): void {
        pending?.unsubscribe()
        patchState(store, { status: 'loading' })
        pending = api.sports().subscribe({
          next: (sports) => {
            patchState(store, { sports, status: 'ready' })
          },
          error: () => {
            patchState(store, { sports: [], status: 'error' })
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
