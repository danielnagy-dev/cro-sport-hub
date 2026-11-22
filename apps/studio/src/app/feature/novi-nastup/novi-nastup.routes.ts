import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const noviNastupRoutes: Routes = [
  {
    path: 'novi-nastup',
    loadComponent: () => import('./novi-nastup').then((m) => m.NoviNastupPage),
    canActivate: [editorGuard],
  },
]
