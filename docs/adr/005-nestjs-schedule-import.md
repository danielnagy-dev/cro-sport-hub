# ADR-005: Hourly import with `@nestjs/schedule`

## Status

Accepted

## Context

Plan item 14b runs the 14a fixture import once per hour when `IMPORT_SCHEDULE` is exactly `true`. The job lives on the import feature module in `apps/api`. Studio and the other apps do not schedule imports. ADR-001 keeps `allowBuilds` as an explicit list. The API already uses NestJS 12 for HTTP features.

## Decision

Use `@nestjs/schedule` in `apps/api` only. `ImportModule` imports `ScheduleModule.forRoot()` when `readImportScheduleEnabled()` is true and registers one `@Cron(CronExpression.EVERY_HOUR)` handler that calls `ImportScheduleService.tick()`. That method opens the catalog, calls `runImport(catalog, readImportFixture(), 'admin-demo')`, and closes the catalog. It does not read a password. Any `IMPORT_SCHEDULE` value other than exactly `true`, including unset, registers no job and does not import on boot.

Rejected: a hand-rolled `setInterval` in `main.ts` or bootstrap, because it bypasses Nest lifecycle and is harder to test beside the feature module. Rejected: system cron outside the API process, because deploy would own a second scheduler and the import writer already lives in the API catalog layer.

## Consequences

Operators set `IMPORT_SCHEDULE=true` in the repository-root `.env` to enable the hourly job. The first import waits for the first tick; boot does not call `runImport`. Tests call `tick()` directly and assert cron registration through `SchedulerRegistry`. No new `allowBuilds` entry. Revisit only if the interval or trigger moves outside hourly env-gated imports.
