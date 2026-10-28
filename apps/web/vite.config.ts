import { defineConfig } from 'vite-plus'

const builtLibraries = {
  dependsOn: [{ task: 'build', from: 'dependencies' as const }],
}

// next build reads its previous output. Those files are outputs, not inputs.
const nextCache = {
  input: [{ auto: true }, '!.next/**', '!next-env.d.ts', '!*.tsbuildinfo'],
  output: [{ auto: true }, '!*.tsbuildinfo'],
}

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  run: {
    tasks: {
      dev: {
        command: 'next dev',
        cache: false,
      },
      build: {
        command: 'next build',
        ...builtLibraries,
        cache: nextCache,
      },
      test: {
        command: 'vp test',
        ...builtLibraries,
      },
      typecheck: {
        command: 'tsc --noEmit -p tsconfig.json',
        ...builtLibraries,
        cache: {
          output: [{ auto: true }, '!*.tsbuildinfo'],
        },
      },
    },
  },
})
