import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const editorRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./shell').then((module) => module.Shell),
    canActivate: [editorGuard],
  },
]
