import type { Routes } from '@angular/router'
import { editorGuard, guestGuard } from './core/auth'

export const studioRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./feature/login/login').then((module) => module.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./feature/editor/shell').then((module) => module.Shell),
    canActivate: [editorGuard],
  },
  {
    path: 'matches',
    loadComponent: () => import('./feature/matches/matches').then((module) => module.MatchesPage),
    canActivate: [editorGuard],
  },
  {
    path: 'matches/new/tennis',
    loadComponent: () =>
      import('./feature/tennis-form/tennis-score').then((module) => module.TennisScorePage),
    canActivate: [editorGuard],
  },
  {
    path: 'matches/:id/tennis',
    loadComponent: () =>
      import('./feature/tennis-form/tennis-score').then((module) => module.TennisScorePage),
    canActivate: [editorGuard],
  },
  { path: '**', redirectTo: '' },
]
