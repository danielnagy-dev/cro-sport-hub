import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository-root `.env`, three levels above `src/` and `dist/`. */
export function rootEnvPath(moduleUrl: string = import.meta.url): string {
  return resolve(dirname(fileURLToPath(moduleUrl)), '../../../.env')
}

/**
 * Load the repository-root `.env` when it exists.
 * Variables already set in the process are left unchanged.
 */
export function loadRootEnv(path: string = rootEnvPath()): void {
  if (!existsSync(path)) {
    return
  }
  process.loadEnvFile(path)
}
