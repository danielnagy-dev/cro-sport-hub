# af5: One feature-map file per API id

**What to build:** Each API feature id has its own file. `docs/feature-map/api.md` no longer grows a row or a section when a feature is added. ADR-007 is the spec.

**Blocked by:** Pull requests #32, #33, #35, and #36. #32, #33, and #36 append to `docs/feature-map/api.md`. #35 and #36 are plan item 14a. #29 and #30 have merged.

**Status:** ready-for-agent

**Size:** 340 counted lines. `docs/feature-map/api.md` is 146 lines; the split counts as deletions plus the new files, plus a short skill edit. Recount with `git diff --numstat`. If that would pass 400, move half the ids in a follow-up before editing the rest.

**Shared files:**

- `.cursor/skills/plan/SKILL.md`
- `.cursor/skills/verify/SKILL.md`
- `docs/feature-map.md`
- `docs/feature-map/api.md`

## Scope

In: `docs/feature-map/api/<id>.md` for each id now in the area file, holding the prose that id has today. `docs/feature-map/api.md` becomes a short pointer: one file per id, the file name is `<id>.md`. `docs/feature-map.md` still lists the API area. The verify skill and the plan skill say an API entry is that id file. Studio, web, and ui stay in their area files until af6. The skill sentence says so.

Out: behaviour, routes, and the other area files.

## Order

Plan is this note. Architect is ADR-007. Develop. May run with af1 and af2. af6 starts when this has merged. Daniel squash-merges.

## Acceptance

- [ ] Every id that `docs/feature-map/api.md` lists at the start has a file `docs/feature-map/api/<id>.md` with the same entry points and gotchas.
- [ ] `docs/feature-map/api.md` has no index table and no per-id section.
- [ ] The plan skill tells the next API ticket to add `docs/feature-map/api/<id>.md` and to leave the area file alone.

## Verification

`not applicable (no runtime change)`.

## Architect

Yes. The path shape is ADR-007. No new reader in `tools/verify`: the CLI does not parse the map.

### Seams

- The id file path. Catches an id whose prose stayed in `api.md`, which is how two features would keep editing one file.
