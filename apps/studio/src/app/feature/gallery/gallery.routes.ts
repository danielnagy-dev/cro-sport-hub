import type { Routes } from '@angular/router'
import { editorGuard } from '../../core/auth'

export const galleryRoutes: Routes = [
  {
    path: 'galleries/new',
    loadComponent: () => import('./gallery-new').then((module) => module.GalleryNewPage),
    canActivate: [editorGuard],
  },
  {
    path: 'galleries/:id',
    loadComponent: () => import('./gallery').then((module) => module.GalleryPage),
    canActivate: [editorGuard],
  },
]
