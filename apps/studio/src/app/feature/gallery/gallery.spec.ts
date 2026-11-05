import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import type { EditorMatch, GalleryView } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  editorMatchesPath,
  galleriesPath,
  galleryPath,
  gallerySlidePath,
} from '../../core/studio-api'
import { GalleryNewPage } from './gallery-new'
import { GalleryPage } from './gallery'

const league: EditorMatch = {
  id: 'match-sample-league',
  sport: 'football',
  competition: 'Sample League',
  date: '2026-10-19',
  round: 'Matchday 8',
  status: 'published',
  source: 'manual',
  label: 'Sample Home vs Sample Away',
}
const tennisPublished: EditorMatch = {
  ...league,
  id: 'match-sample-final',
  sport: 'tennis',
  label: 'Tennis row',
}
const galleryView: GalleryView = {
  id: 'gallery-demo',
  status: 'draft',
  slides: [{ index: 0, matchId: 'match-sample-league', caption: '', stats: [] }],
}

function store(): TokenStore {
  let value: string | null = null
  return {
    read: () => value,
    write: (t) => {
      value = t
    },
    clear: () => {
      value = null
    },
  }
}

function token(): string {
  const payload = btoa(
    JSON.stringify({
      sub: 'editor-demo',
      role: 'editor',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

describe('gallery composer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryNewPage, GalleryPage],
      providers: [
        provideRouter([
          { path: 'login', component: class {} },
          { path: 'galleries/new', component: GalleryNewPage, canActivate: [editorGuard] },
          { path: 'galleries/:id', component: GalleryPage, canActivate: [editorGuard] },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'id' ? 'gallery-demo' : null) },
            },
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: store() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(token())
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('picker, create, caption patch, and blob preview', async () => {
    const http = TestBed.inject(HttpTestingController)
    const newFixture = TestBed.createComponent(GalleryNewPage)
    newFixture.detectChanges()
    http
      .expectOne(`${editorMatchesPath}?sport=football&status=published`)
      .flush({ items: [league, tennisPublished], limit: 20, offset: 0, total: 2 })
    await newFixture.whenStable()
    const newRoot = newFixture.nativeElement as HTMLElement
    expect(newRoot.textContent).toContain('Sample Home vs Sample Away')
    expect(newRoot.textContent).not.toContain('Tennis row')
    const box = newRoot.querySelector('input[type="checkbox"]')
    if (!(box instanceof HTMLInputElement)) throw new Error('missing checkbox')
    box.checked = true
    box.dispatchEvent(new Event('change', { bubbles: true }))
    newRoot
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    http.expectOne(galleriesPath).flush({ id: 'gallery-demo', slideIndexes: [0] })
    await newFixture.whenStable()
    expect(TestBed.inject(Router).url).toBe('/galleries/gallery-demo')

    const fixture = TestBed.createComponent(GalleryPage)
    fixture.detectChanges()
    http.expectOne(galleryPath('gallery-demo')).flush(galleryView)
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement
    const caption = root.querySelector('#caption-0')
    if (!(caption instanceof HTMLInputElement)) throw new Error('missing caption')
    caption.value = 'Sample night'
    caption.dispatchEvent(new Event('input', { bubbles: true }))
    root.querySelectorAll('button')[1]?.click()
    const patch = http.expectOne(gallerySlidePath('gallery-demo', 0))
    expect(patch.request.body).toEqual({ caption: 'Sample night' })
    patch.flush({ ...galleryView, slides: [{ ...galleryView.slides[0], caption: 'Sample night' }] })
    await fixture.whenStable()
    root.querySelectorAll('button')[2]?.click()
    http.expectOne(`${galleryPath('gallery-demo')}/render`).flush({ slideCount: 1 })
    const png = http.expectOne(`${gallerySlidePath('gallery-demo', 0)}.png`)
    expect(png.request.headers.get('Authorization')).toMatch(/^Bearer /)
    png.flush(new Blob(['x'], { type: 'image/png' }))
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.querySelector('img')?.getAttribute('src')).toMatch(/^blob:/)
    expect(root.innerHTML).not.toContain('.png')
  })

  it('sends a guest to login', async () => {
    TestBed.inject(TOKEN_STORE).clear()
    await TestBed.inject(Router).navigateByUrl('/galleries/new')
    expect(TestBed.inject(Router).url).toBe('/login')
  })
})
