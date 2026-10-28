import { defineConfig } from 'vite-plus'

const builtLibraries = {
  dependsOn: [{ task: 'build', from: 'dependencies' as const }],
}

// storybook-static is a directory entry, not only its children. `/**` does not
// cover that entry, so a later build treated it as a new pack input.
const ignoreGenerated = ['!dist/**', '!storybook-static', '!storybook-static/**']

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    dts: {
      generator: 'tsgo',
    },
    exports: {
      customExports: {
        './tokens.css': './dist/tokens.css',
        './components.css': './dist/components.css',
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
  },
  run: {
    tasks: {
      pack: {
        command: 'vp pack',
        ...builtLibraries,
        cache: {
          input: [{ auto: true }, ...ignoreGenerated],
          // The stylesheet copy restores its own files. Pack must not snapshot them.
          output: ['dist/**', '!dist/tokens.css', '!dist/components.css'],
        },
      },
      'copy-styles': {
        command: 'cp src/tokens.css src/components.css dist/',
        dependsOn: ['pack'],
        cache: {
          input: ['src/tokens.css', 'src/components.css'],
          output: ['dist/tokens.css', 'dist/components.css'],
        },
      },
      build: {
        command: 'STORYBOOK_DISABLE_TELEMETRY=1 storybook build --output-dir storybook-static',
        dependsOn: ['copy-styles'],
        cache: {
          input: [{ auto: true }, ...ignoreGenerated],
          output: ['storybook-static/**'],
        },
      },
      storybook: {
        command: 'STORYBOOK_DISABLE_TELEMETRY=1 storybook dev --port 6006 --no-open',
        cache: false,
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
