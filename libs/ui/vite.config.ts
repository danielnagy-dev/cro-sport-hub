import { defineConfig } from "vite-plus";

const builtLibraries = {
  dependsOn: [{ task: "build", from: "dependencies" as const }],
};

const sourceCache = {
  input: [{ auto: true }, "!dist/**", "!storybook-static/**"],
  output: ["dist/**", "storybook-static/**"],
};

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    dts: {
      generator: "tsgo",
    },
    exports: {
      customExports: {
        "./tokens.css": "./dist/tokens.css",
        "./components.css": "./dist/components.css",
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
  },
  run: {
    tasks: {
      build: {
        command:
          "vp pack && cp src/tokens.css src/components.css dist/ && STORYBOOK_DISABLE_TELEMETRY=1 storybook build --output-dir storybook-static",
        ...builtLibraries,
        cache: sourceCache,
      },
      storybook: {
        command: "STORYBOOK_DISABLE_TELEMETRY=1 storybook dev --port 6006 --no-open",
        cache: false,
      },
      test: {
        command: "vp test",
        ...builtLibraries,
      },
      typecheck: {
        command: "tsc --noEmit -p tsconfig.json",
        ...builtLibraries,
        cache: {
          output: [{ auto: true }, "!*.tsbuildinfo"],
        },
      },
    },
  },
});
