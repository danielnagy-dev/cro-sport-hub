import { defineConfig } from "vite-plus";

/**
 * Root tasks are the commands to run before a pull request.
 * Per-package tasks live in each package's vite.config.ts so Vite Task can cache them.
 * `vp run -r` from here is inlined, and the root task is pruned so it does not recurse.
 *
 * TypeScript 7 is the workspace compiler (catalog). apps/studio pins TypeScript 6.
 * Run these tasks from the repository root so `vp pack` resolves TypeScript 7 for tsgo.
 * See docs/adr/001-vite-plus-vs-nx.md.
 */
export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      "**/dist/**",
      "**/coverage/**",
      "**/.angular/**",
      "**/.next/**",
      "**/node_modules/**",
    ],
  },
  run: {
    cache: true,
    tasks: {
      "format-check": "vp fmt --check",
      lint: {
        command: "vp lint",
        dependsOn: [
          "@cro-sport-hub/shared-types#build",
          "@cro-sport-hub/ui#build",
          "@cro-sport-hub/slide-generator#build",
        ],
      },
      typecheck: {
        command: "vp check --no-fmt --no-lint && vp run -r typecheck",
        dependsOn: [
          "@cro-sport-hub/shared-types#build",
          "@cro-sport-hub/ui#build",
          "@cro-sport-hub/slide-generator#build",
        ],
      },
      test: "vp run -r test",
      build: "vp run -r build",
    },
  },
});
