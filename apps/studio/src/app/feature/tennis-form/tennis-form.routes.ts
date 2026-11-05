import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

const tennisScore = () => import('./tennis-score').then((module) => module.TennisScorePage)

export const tennisFormRoutes: Routes = [
  {
    path: 'matches/new/tennis',
    loadComponent: tennisScore,
    canActivate: [editorGuard],
  },
  {
    path: 'matches/:id/tennis',
    loadComponent: tennisScore,
    canActivate: [editorGuard],
  },
]
