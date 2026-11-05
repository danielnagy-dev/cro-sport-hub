import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const matchesRoutes: Routes = [
  {
    path: 'matches',
    loadComponent: () => import('./matches').then((module) => module.MatchesPage),
    canActivate: [editorGuard],
  },
]
