import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { loadRootEnv, rootEnvPath } from './load-root-env.js'

describe('loadRootEnv', () => {
  const previousPort = process.env.PORT

  afterEach(() => {
    if (previousPort === undefined) {
      delete process.env.PORT
    } else {
      process.env.PORT = previousPort
    }
  })

  it('resolves the repository-root env file', () => {
    const path = rootEnvPath()
    const rootPackage = JSON.parse(readFileSync(join(dirname(path), 'package.json'), 'utf8')) as {
      name: string
    }
    expect(rootPackage.name).toBe('cro-sport-hub')
  })

  it('applies PORT from the file and leaves a PORT already set', () => {
    const dir = mkdtempSync(join(tmpdir(), 'api-env-'))
    const file = join(dir, '.env')
    writeFileSync(file, 'PORT=3999\n')
    delete process.env.PORT

    loadRootEnv(file)
    expect(process.env.PORT).toBe('3999')

    writeFileSync(file, 'PORT=3998\n')
    loadRootEnv(file)
    expect(process.env.PORT).toBe('3999')
  })
})
