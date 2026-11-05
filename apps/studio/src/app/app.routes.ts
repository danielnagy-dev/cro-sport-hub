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
    path: 'matches/new/football',
    loadComponent: () =>
      import('./feature/football-form/football-score').then((module) => module.FootballScorePage),
    canActivate: [editorGuard],
  },
  {
    path: 'matches/:id/tennis',
    loadComponent: () =>
      import('./feature/tennis-form/tennis-score').then((module) => module.TennisScorePage),
    canActivate: [editorGuard],
  },
  {
    path: 'matches/:id/football',
    loadComponent: () =>
      import('./feature/football-form/football-score').then((module) => module.FootballScorePage),
    canActivate: [editorGuard],
  },
  {
    path: 'galleries/new',
    loadComponent: () =>
      import('./feature/gallery/gallery-new').then((module) => module.GalleryNewPage),
    canActivate: [editorGuard],
  },
  {
    path: 'galleries/:id',
    loadComponent: () => import('./feature/gallery/gallery').then((module) => module.GalleryPage),
    canActivate: [editorGuard],
  },
  { path: '**', redirectTo: '' },
]
