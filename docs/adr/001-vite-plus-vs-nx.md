# ADR-001: Vite+ instead of Nx

## Status

Accepted

## Context

The repo is a pnpm workspace with a Next.js app, an Angular app, and a NestJS API. Vite+ 1.4.0 is the toolchain. Nx stays the fallback if Vite+ cannot run the studio tasks.

## Decision

Use the `vp` CLI for install, format, lint, TypeScript checks, tests, production builds, and cached task running. Configuration lives in the root `vite.config.ts`, with package tasks beside each app or library.

`apps/studio` keeps the Angular CLI (`ng build`, `ng test`, `ngc --noEmit`). Vite+ only orchestrates those commands with `vp run`. That is the supported Angular path. `vp check` lints and typechecks `.ts` files and does not typecheck Angular templates, so the studio `typecheck` task runs `ngc --noEmit`.

Studio task cache inputs and outputs ignore `.angular/**`. `ng build` and `ng test` write `.angular/cache`. If Vite Task fingerprints those files, the task misses the cache on every run. Build tasks also ignore their own output directories (`dist/**`, `.next/**`) as inputs, because the tools read the previous output before writing it. `apps/web` and `apps/api` set `incremental` to false so `tsc --noEmit` does not write a `tsbuildinfo` that changes the `vp check` fingerprint.

TypeScript is split on purpose:

- `apps/studio` pins TypeScript 6.0.3. Angular 22 requires `>=6.0 <6.1`.
- `apps/api` pins TypeScript 6.0.3. The Nest CLI loads the TypeScript programmatic API. TypeScript 7.0.2 ships the `tsc` executable only and tells Nest to stay on TypeScript 6 until 7.1.
- The pnpm catalog pins TypeScript 7.0.2 for the root, `apps/web`, and the libraries. `vp pack` emits declarations with the TypeScript 7 native compiler (`tsgo`). The catalog entry is exact, not a range, because the declaration generator treats a `7.0` version as the native compiler.
- The root `package.json` depends on TypeScript 7 so the root `vp` process can resolve that compiler. Run `vp run` from the repository root. Starting it inside `apps/studio` or `apps/api` can resolve TypeScript 6, and library declaration emit then fails.
- `catalogMode: prefer` from the Vite+ monorepo template is not used. That mode can replace an explicit dependency with the catalog entry, which would put TypeScript 7 on the Angular and Nest packages.

The workspace overrides `vite` to `@voidzero-dev/vite-plus-core` 1.4.0, the same override the Vite+ template writes. Angular's builder therefore runs on that Vite. It is not an Angular-supported pairing. A local spike on 23 Oct 2026 built, served, and tested the Angular CLI app with this override, so the scaffold keeps it.

pnpm 12 refuses packages published inside its minimum release age. `minimumReleaseAgeExclude` lists the Vite+ 1.4.0 packages and Next.js 16.4.3, which were inside that window when the lockfile was created. `allowBuilds` enables the install scripts Angular's builder needs (`esbuild`, `lmdb`, `@parcel/watcher`, `msgpackr-extract`).

`vitest` is overridden to 5.0.5, the version bundled with Vite+ 1.4.0, so Angular's unit-test builder and `vp test` share one Vitest line.

## Consequences

Nx generators, migrations, and Angular template lint are not part of this repo. Revisit Nx only if Vite+ cannot build, test, or typecheck `apps/studio`.
