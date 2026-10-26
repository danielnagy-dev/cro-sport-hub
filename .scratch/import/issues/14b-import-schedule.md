# 14b: Hourly import behind an env flag

**What to build:** When `IMPORT_SCHEDULE` is exactly `true`, the API runs the 14a fixture once per hour. Any other value, including unset, leaves the timer off, including during `vp run api#dev`. This note is the spec.

**Blocked by:** 14a (`.scratch/import/issues/14a-import-fixture.md`), plus af1, af3, and af5 (ADR-007). The timer calls `runImport`. It does not grow a second writer. It registers on the import feature module, not on `AppModule`.

**Status:** ready-for-agent

**Size:** 260 counted lines. One scheduler module, the env read, ADR-005, and tests that tick the job without waiting an hour. The fixture and the run row are 14a.

## Scope

In: `@nestjs/schedule` as a runtime dependency of `apps/api`. No install script and no new `allowBuilds` entry. ADR-005 records that choice and rejects a hand-rolled `setInterval` in the process bootstrap and a system cron outside the API. The architect writes that ADR in this pull request. Status becomes Accepted there.

`IMPORT_SCHEDULE=true` registers one hourly job. Each tick calls `runImport` once, with actor id `admin-demo`. The tick does not read a password. Unset, empty, or any value other than `true` registers nothing and does not import on boot. Enabling the flag does not import until the first tick. Tests call the tick handler. They do not wait an hour. One tick is one `runImport` call. A second tick is a second call.

Out: a studio control (27c does not post a cron expression), a network feed, and any interval other than once per hour. Do not edit `0001`–`0005`. Update `docs/feature-map.md` `api.import` with the flag name and the hourly default.

## Order

Plan is this note. Architect writes ADR-005 and sketches the tick signature below. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] With `IMPORT_SCHEDULE` unset, the API process registers no import job and a boot does not call `runImport`.
- [ ] With `IMPORT_SCHEDULE=true`, the registered job is hourly, and one tick calls `runImport` once as `admin-demo`.
- [ ] `IMPORT_SCHEDULE=false` registers no job.
- [ ] ADR-005 is Accepted and names `@nestjs/schedule`. The PR adds no `allowBuilds` entry.

## Verification

PGLite test of the tick. `vp run verify:api` does not enable the flag and does not wait for a tick. Say that in the results table.

## Architect

Yes. New runtime dependency, so this pull request needs ADR-005. Studio does not import the scheduler.

`runImport` stays the writer from 14a. The new seam is the tick function the hourly job calls.

### Seams

- The tick function with a fake clock and a stubbed `runImport`. Catches a boot that imports while the flag is off, and a tick that runs twice.
- The hourly registration when the flag is `true`. Catches a job that is not hourly.
