import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { authInterceptor, editorGuard, loginPath, TOKEN_STORE, type TokenStore } from './auth'
import { LoginPage } from './login'

@Component({ selector: 'home-probe', template: 'home-page' })
class HomeProbe {}

function bearer(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'editor-demo', role: 'editor', exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
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

function field(root: ParentNode, id: string): HTMLInputElement {
  const input = root.querySelector(`#${id}`)
  if (!(input instanceof HTMLInputElement)) throw new Error(`missing #${id}`)
  return input
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('LoginPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([
          { path: 'login', component: LoginPage },
          { path: '', component: HomeProbe, canActivate: [editorGuard] },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
  })

  it('announces empty fields and does not call the API', async () => {
    const fixture = TestBed.createComponent(LoginPage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    const password = field(root, 'current-password')

    expect(root.querySelector("label[for='username']")?.textContent).toContain('User id')
    expect(field(root, 'username').autocomplete).toBe('username')
    expect(password.autocomplete).toBe('current-password')
    expect(password.type).toBe('password')
    ;[...root.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Show password'))
      ?.click()
    await fixture.whenStable()
    expect(password.type).toBe('text')

    ;[...root.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Log in'))
      ?.click()
    await fixture.whenStable()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(root.textContent).toContain('Enter your user id.')
    expect(root.textContent).toContain('Enter your password.')
    expect(document.activeElement).toBe(field(root, 'username'))
    TestBed.inject(HttpTestingController).expectNone(loginPath)
  })

  it('keeps an illegal id off the API', async () => {
    const fixture = TestBed.createComponent(LoginPage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    typeInto(field(root, 'username'), 'bad id')
    typeInto(field(root, 'current-password'), 'secret')
    ;[...root.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Log in'))
      ?.click()
    await fixture.whenStable()

    expect(root.textContent).toContain('Use 1–64 letters, digits, underscores, or hyphens.')
    TestBed.inject(HttpTestingController).expectNone(loginPath)
  })

  it('announces invalid credentials and opens the studio after a token', async () => {
    const fixture = TestBed.createComponent(LoginPage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    const http = TestBed.inject(HttpTestingController)
    typeInto(field(root, 'username'), 'editor-demo')
    typeInto(field(root, 'current-password'), 'secret')
    const submit = () =>
      [...root.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Log in'))
        ?.click()

    submit()
    http.expectOne(loginPath).flush({}, { status: 401, statusText: 'Unauthorized' })
    await fixture.whenStable()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.textContent).toContain('Invalid credentials.')
    expect(document.activeElement).toBe(root.querySelector("[role='alert']"))

    submit()
    http.expectOne(loginPath).flush({ token: bearer(Math.floor(Date.now() / 1000) + 60 * 60) })
    await fixture.whenStable()
    expect(TestBed.inject(Router).url).toBe('/')
  })
})
