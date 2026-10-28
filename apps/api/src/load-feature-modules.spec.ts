import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import { featureModuleClassName, loadFeatureModules } from './load-feature-modules.js'

describe('loadFeatureModules', () => {
  it('loads feature modules in en sort order and skips spec files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cro-feature-modules-'))
    const zulu = path.join(root, 'zulu')
    const alpha = path.join(root, 'alpha')
    await mkdir(zulu, { recursive: true })
    await mkdir(alpha, { recursive: true })
    await writeFile(path.join(zulu, 'zulu.module.js'), `export class ZuluModule {}\n`)
    await writeFile(path.join(alpha, 'alpha.module.js'), `export class AlphaModule {}\n`)
    await writeFile(path.join(alpha, 'alpha.module.spec.js'), `export class AlphaSpecModule {}\n`)

    const modules = await loadFeatureModules(root)
    expect(modules.map((mod) => (mod as { name: string }).name)).toEqual([
      'AlphaModule',
      'ZuluModule',
    ])
  })

  it('names Nest module classes from directory names', () => {
    expect(featureModuleClassName('admin-teams')).toBe('AdminTeamsModule')
    expect(featureModuleClassName('login')).toBe('LoginModule')
  })

  it('sorts with localeCompare en, not the runtime default locale', () => {
    const sorted = ['älpha', 'alpha'].sort((left, right) => left.localeCompare(right, 'en'))
    expect(sorted).toEqual(['alpha', 'älpha'])
  })
})

describe('loadFeatureModules fixture import', () => {
  it('dynamic-imports compiled js modules when present', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cro-feature-js-'))
    const beta = path.join(root, 'beta')
    await mkdir(beta, { recursive: true })
    await writeFile(path.join(beta, 'beta.module.js'), `export class BetaModule {}\n`)

    const modules = await loadFeatureModules(root)
    expect(modules).toHaveLength(1)
    expect((modules[0] as { name: string }).name).toBe('BetaModule')
  })
})
