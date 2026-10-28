import { expect, test } from 'vite-plus/test'
import { packageId } from '../src/index.ts'

test('package is wired', () => {
  expect(packageId).toBe('@cro-sport-hub/slide-generator')
})
