import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const reviewRoutes: Routes = [
  {
    path: 'matches/:id/review',
    loadComponent: () => import('./review').then((module) => module.ReviewPage),
    canActivate: [editorGuard],
  },
]
