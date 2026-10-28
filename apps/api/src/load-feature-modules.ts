import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { DynamicModule, Type } from '@nestjs/common'

/** Nest class name for a feature folder, for example `admin-teams` → `AdminTeamsModule`. */
export function featureModuleClassName(featureDirectoryName: string): string {
  return (
    featureDirectoryName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Module'
  )
}

async function moduleExtension(moduleStem: string): Promise<'js' | 'ts' | null> {
  for (const extension of ['js', 'ts'] as const) {
    try {
      await access(`${moduleStem}.${extension}`)
      return extension
    } catch {
      continue
    }
  }
  return null
}

/** Loads feature Nest modules from `directory/<name>/<name>.module.{js,ts}` in `en` sort order. */
export async function loadFeatureModules(
  directory: string,
): Promise<Array<Type<unknown> | DynamicModule>> {
  const entries = await readdir(directory, { withFileTypes: true })
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'))

  const modules: Array<Type<unknown> | DynamicModule> = []
  for (const name of names) {
    const stem = path.join(directory, name, `${name}.module`)
    if (stem.endsWith('.spec.ts') || stem.endsWith('.spec.js')) {
      continue
    }
    const extension = await moduleExtension(stem)
    if (!extension) {
      continue
    }
    const url = pathToFileURL(`${stem}.${extension}`).href
    const imported: unknown = await import(url)
    if (typeof imported !== 'object' || imported === null) {
      throw new Error(`Expected ${stem}.${extension} to export a Nest module`)
    }
    const className = featureModuleClassName(name)
    const nestModule = (imported as Record<string, Type<unknown> | DynamicModule>)[className]
    if (!nestModule) {
      throw new Error(`Expected ${stem}.${extension} to export ${className}`)
    }
    modules.push(nestModule)
  }
  return modules
}
