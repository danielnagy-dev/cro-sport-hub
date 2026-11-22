import { inject, Injectable } from '@angular/core'
import type { Network } from '@cro-sport-hub/shared-types'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const publishSlotClocksPath = '/api/settings/publish-slot-clocks'
export const connectedAccountsPath = '/api/settings/connected-accounts'

const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const NETWORKS = new Set<Network>(['instagram', 'facebook', 'x'])

export type PublishSlotClock = {
  id: string
  label: string
  clockTime: string
  sortOrder: number
  active: boolean
}

export type UpdatePublishSlotClocksBody = { clocks: PublishSlotClock[] }
export type ConnectedAccount = { network: Network; loginChecked: boolean }

function parseClock(value: unknown): PublishSlotClock {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid publish slot clock')
  const row = value as Record<string, unknown>
  if (
    typeof row['id'] !== 'string' ||
    typeof row['label'] !== 'string' ||
    typeof row['clockTime'] !== 'string' ||
    !CLOCK_TIME_PATTERN.test(row['clockTime']) ||
    typeof row['sortOrder'] !== 'number' ||
    !Number.isInteger(row['sortOrder']) ||
    row['sortOrder'] < 0 ||
    typeof row['active'] !== 'boolean'
  ) {
    throw new Error('Invalid publish slot clock')
  }
  return {
    id: row['id'],
    label: row['label'],
    clockTime: row['clockTime'],
    sortOrder: row['sortOrder'],
    active: row['active'],
  }
}

export function parsePublishSlotClocks(body: unknown): PublishSlotClock[] {
  if (!Array.isArray(body)) throw new Error('Invalid publish slot clocks response')
  return body.map(parseClock)
}

function parseAccount(value: unknown): ConnectedAccount {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid connected account')
  const row = value as Record<string, unknown>
  const network = row['network']
  if (typeof network !== 'string' || !NETWORKS.has(network as Network)) {
    throw new Error('Invalid connected account')
  }
  if (typeof row['loginChecked'] !== 'boolean') throw new Error('Invalid connected account')
  return { network: network as Network, loginChecked: row['loginChecked'] }
}

export function parseConnectedAccounts(body: unknown): ConnectedAccount[] {
  if (!Array.isArray(body)) throw new Error('Invalid connected accounts response')
  return body.map(parseAccount)
}

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(StudioHttp)

  listPublishSlotClocks(): Observable<PublishSlotClock[]> {
    return this.http.get(publishSlotClocksPath, parsePublishSlotClocks)
  }

  updatePublishSlotClocks(body: UpdatePublishSlotClocksBody): Observable<PublishSlotClock[]> {
    return this.http.patch(publishSlotClocksPath, body, parsePublishSlotClocks)
  }

  listConnectedAccounts(): Observable<ConnectedAccount[]> {
    return this.http.get(connectedAccountsPath, parseConnectedAccounts)
  }
}
