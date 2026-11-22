import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const objaveRoutes: Routes = [
  {
    path: 'objave',
    loadComponent: () => import('./objave').then((module) => module.ObjavePage),
    canActivate: [editorGuard],
  },
]
