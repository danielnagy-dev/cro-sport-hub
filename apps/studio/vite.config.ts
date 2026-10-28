import { defineConfig } from 'vite-plus'

// Angular writes .angular/cache on every build and test. Fingerprinting those
// files makes Vite Task miss the cache even when sources are unchanged.
const angularCache = {
  input: [{ auto: true }, '!.angular/**', '!dist/**'],
  output: [{ auto: true }, '!.angular/**'],
}

const builtLibraries = {
  dependsOn: [{ task: 'build', from: 'dependencies' as const }],
}

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: 'ng serve',
        cache: false,
      },
      build: {
        command: 'ng build',
        cache: angularCache,
        ...builtLibraries,
      },
      test: {
        command: 'ng test --watch=false',
        cache: angularCache,
        ...builtLibraries,
      },
      typecheck: {
        command: 'ngc --noEmit -p tsconfig.app.json',
        cache: angularCache,
        ...builtLibraries,
      },
    },
  },
})
