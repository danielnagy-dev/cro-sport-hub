import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const footballFormRoutes: Routes = [
  {
    path: 'matches/new/football',
    loadComponent: () => import('./football-score').then((module) => module.FootballScorePage),
    canActivate: [editorGuard],
  },
]
