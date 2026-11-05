import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

const footballScore = () => import('./football-score').then((module) => module.FootballScorePage)

export const footballFormRoutes: Routes = [
  {
    path: 'matches/new/football',
    loadComponent: footballScore,
    canActivate: [editorGuard],
  },
  {
    path: 'matches/:id/football',
    loadComponent: footballScore,
    canActivate: [editorGuard],
  },
]
