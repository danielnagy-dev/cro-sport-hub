import { Component } from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { adminGuard, authInterceptor, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { adminImportPath, adminImportRunsPath, type ImportRun } from '../../core/import-admin-api'
import { ImportAdminPage } from './import-admin'

@Component({ selector: 'home-probe', template: 'home-page' })
class HomeProbe {}

const seededRun: ImportRun = {
  id: 'run-seeded',
  startedAt: '2026-01-15T10:00:00.000Z',
  finishedAt: '2026-01-15T10:00:02.000Z',
  createdCount: 2,
  updatedCount: 0,
  skippedCount: 0,
  error: '',
}

const failedRun: ImportRun = {
  id: 'run-failed-row',
  startedAt: '2026-01-16T11:00:00.000Z',
  finishedAt: '2026-01-16T11:00:01.000Z',
  createdCount: 0,
  updatedCount: 0,
  skippedCount: 1,
  error: 'Invalid score on fixture row 3',
}

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

function bearer(role: 'admin' | 'editor', exp: number): string {
  const payload = btoa(JSON.stringify({ sub: `${role}-demo`, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

describe('ImportAdminPage', () => {
  let fixture: ComponentFixture<ImportAdminPage>
  let http: HttpTestingController
  let root: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAdminPage],
      providers: [
        provideRouter([
          {
            path: 'admin/import',
            component: ImportAdminPage,
            canActivate: [adminGuard],
          },
          { path: '', component: HomeProbe },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('admin', Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(ImportAdminPage)
    http = TestBed.inject(HttpTestingController)
    root = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
    http.expectOne(adminImportRunsPath).flush([failedRun])
    await fixture.whenStable()
  })

  afterEach(() => {
    http.verify()
    TestBed.resetTestingModule()
  })

  it('lists run counts and the error string from the stubbed API', () => {
    expect(root.textContent).toContain('2026-01-16T11:00:00.000Z')
    expect(root.textContent).toContain('0')
    expect(root.textContent).toContain('1')
    expect(root.textContent).toContain('Invalid score on fixture row 3')
    expect(root.querySelector('input[type="file"]')).toBeNull()
  })

  it('runs the fixture import and reloads the table', async () => {
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Run now'))
      ?.click()
    const run = http.expectOne(adminImportPath)
    expect(run.request.method).toBe('POST')
    run.flush(seededRun)
    http.expectOne(adminImportRunsPath).flush([seededRun, failedRun])
    await fixture.whenStable()
    expect(root.textContent).toContain('2026-01-15T10:00:00.000Z')
    expect(root.textContent).toContain('2')
  })
})

describe('ImportAdminPage access', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('keeps an editor off the import page', async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAdminPage],
      providers: [
        provideRouter([
          {
            path: 'admin/import',
            component: ImportAdminPage,
            canActivate: [adminGuard],
          },
          { path: '', component: HomeProbe },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
    const router = TestBed.inject(Router)
    await router.navigateByUrl('/admin/import')
    expect(router.url).toBe('/')
  })

  it('sends a guest to login', async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAdminPage],
      providers: [
        provideRouter([
          {
            path: 'admin/import',
            component: ImportAdminPage,
            canActivate: [adminGuard],
          },
          { path: 'login', component: ImportAdminPage },
          { path: '', redirectTo: '/login', pathMatch: 'full' },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    const router = TestBed.inject(Router)
    await router.navigateByUrl('/admin/import')
    expect(router.url).toBe('/login')
  })
})
