import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import type { EditorMatch, GalleryView } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  galleriesPath,
  galleryDownloadPath,
  galleryPath,
  galleryPublishPath,
  galleryRejectPath,
  gallerySlidePath,
  gallerySubmitPath,
} from '../../core/gallery-api'
import { editorMatchesPath } from '../../core/matches-api'
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
const galleryId = 'gallery-demo'
const galleryView: GalleryView = {
  id: galleryId,
  status: 'draft',
  slides: [
    { index: 0, matchId: 'match-sample-league', caption: '', stats: [] },
    { index: 1, matchId: 'match-sample-league', caption: '', stats: [] },
  ],
}
const reviewGallery: GalleryView = { ...galleryView, status: 'review' }
const publishedGallery: GalleryView = { ...galleryView, status: 'published' }

function memoryStore(): TokenStore {
  let value: string | null = null
  return {
    read: () => value,
    write: (token) => {
      value = token
    },
    clear: () => {
      value = null
    },
  }
}

function bearer(role: 'editor' | 'admin', exp: number): string {
  const payload = btoa(JSON.stringify({ sub: `${role}-demo`, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function clickButton(root: HTMLElement, label: string): void {
  const button = [...root.querySelectorAll('button')].find((node) =>
    node.textContent?.includes(label),
  )
  if (button === undefined) throw new Error(`missing ${label}`)
  button.click()
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
              paramMap: { get: (key: string) => (key === 'id' ? galleryId : null) },
            },
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
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
    http.expectOne(galleriesPath).flush({ id: galleryId, slideIndexes: [0, 1] })
    await newFixture.whenStable()
    expect(TestBed.inject(Router).url).toBe(`/galleries/${galleryId}`)

    const fixture = TestBed.createComponent(GalleryPage)
    fixture.detectChanges()
    http.expectOne(galleryPath(galleryId)).flush(galleryView)
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement
    expect(root.textContent).toContain('Submit for review')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Download')
    const caption = root.querySelector('#caption-0')
    if (!(caption instanceof HTMLInputElement)) throw new Error('missing caption')
    caption.value = 'Sample night'
    caption.dispatchEvent(new Event('input', { bubbles: true }))
    clickButton(root, 'Save caption')
    const patch = http.expectOne(gallerySlidePath(galleryId, 0))
    expect(patch.request.body).toEqual({ caption: 'Sample night' })
    patch.flush({
      ...galleryView,
      slides: [{ ...galleryView.slides[0], caption: 'Sample night' }, { ...galleryView.slides[1] }],
    })
    await fixture.whenStable()
    clickButton(root, 'Preview PNG')
    http.expectOne(`${galleryPath(galleryId)}/render`).flush({ slideCount: 2 })
    const png = http.expectOne(`${gallerySlidePath(galleryId, 0)}.png`)
    expect(png.request.headers.get('Authorization')).toMatch(/^Bearer /)
    png.flush(new Blob(['x'], { type: 'image/png' }))
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.querySelector('img')?.getAttribute('src')).toMatch(/^blob:/)
    expect(root.innerHTML).not.toContain('.png')
  })

  it('sends a guest to login', async () => {
    TestBed.inject(TOKEN_STORE).clear()
    const router = TestBed.inject(Router)
    await router.navigateByUrl('/galleries/new')
    expect(router.url).toBe('/login')
    await router.navigateByUrl(`/galleries/${galleryId}`)
    expect(router.url).toBe('/login')
  })
})

describe('GalleryPage review and download', () => {
  let fixture: ComponentFixture<GalleryPage>
  let http: HttpTestingController
  let root: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryPage],
      providers: [
        provideRouter([
          { path: 'galleries/:id', component: GalleryPage, canActivate: [editorGuard] },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? galleryId : null) } },
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    http.verify()
    TestBed.resetTestingModule()
  })

  async function open(role: 'editor' | 'admin', row: GalleryView = reviewGallery): Promise<void> {
    TestBed.inject(TOKEN_STORE).write(bearer(role, Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(GalleryPage)
    fixture.detectChanges()
    http.expectOne(galleryPath(galleryId)).flush(row)
    await fixture.whenStable()
    fixture.detectChanges()
    root = fixture.nativeElement as HTMLElement
  }

  it('shows Gallery not found for an unknown id', async () => {
    TestBed.resetTestingModule()
    await TestBed.configureTestingModule({
      imports: [GalleryPage],
      providers: [
        provideRouter([{ path: 'galleries/:id', component: GalleryPage }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'gallery-missing' } } },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(GalleryPage)
    fixture.detectChanges()
    const missingHttp = TestBed.inject(HttpTestingController)
    missingHttp.expectOne(galleryPath('gallery-missing')).flush('Unknown gallery', {
      status: 404,
      statusText: 'Not Found',
    })
    await fixture.whenStable()
    fixture.detectChanges()
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Gallery not found')
    missingHttp.verify()
  })

  it('hides Reject and Publish for an editor on a review gallery', async () => {
    await open('editor')
    expect(root.textContent).toContain('review')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('hides admin actions on a draft gallery', async () => {
    await open('admin', galleryView)
    expect(root.textContent).toContain('draft')
    expect(root.textContent).toContain('Submit for review')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('submits a draft for review and hides the submit button', async () => {
    await open('editor', galleryView)
    expect(root.textContent).toContain('Submit for review')
    clickButton(root, 'Submit for review')
    const submit = http.expectOne(gallerySubmitPath(galleryId))
    expect(submit.request.method).toBe('POST')
    submit.flush({ id: galleryId, status: 'review' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('review')
    expect(root.textContent).not.toContain('Submit for review')
  })

  it('shows 409 conflict message from submit', async () => {
    await open('editor', galleryView)
    clickButton(root, 'Submit for review')
    const submit = http.expectOne(gallerySubmitPath(galleryId))
    submit.flush(
      { message: 'Only a draft gallery can be submitted' },
      { status: 409, statusText: 'Conflict' },
    )
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('Only a draft gallery can be submitted')
  })

  it('hides Submit for review when status is review or published', async () => {
    await open('editor', reviewGallery)
    expect(root.textContent).not.toContain('Submit for review')
    await open('editor', publishedGallery)
    expect(root.textContent).not.toContain('Submit for review')
  })

  it('publishes a review gallery and downloads with a bearer token', async () => {
    await open('admin')
    clickButton(root, 'Publish')
    http.expectOne(galleryPublishPath(galleryId)).flush({ id: galleryId, status: 'published' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('published')
    clickButton(root, 'Download')
    const download = http.expectOne(galleryDownloadPath(galleryId))
    expect(download.request.headers.get('Authorization')).toMatch(/^Bearer /)
    download.flush(new Blob(['zip'], { type: 'application/zip' }))
    await fixture.whenStable()
  })

  it('rejects a review gallery back to draft', async () => {
    await open('admin')
    clickButton(root, 'Reject')
    http.expectOne(galleryRejectPath(galleryId)).flush({ id: galleryId, status: 'draft' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('draft')
  })

  it('hides Download until the gallery is published', async () => {
    await open('admin', publishedGallery)
    expect(root.textContent).toContain('Download')
    await open('admin', reviewGallery)
    expect(root.textContent).not.toContain('Download')
  })
})
