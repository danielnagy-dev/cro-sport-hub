import { describe, expect, it } from 'vite-plus/test'
import { localDevDefaults, readApiConfig, readImportScheduleEnabled } from './api-config.js'

describe('readImportScheduleEnabled', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['true', true],
    ['TRUE', false],
    [' true', false],
  ] as const)('returns %s when IMPORT_SCHEDULE is %j', (value, enabled) => {
    expect(readImportScheduleEnabled(value === undefined ? {} : { IMPORT_SCHEDULE: value })).toBe(
      enabled,
    )
  })
})

describe('readApiConfig', () => {
  it('uses the local Compose defaults when the environment is empty', () => {
    expect(readApiConfig({})).toEqual({
      port: localDevDefaults.port,
      databaseUrl: localDevDefaults.databaseUrl,
      redisUrl: localDevDefaults.redisUrl,
    })
  })

  it('reads port and URLs from the environment', () => {
    expect(
      readApiConfig({
        PORT: ' 4000 ',
        DATABASE_URL: 'postgres://cro_sport:from-the-env@127.0.0.1:5433/cro_sport',
        REDIS_URL: 'redis://127.0.0.1:6380',
      }),
    ).toEqual({
      port: 4000,
      databaseUrl: 'postgres://cro_sport:from-the-env@127.0.0.1:5433/cro_sport',
      redisUrl: 'redis://127.0.0.1:6380',
    })
  })

  it.each(['0', '65536', 'abc', '3001abc'])('rejects PORT %s', (port) => {
    expect(() => readApiConfig({ PORT: port })).toThrow(/PORT must be an integer/)
  })

  it('rejects an empty or non-database URL', () => {
    expect(() => readApiConfig({ DATABASE_URL: '  ' })).toThrow(/DATABASE_URL/)
    expect(() => readApiConfig({ DATABASE_URL: 'not a url' })).toThrow(/DATABASE_URL/)
    expect(() => readApiConfig({ DATABASE_URL: 'http://127.0.0.1:5432/cro_sport' })).toThrow(
      /postgresql:/,
    )
  })

  it('rejects a Redis URL that is not redis', () => {
    expect(() => readApiConfig({ REDIS_URL: 'http://127.0.0.1:6379' })).toThrow(/redis:/)
  })
})
