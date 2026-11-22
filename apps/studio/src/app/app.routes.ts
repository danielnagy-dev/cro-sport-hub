import type { Routes } from '@angular/router'

export const studioRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pocetna' },
  {
    path: '',
    loadChildren: () => import('./feature/login/login.routes').then((module) => module.loginRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/novi-nastup/novi-nastup.routes').then((module) => module.noviNastupRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/objave/objave.routes').then((module) => module.objaveRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/pocetna/pocetna.routes').then((module) => module.pocetnaRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/postavke/postavke.routes').then((module) => module.postavkeRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/sportasi/sportasi.routes').then((module) => module.sportasiRoutes),
  },
  { path: '**', redirectTo: 'pocetna' },
]
