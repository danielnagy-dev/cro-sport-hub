import { describe, expect, it } from 'vite-plus/test'
import { formatImportLogIsoForDisplay } from './import-admin-format'

const FIXED_IMPORT_LOG_TEST_TZ = 'Europe/Budapest'

describe('formatImportLogIsoForDisplay', () => {
  it('formats an ISO instant for the pinned time zone', () => {
    expect(
      formatImportLogIsoForDisplay('2026-01-16T11:00:00.000Z', {
        timeZone: FIXED_IMPORT_LOG_TEST_TZ,
      }),
    ).toBe('16 Jan 2026, 12:00')
  })
})
