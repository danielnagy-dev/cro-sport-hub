# af6: One feature-map file per studio, web, and ui id

**What to build:** Studio, web, and ui use the same id-file layout as the API. ADR-007 is the spec.

**Blocked by:** af5 (`.scratch/api-features/issues/05-api-feature-map.md`), which sets the path rule and the skill wording for the API.

**Status:** in-review

**Size:** 360 counted lines. The three area files are 68, 70, and 47 lines. The split counts as deletions plus new files. Recount with `git diff --numstat`. If that would pass 400, land web first and leave studio and ui for a second slice before editing them.

**Shared files:**

- `.cursor/skills/plan/SKILL.md`
- `.cursor/skills/verify/SKILL.md`
- `docs/feature-map.md`
- `docs/feature-map/studio.md`
- `docs/feature-map/ui.md`
- `docs/feature-map/web.md`

## Scope

In: `docs/feature-map/<area>/<id>.md` for each id in the studio, web, and ui area files. Each area file becomes the same kind of pointer af5 left for the API. The plan skill and the verify skill name the id file for every area. `docs/feature-map.md` keeps the four area rows.

Out: API id files, already split in af5. No route or screen changes.

## Order

Plan is this note. Architect is ADR-007. Develop. May run with af3 and af4. Daniel squash-merges. af1 has already set ADR-007 to Accepted. This slice does not edit that line.

## Acceptance

- [x] Every studio, web, and ui id has `docs/feature-map/<area>/<id>.md` with the same entry points as today.
- [x] The three area files have no index table.
- [x] A ticket for a new studio screen is told to add a new id file and to leave `studio.md` alone.

## Verification

`not applicable (no runtime change)`.

## Architect

Yes. Same path rule as af5. No CLI parser.

### Seams

- The id file path for one studio id, one web id, and one ui id. Catches an area left as a single growing file.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/44
