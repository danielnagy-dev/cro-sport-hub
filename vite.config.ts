import { defineConfig } from "vite-plus";

/**
 * Root tasks are the commands to run before a pull request.
 * Per-package tasks live in each package's vite.config.ts so Vite Task can cache them.
 * `vp run -r` from here is inlined, and the root task is pruned so it does not recurse.
 *
 * Compiler versions, and why these tasks run from the repository root, are in
 * docs/adr/001-vite-plus-vs-nx.md.
 *
 * `typeCheck` is off. Package `typecheck` tasks already run `tsc --noEmit` or
 * `ngc --noEmit`. `typeAware` stays on so lint rules can use types.
 */
export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: false },
    ignorePatterns: [
      "**/dist/**",
      "**/coverage/**",
      "**/.angular/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/storybook-static/**",
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
        command: "vp run -r typecheck",
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
