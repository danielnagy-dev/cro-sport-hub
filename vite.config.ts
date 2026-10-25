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
  fmt: {
    // The seven vendored skill folders are copied as-is. skills-lock.json is not an oxfmt target.
    ignorePatterns: [
      ".agents/skills/code-review/**",
      ".agents/skills/codebase-design/**",
      ".agents/skills/diagnosing-bugs/**",
      ".agents/skills/grill-me/**",
      ".agents/skills/grilling/**",
      ".agents/skills/tdd/**",
      ".agents/skills/writing-for-agents/**",
    ],
  },
  lint: {
    // correctness is already Oxlint's default error category. Set it here so the
    // severity stays visible next to the stricter rules below.
    categories: { correctness: "error" },
    // @angular-eslint/eslint-plugin 22.6.0 does not load: ts-api-utils reads
    // TypeScript 7 and crashes on `ts.Intrinsic`. Studio templates stay on
    // `ngc --noEmit`. Do not re-add the plugin until that load path works.
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    // `plugins` replaces Oxlint's default set. Keep unicorn, typescript, and oxc.
    plugins: ["unicorn", "typescript", "oxc", "vitest"],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-explicit-any": "error",
      "typescript/ban-ts-comment": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "typescript/await-thenable": "error",
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/no-unnecessary-type-assertion": "error",
      "vitest/require-to-throw-message": "error",
      // expect-expect misses HttpTestingController. no-conditional-expect flags shared-schema `if (!success) expect(...)`.
      "vitest/expect-expect": "off",
      "vitest/no-conditional-expect": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
    options: { typeAware: true, typeCheck: false },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**"],
        rules: {
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-member-access": "off",
          "typescript/no-non-null-assertion": "off",
        },
      },
      { files: ["tools/**"], rules: { "no-console": "off" } },
    ],
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
      // guards also runs uncached as `vp run guards` so a lint cache hit cannot hide a trailer.
      lint: {
        command: "vp lint && vpx tools/guards/check.ts",
        dependsOn: [
          "@cro-sport-hub/shared-types#build",
          "@cro-sport-hub/ui#build",
          "@cro-sport-hub/slide-generator#build",
        ],
      },
      typecheck: {
        command:
          "vp run -r typecheck && tsc --noEmit -p tools/verify/tsconfig.json && tsc --noEmit -p tools/guards/tsconfig.json",
        dependsOn: [
          "@cro-sport-hub/shared-types#build",
          "@cro-sport-hub/ui#build",
          "@cro-sport-hub/slide-generator#build",
        ],
      },
      test: "vp run -r test",
      build: "vp run -r build",
      guards: { command: "vpx tools/guards/check.ts", cache: false },
      "verify:doctor": { command: "vpx tools/verify/verify.ts doctor", cache: false },
      "verify:api": { command: "vpx tools/verify/verify.ts api", cache: false },
      "verify:studio": { command: "vpx tools/verify/verify.ts studio", cache: false },
      "verify:web": { command: "vpx tools/verify/verify.ts web", cache: false },
      "verify:ui": { command: "vpx tools/verify/verify.ts ui", cache: false },
    },
  },
});
