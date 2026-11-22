import { TestBed } from '@angular/core/testing'
import { Subject, throwError } from 'rxjs'
import { EditorStore } from './editor.store'
import { CatalogApi } from '../../core/catalog-api'
import { stubSports } from '../../core/stub-api'

describe('EditorStore', () => {
  it('loads sports and selects a slug', () => {
    const sports = new Subject<typeof stubSports>()
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogApi,
          useValue: {
            sports: () => sports.asObservable(),
          },
        },
      ],
    })

    const store = TestBed.inject(EditorStore)
    expect(store.status()).toBe('loading')
    expect(store.sports()).toEqual([])

    sports.next(stubSports)
    sports.complete()

    expect(store.status()).toBe('ready')
    expect(store.sports()).toEqual(stubSports)
    expect(store.sportSlug()).toBe('tennis')

    store.selectSport('football')
    expect(store.sportSlug()).toBe('football')
  })

  it('clears sports when a read fails', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogApi,
          useValue: {
            sports: () => throwError(() => new Error('unavailable')),
          },
        },
      ],
    })

    const store = TestBed.inject(EditorStore)
    expect(store.status()).toBe('error')
    expect(store.sports()).toEqual([])
  })
})
