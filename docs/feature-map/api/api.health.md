# api.health: Health check

| App | Status | Entry point (user POV) | Verify              | Since                                             |
| --- | ------ | ---------------------- | ------------------- | ------------------------------------------------- |
| api | live   | `GET /health`          | `vp run verify:api` | plan items for the API skeleton (formerly GH #35) |

`GET /health` reports whether the API process can reach local Postgres and Redis. The body has `status` (`ok` or `error`), `postgres`, `redis`, and the linked package ids. HTTP 200 means both dependencies are up. HTTP 503 means the process is up and a dependency is not.

#### Sub-features

- `api.health-ok` returns HTTP 200 and `"status": "ok"` when Compose is up.
- `api.health-down` returns HTTP 503 when Postgres or Redis is down. That is a failed verify run, not a pass.

#### How to get to it (user POV)

- Request `GET http://localhost:3001/health`.

#### Driving it with verify

Preconditions:

- `vp run verify:doctor` reports Docker running.
- Compose services `postgres` and `redis` are healthy, or the run may start them and must stop them afterwards.
- No root `.env`, or `.env` matches the Compose user, database, and password.

- **Read health.** Run `vp run verify:api`. The `GET /health` row is `pass`, and `health.json` has `"status": "ok"`.

#### Gotchas

- A root `.env` whose `DATABASE_URL` password does not match `POSTGRES_PASSWORD` in `docker-compose.yml` makes `/health` return 503. The run fails on purpose. Do not skip the status check.
- The CLI stops only the Compose services it started.
