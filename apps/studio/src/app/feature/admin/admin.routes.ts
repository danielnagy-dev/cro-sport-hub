import type { Routes } from '@angular/router'
import { adminGuard } from '../../core/auth'

export const adminRoutes: Routes = [
  {
    path: 'admin/competitions',
    loadComponent: () =>
      import('./competitions-admin').then((module) => module.CompetitionsAdminPage),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/import',
    loadComponent: () => import('./import-admin').then((module) => module.ImportAdminPage),
    canActivate: [adminGuard],
  },
]
