import type { Routes } from '@angular/router'

export const studioRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pocetna' },
  {
    path: '',
    loadChildren: () => import('./feature/admin/admin.routes').then((module) => module.adminRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/football-form/football-form.routes').then(
        (module) => module.footballFormRoutes,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/gallery/gallery.routes').then((module) => module.galleryRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./feature/login/login.routes').then((module) => module.loginRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/matches/matches.routes').then((module) => module.matchesRoutes),
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
      import('./feature/review/review.routes').then((module) => module.reviewRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/sportasi/sportasi.routes').then((module) => module.sportasiRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./feature/tennis-form/tennis-form.routes').then((module) => module.tennisFormRoutes),
  },
  { path: '**', redirectTo: 'pocetna' },
]
