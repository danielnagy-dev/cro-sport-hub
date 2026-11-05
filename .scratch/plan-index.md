# Plan index

Planning snapshot for the remaining v1 items. This file is not `docs/agents/issue-tracker.md`. Develop PRs do not edit it. Status lives on the ticket. A later planning pass can replace this list.

**Pull request numbers:** Work merged before 2026-11-05 is cited as **Origin #N** (Cursor Origin). The repo moved to GitHub on 2026-11-05 and GitHub numbering restarted, so the same era of work also appears as **GitHub #N** for merges after the move. Origin #38–#49 are not the same numbers as GitHub #38–#42.

Counted lines are code plus tests, the same count as `.cursor/skills/plan/SKILL.md`. Target 300. An estimate over 400 was split before `ready-for-agent`.

Already on main, and not re-ticketed: catalog and shutdown, match schema, football appearances, seed, public matches (7 and 7b), JWT login, `saveDraft` (11a, Origin #22), draft routes (11b, Origin #24), UI library and results, web shell, studio shell, studio login (22, Origin #23), slide template and slide split, and the file-size guard (21b, Origin #21). ADR-007 is implemented (af1–af6, Origin #39–#45), the quote-style pass (fmt, Origin #38), the approved design system doc (Origin #46), and studio feature boundaries (sb1, Origin #47). Recent GitHub merges: 18a (Origin #27), 18b (GitHub #39), 30a (GitHub #40), 8b (GitHub #41), and 23b (GitHub #42). New source files have to stay under the file-size guard.

Decisions written into the tickets, so develop does not invent them: an admin publishes and rejects, and an editor or an admin submits (the seed's `reviewedBy` is the admin, and the two guards already exist). Public cache TTL is 60 seconds and a Redis error still serves the catalog. Public athlete bodies use names, not club ids, matching the published match list. Import updates a draft and leaves a review or published row alone. No Open Graph image and no README GIF. Sport admin and user admin are out of v1. The import timer is off unless `IMPORT_SCHEDULE=true`, and then it runs once an hour. Gallery slides use catalog fields only: no shirt number, no stat the catalog does not store, stats as text with no donut, and one optional caption per slide. Visitor and editor Playwright stay local until deploy. There is no Compose job in CI.

## Order

ADR-007 and fmt are on main. API features add folders under `apps/api/src/features/` and id files under `docs/feature-map/api/`; they no longer queue on `app.module.ts` or `docs/feature-map/api.md`. One API ticket at a time is still the safe default when two slices would add a barrel export or edit the same feature folder.

Parallel work in flight: 8c, 19a, and 24b are **claimed**. After 8c merges, cache tickets (9a, 9b) and 12b can start. Publish (12b) still waits on 12a and 9b. 14b waits on 14a plus the athlete and gallery API slices it calls. Gallery persistence (30b–30e) and studio composer (31a) follow their ticket blockers. Web athlete pages (19b, 19c) wait on 19a and 8b/8c. Studio forms follow 24b. The README (32) is last among the v1 rows and does not wait on fmt.

| Id  | Title                                         | Estimate | Blockers                 | Status          |
| --- | --------------------------------------------- | -------: | ------------------------ | --------------- |
| 8a  | Athlete profile and club history              |      340 | none                     | resolved        |
| 18a | Latest results on the home page               |      300 | none                     | resolved        |
| 13a | Admin competitions                            |      320 | none                     | resolved        |
| 13b | Admin teams                                   |      300 | none                     | resolved        |
| 24a | Editor lookups for the forms                  |      260 | none                     | resolved        |
| 12a | Submit a draft and reject a review            |      320 | none                     | resolved        |
| 23a | Editorial match list                          |      300 | none                     | resolved        |
| 14a | Import drafts from a fixture                  |      340 | none                     | resolved        |
| 30a | Catalog fields on football slides             |      300 | none                     | resolved        |
| 18b | Tennis and football sport pages               |      280 | 18a                      | resolved        |
| 8b  | Tennis results on the athlete read            |      320 | af1, af3, af5            | resolved        |
| 23b | Studio matches table                          |      320 | 23a                      | resolved        |
| 14b | Hourly import behind an env flag              |      260 | 14a, af1, af3, af5       | ready-for-agent |
| 30b | Create a gallery and edit captions            |      340 | 30a, af1, af3, af5       | ready-for-agent |
| 30c | Render gallery PNGs                           |      280 | 30b                      | ready-for-agent |
| 30d | Submit, reject, and publish a gallery         |      260 | 30b                      | ready-for-agent |
| 30e | Download an approved gallery as a ZIP         |      220 | 30c, 30d                 | ready-for-agent |
| 31a | Studio gallery composer                       |      320 | 30c, 23a                 | ready-for-agent |
| 8c  | Football appearances on the athlete read      |      300 | 8b                       | claimed         |
| 9a  | Cache the published match reads               |      280 | 8b, 8c                   | ready-for-agent |
| 9b  | Cache athlete reads and the invalidation hook |      240 | 9a, 8b, 8c               | ready-for-agent |
| 12b | Publish a review and drop the public cache    |      220 | 12a, 9b                  | ready-for-agent |
| 19a | Athlete profile page                          |      280 | 8a, 18b                  | claimed         |
| 24b | Tennis score form                             |      340 | 24a, 23b                 | claimed         |
| 19b | Tennis results on the athlete page            |      240 | 19a, 8b                  | ready-for-agent |
| 19c | Football appearances on the athlete page      |      220 | 19a, 8c                  | ready-for-agent |
| 20a | Sitemap                                       |      200 | 18b, 19a                 | ready-for-agent |
| 24c | Tennis stats and submit for review            |      280 | 24b, 12a                 | ready-for-agent |
| 24d | Reopen a tennis draft                         |      280 | 24c                      | ready-for-agent |
| 25a | Football score form                           |      280 | 24b, 24a                 | ready-for-agent |
| 20b | Visitor flow with axe                         |      280 | 19b, 18b                 | ready-for-agent |
| 25b | Football appearances and submit               |      320 | 25a, 24c                 | ready-for-agent |
| 25c | Reopen a football draft                       |      260 | 25b, 24d                 | ready-for-agent |
| 26a | Review, reject, and publish                   |      300 | 12b, 24d, 25c, 23b       | ready-for-agent |
| 26b | Editor flow through to the public list        |      300 | 26a, 18a                 | ready-for-agent |
| 27a | Studio competitions admin                     |      300 | 13a, 26a                 | ready-for-agent |
| 27b | Studio teams admin                            |      260 | 13b, 27a                 | ready-for-agent |
| 27c | Import log and Run now                        |      240 | 14a, 27a                 | ready-for-agent |
| 31b | Gallery review and ZIP download               |      280 | 31a, 30d, 30e, 26a       | ready-for-agent |
| 32  | v1 local README                               |      200 | every other ready ticket | ready-for-agent |
| sb1 | Studio feature boundaries and import guard    |      165 | none                     | resolved        |

Paths are `.scratch/<feature>/issues/<id>-<slug>.md`: `athletes` (8), `cache` (9), `matches` (12), `admin` (13), `import` (14a, 14b), `web` (18, 19, 20), `editor` (23a, 24a), `studio` (23b, 24b, 24c, 24d, 25, 26, 27, 31), `gallery` (30), `docs` (32), `api-features` (af1–af6), `format` (fmt), `design-system` (doc, merged).

## Parallel

Shared paths are the files a ticket edits (`.cursor/skills/plan/SKILL.md`). One ticket from each group may run with one ticket from every other group. Tickets in the same group run one at a time. After ADR-007, API registration is not a shared queue: new API work is mostly new files under `apps/api/src/features/` and `docs/feature-map/api/<id>.md`.

| Group              | Shared paths                                                                                                                               | One at a time                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| API (safe default) | `libs/shared-types/src/index.ts` when a ticket adds a shared export, or an existing `apps/api/src/features/<name>/` tree when extending it | One API ticket at a time unless the plan lists no shared path between them     |
| Web                | `docs/feature-map/web/<id>.md` for the id the ticket owns                                                                                  | 19a, 19b, 19c, 20a, 20b (18a and 18b are resolved)                             |
| Studio             | `docs/feature-map/studio/<id>.md` for the id the ticket owns                                                                               | 24b, 24c, 24d, 25a, 25b, 25c, 26a, 26b, 27a, 27b, 27c, 31a, 31b (23b resolved) |
| Slides             | files under `libs/slide-generator/` (no feature-map row)                                                                                   | 30a resolved; 30b–30e are gallery API plus studio, not this cell               |
| Format             | `vite.config.ts` and every file the formatter rewrites                                                                                     | fmt, alone, and only when no pull request is open                              |

Area files (`docs/feature-map/api.md`, `web.md`, `studio.md`, `ui.md`) hold naming rules only. af6 split the old single-file indexes into per-id files; a new id is a new path and does not block another area.

## ADR-007

Implement `docs/adr/007-api-feature-files.md`. All slices below are on main (Origin #38–#45).

| Id  | Title                                       | Estimate | Blockers | With     | Status   |
| --- | ------------------------------------------- | -------: | -------- | -------- | -------- |
| af1 | Load API feature modules                    |      340 | none     | af2, af5 | resolved |
| af2 | Detach catalog reads from `Catalog`         |      260 | none     | af1, af5 | resolved |
| af3 | Detach catalog writes from `Catalog`        |      340 | af2      | af6      | resolved |
| af4 | Collect migrations from the directory       |      160 | af3      | af6      | resolved |
| af5 | One feature-map file per API id             |      340 | none     | af1, af2 | resolved |
| af6 | One feature-map file per studio, web, ui id |      360 | af5      | af3, af4 | resolved |
| fmt | Single quotes, no semicolons                | over 400 | none     | none     | resolved |

Paths: `.scratch/api-features/issues/0N-<slug>.md` and `.scratch/format/issues/01-quote-style.md`. fmt stayed one pull request (plan skill, one-shot format).

## Decisions

Daniel closed the open questions on 26 Oct 2026. Nothing in this index is waiting on an answer.

1. **Sports admin** is out of v1. ADR-002 stays. Tennis and football remain the seeded pair. Callers do not insert sports. There is no ticket for sport CRUD.
2. **User admin** is out of v1. The only accounts are `editor-demo` and `admin-demo`. Passwords come from the environment (ADR-004). There is no ticket for user CRUD.
3. **Import timer** is 14b. `IMPORT_SCHEDULE` is off unless it is exactly `true`. When it is on, `runImport` runs once per hour. `vp run api#dev` does not import unless that flag is set. ADR-005 is written in that pull request.
4. **Gallery** is 30a through 30e and 31a, 31b. Slides show catalog fields only. No shirt number. No passes, saves, rating, or shots. Stats are text. No donut. One optional caption string per slide. ADR-003 records that. ADR-006 (the ZIP library) is written in 30e.
5. **Playwright** visitor (20b) and editor (26b) flows stay local until deploy. There is no Compose job in CI.
6. **`catalog.ts`** is being split in a separate pull request. It is a blocker for nothing in this index. `vp run guards` goes green for that file once the split merges. This plan does not edit it.

Sport admin and user admin have no API ticket and no studio ticket.
