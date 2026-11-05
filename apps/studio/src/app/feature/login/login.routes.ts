import type { Routes } from '@angular/router'
import { guestGuard } from '../../core/auth'

export const loginRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login').then((module) => module.LoginPage),
    canActivate: [guestGuard],
  },
]
