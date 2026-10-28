import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'
import { studioRoutes } from './app.routes'
import { authInterceptor } from './auth'
import { stubApiInterceptor } from './stub-api'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(studioRoutes),
    provideHttpClient(withInterceptors([authInterceptor, stubApiInterceptor])),
  ],
}
