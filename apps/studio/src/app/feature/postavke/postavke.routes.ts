import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const postavkeRoutes: Routes = [
  {
    path: 'postavke',
    loadComponent: () => import('./postavke').then((module) => module.PostavkePage),
    canActivate: [editorGuard],
  },
]
