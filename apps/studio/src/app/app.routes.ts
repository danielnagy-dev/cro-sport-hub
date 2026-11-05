import type { Routes } from '@angular/router'

export const studioRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./feature/editor/editor.routes').then((module) => module.editorRoutes),
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
      import('./feature/tennis-form/tennis-form.routes').then((module) => module.tennisFormRoutes),
  },
  { path: '**', redirectTo: '' },
]
