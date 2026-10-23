import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  run: {
    tasks: {
      build: {
        command: "vp pack",
        cache: {
          input: [{ auto: true }, "!dist/**"],
        },
      },
      test: "vp test",
      typecheck: "tsc --noEmit -p tsconfig.json",
    },
  },
});
