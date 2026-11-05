import { PGlite } from '@electric-sql/pglite'
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { openCatalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import * as importRuns from '../../catalog/import-runs.js'
import type { ImportRun } from '../../catalog/import-runs.js'
import * as schema from '../../catalog/schema.js'
import { ImportScheduleService } from './import-schedule.service.js'

function mockImportRun(): ImportRun {
  return {
    id: 'run-1',
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-01T00:00:01.000Z',
    createdCount: 2,
    updatedCount: 0,
    skippedCount: 0,
    error: '',
  }
}

describe('ImportScheduleService.tick', () => {
  let client: PGlite

  beforeEach(() => {
    client = new PGlite()
  })

  afterEach(async () => {
    await client.close()
    vi.restoreAllMocks()
  })

  async function service(): Promise<ImportScheduleService> {
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const moduleRef = await Test.createTestingModule({
      providers: [ImportScheduleService, { provide: CATALOG_OPENER, useValue: open }],
    }).compile()
    return moduleRef.get(ImportScheduleService)
  }

  it('calls runImport once as admin-demo', async () => {
    const runImport = vi.spyOn(importRuns, 'runImport').mockResolvedValue(mockImportRun())
    await (await service()).tick()
    expect(runImport).toHaveBeenCalledOnce()
    expect(runImport.mock.calls[0]?.[2]).toBe('admin-demo')
  })

  it('calls runImport again on a second tick', async () => {
    const runImport = vi.spyOn(importRuns, 'runImport').mockResolvedValue(mockImportRun())
    const tick = await service()
    await tick.tick()
    await tick.tick()
    expect(runImport).toHaveBeenCalledTimes(2)
  })
})

describe('ImportModule schedule registration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('registers no import job when IMPORT_SCHEDULE is unset', async () => {
    vi.unstubAllEnvs()
    delete process.env.IMPORT_SCHEDULE
    const runImport = vi.spyOn(importRuns, 'runImport')
    vi.resetModules()
    const { ImportModule } = await import('./import.module.js')
    const moduleRef = await Test.createTestingModule({ imports: [ImportModule] }).compile()
    expect(() => moduleRef.get(ImportScheduleService)).toThrow(/ImportScheduleService/)
    expect(runImport).not.toHaveBeenCalled()
  })

  it('registers no import job when IMPORT_SCHEDULE is false', async () => {
    vi.stubEnv('IMPORT_SCHEDULE', 'false')
    vi.resetModules()
    const { ImportModule } = await import('./import.module.js')
    const moduleRef = await Test.createTestingModule({ imports: [ImportModule] }).compile()
    expect(() => moduleRef.get(ImportScheduleService)).toThrow(/ImportScheduleService/)
  })

  it('registers an hourly job when IMPORT_SCHEDULE is true', async () => {
    vi.stubEnv('IMPORT_SCHEDULE', 'true')
    const runImport = vi.spyOn(importRuns, 'runImport')
    vi.resetModules()
    const { ImportModule } = await import('./import.module.js')
    const moduleRef = await Test.createTestingModule({ imports: [ImportModule] }).compile()
    await moduleRef.init()
    const registry = moduleRef.get(SchedulerRegistry)
    const job = registry.getCronJob('import-hourly')
    expect(job.cronTime.source).toBe(CronExpression.EVERY_HOUR)
    expect(runImport).not.toHaveBeenCalled()
  })
})
