import { Module } from '@nestjs/common'
import { readApiConfig } from '../api-config.js'
import { openCredentialStore, type CredentialStore } from './auth.js'
import { AdminAuthGuard, EditorAuthGuard } from './role.guard.js'

export type CredentialOpener = () => Promise<CredentialStore & { close(): Promise<void> }>

/** Opens the credential store for one request. The Nest process does not connect on boot. */
export const CREDENTIAL_STORE = Symbol('CREDENTIAL_STORE')

@Module({
  providers: [
    EditorAuthGuard,
    AdminAuthGuard,
    {
      provide: CREDENTIAL_STORE,
      useValue: (): Promise<CredentialStore & { close(): Promise<void> }> =>
        openCredentialStore(readApiConfig().databaseUrl),
    },
  ],
  exports: [EditorAuthGuard, AdminAuthGuard, CREDENTIAL_STORE],
})
export class AuthModule {}
