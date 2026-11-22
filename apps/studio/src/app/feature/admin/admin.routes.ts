import type { Routes } from '@angular/router'
import { adminGuard } from '../../core/auth'

export const adminRoutes: Routes = [
  {
    path: 'admin/teams',
    loadComponent: () => import('./teams-admin').then((module) => module.TeamsAdminPage),
    canActivate: [adminGuard],
  },
]
