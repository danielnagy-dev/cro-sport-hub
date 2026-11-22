import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const sportasiRoutes: Routes = [
  {
    path: 'sportasi',
    loadComponent: () => import('./sportasi').then((module) => module.SportasiPage),
    canActivate: [editorGuard],
  },
]
