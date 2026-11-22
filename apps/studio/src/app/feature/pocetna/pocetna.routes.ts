import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const pocetnaRoutes: Routes = [
  {
    path: 'pocetna',
    loadComponent: () => import('./pocetna').then((module) => module.PocetnaPage),
    canActivate: [editorGuard],
  },
]
