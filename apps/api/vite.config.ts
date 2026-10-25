import { defineConfig } from "vite-plus";

const builtLibraries = {
  dependsOn: [{ task: "build", from: "dependencies" as const }],
};

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
  run: {
    tasks: {
      dev: {
        command: "nest start --watch",
        cache: false,
      },
      build: {
        command: "nest build",
        ...builtLibraries,
        cache: {
          input: [{ auto: true }, "!dist/**", "!*.tsbuildinfo"],
          output: [{ auto: true }, "!*.tsbuildinfo"],
        },
      },
      test: {
        command: "vp test",
        ...builtLibraries,
      },
      typecheck: {
        command: "tsc --noEmit -p tsconfig.json",
        ...builtLibraries,
        cache: {
          input: [{ auto: true }, "!*.tsbuildinfo"],
          output: [{ auto: true }, "!*.tsbuildinfo"],
        },
      },
      seed: {
        command: "vpx src/catalog/seed-cli.ts",
        cache: false,
        ...builtLibraries,
      },
    },
  },
});
