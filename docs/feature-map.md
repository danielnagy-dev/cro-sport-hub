# Feature map

What exists, who uses it, and how to reach and verify it. The entries are the area files below. The verify skill (`.cursor/skills/verify/SKILL.md`) reads this index, then the area file.

Status: `live` (merged and verifiable) · `planned` (in the PR plan, not built).

## Baseline preconditions

- Run from the repo root on Node 24.22.1. `vp install`, then `vp exec playwright install chromium` once.
- API needs Docker Compose services `postgres` and `redis` (`docker-compose.yml`).
- Data: seed and test data only. No real people. The studio match list is an in-app stub. Login calls `POST /api/login`.

## Driving conventions

- Start from the baseline. `vp run verify:doctor` first.
- Prefer ARIA roles and accessible names over CSS selectors.
- One verify command starts and stops its own server. Do not drive a shared server unless you pass `--url`, and then the report must say `"reused": true`.
- Record the feature ID and the entry point with the evidence.
- Do not report a skipped entry point as verified through a different path.

## Areas

| Area   | File                         | Ids        |
| ------ | ---------------------------- | ---------- |
| api    | `docs/feature-map/api.md`    | `api.*`    |
| ui     | `docs/feature-map/ui.md`     | `ui.*`     |
| studio | `docs/feature-map/studio.md` | `studio.*` |
| web    | `docs/feature-map/web.md`    | `web.*`    |

A PR adds its entry to the area file it touches, not the index.
