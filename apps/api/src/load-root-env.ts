import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function rootEnvPath(moduleUrl: string = import.meta.url): string {
  return resolve(dirname(fileURLToPath(moduleUrl)), '../../../.env')
}

export function loadRootEnv(path: string = rootEnvPath()): void {
  if (!existsSync(path)) {
    return
  }
  process.loadEnvFile(path)
}
