import { Component, inject, signal } from '@angular/core'
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals'
import { Router } from '@angular/router'
import { idSchema } from '@cro-sport-hub/shared-types'
import { AuthStore } from '../../core/auth'

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthStore)
  private readonly router = inject(Router)

  protected readonly model = signal({ id: '', password: '' })
  protected readonly passwordVisible = signal(false)
  protected readonly failure = signal<string | undefined>(undefined)
  protected readonly loginForm = form(this.model, (path) => {
    required(path.id, { message: 'Enter your user id.' })
    validate(path.id, ({ value }) => {
      const id = value()
      if (id.length === 0 || idSchema.safeParse(id).success) return undefined
      return { kind: 'id', message: 'Use 1–64 letters, digits, underscores, or hyphens.' }
    })
    required(path.password, { message: 'Enter your password.' })
    maxLength(path.password, 72, { message: 'Use 72 characters or fewer.' })
  })

  protected showErrors(kind: 'id' | 'password'): boolean {
    const field = kind === 'id' ? this.loginForm.id() : this.loginForm.password()
    return field.touched() && field.invalid()
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    void this.send()
  }

  private async send(): Promise<void> {
    if (this.loginForm().submitting()) return
    this.failure.set(undefined)
    const accepted = await submit(this.loginForm, {
      action: async () => {
        const outcome = await this.auth.signIn(this.model())
        if (outcome === 'ok') {
          await this.router.navigateByUrl('/')
          return undefined
        }
        this.failure.set(
          outcome === 'invalid'
            ? 'Invalid credentials.'
            : 'The studio could not reach the login service.',
        )
        return undefined
      },
    })
    if (!accepted || this.failure() !== undefined) this.focusProblem()
  }

  private focusProblem(): void {
    setTimeout(() => {
      const alert = document.getElementById('login-error')
      const id = document.getElementById('username')
      const password = document.getElementById('current-password')
      const invalid =
        id?.getAttribute('aria-invalid') === 'true'
          ? id
          : password?.getAttribute('aria-invalid') === 'true'
            ? password
            : null
      ;(alert ?? invalid)?.focus()
    })
  }
}
