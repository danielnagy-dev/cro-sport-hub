import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { StudioHttp } from './studio-http'

export const adminImportPath = '/api/admin/import'
export const adminImportRunsPath = '/api/admin/import/runs'

export type ImportRun = {
  id: string
  startedAt: string
  finishedAt: string
  createdCount: number
  updatedCount: number
  skippedCount: number
  error: string
}

function parseImportRun(body: unknown): ImportRun {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid import run')
  const row = body as Record<string, unknown>
  if (typeof row['id'] !== 'string') throw new Error('Invalid import run id')
  if (typeof row['startedAt'] !== 'string') throw new Error('Invalid import run startedAt')
  if (typeof row['finishedAt'] !== 'string') throw new Error('Invalid import run finishedAt')
  if (typeof row['createdCount'] !== 'number') throw new Error('Invalid import run createdCount')
  if (typeof row['updatedCount'] !== 'number') throw new Error('Invalid import run updatedCount')
  if (typeof row['skippedCount'] !== 'number') throw new Error('Invalid import run skippedCount')
  if (typeof row['error'] !== 'string') throw new Error('Invalid import run error')
  return {
    id: row['id'],
    startedAt: row['startedAt'],
    finishedAt: row['finishedAt'],
    createdCount: row['createdCount'],
    updatedCount: row['updatedCount'],
    skippedCount: row['skippedCount'],
    error: row['error'],
  }
}

function parseImportRuns(body: unknown): ImportRun[] {
  if (!Array.isArray(body)) throw new Error('Invalid import run list')
  return body.map((item) => parseImportRun(item))
}

@Injectable({ providedIn: 'root' })
export class ImportAdminApi {
  private readonly http = inject(StudioHttp)

  listRuns(): Observable<ImportRun[]> {
    return this.http.get(adminImportRunsPath, parseImportRuns)
  }

  runNow(): Observable<ImportRun> {
    return this.http.post(adminImportPath, null, parseImportRun)
  }
}
