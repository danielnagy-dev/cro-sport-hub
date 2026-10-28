import {
  publishedMatchPageSchema,
  sportSchema,
  type PublishedMatchPage,
  type Sport,
} from '@cro-sport-hub/shared-types'

/** `GET /api/sports` is not served. `GET /api/matches` returns a published page. */
export const sportsPath = '/api/sports'
export const matchesPath = '/api/matches'

/** Non-OK HTTP from a read. Schema failures throw from the shared schemas instead. */
export class ApiClientError extends Error {
  readonly status: number

  constructor(path: string, status: number) {
    super(`GET ${path} returned HTTP ${status}`)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export type ApiClient = {
  sports: () => Promise<Sport[]>
  matches: () => Promise<PublishedMatchPage>
}

type ApiClientOptions = {
  fetch?: typeof fetch
  /** Origin only, such as `http://localhost:3001`. Empty means a same-origin path. */
  baseUrl?: string
}

/**
 * Read-only client for sports and matches.
 * Auth and write calls are a later change.
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const fetchImpl =
    options.fetch ??
    ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  const baseUrl = options.baseUrl ?? ''

  async function read(path: string): Promise<unknown> {
    const url = baseUrl === '' ? path : new URL(path, baseUrl).href
    const response = await fetchImpl(url, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new ApiClientError(path, response.status)
    const body: unknown = JSON.parse(await response.text())
    return body
  }

  return {
    async sports() {
      return sportSchema.array().parse(await read(sportsPath))
    },
    async matches() {
      return publishedMatchPageSchema.parse(await read(matchesPath))
    },
  }
}
