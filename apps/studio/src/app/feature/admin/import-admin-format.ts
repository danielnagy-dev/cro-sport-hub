type ImportLogFormatOptions = {
  /** Tests pass a fixed IANA zone so output is pinned; the UI omits this and uses the runtime local zone */
  timeZone?: string
}

const IMPORT_LOG_DISPLAY_OPTIONS = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const

export function formatImportLogIsoForDisplay(
  iso: string,
  options?: ImportLogFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-GB', {
    ...IMPORT_LOG_DISPLAY_OPTIONS,
    ...(options?.timeZone !== undefined ? { timeZone: options.timeZone } : {}),
  }).format(new Date(iso))
}
