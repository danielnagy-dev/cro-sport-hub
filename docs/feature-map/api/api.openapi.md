# api.openapi: OpenAPI docs

| App | Status | Entry point (user POV)       | Verify              | Since                                             |
| --- | ------ | ---------------------------- | ------------------- | ------------------------------------------------- |
| api | live   | `http://localhost:3001/docs` | `vp run verify:api` | plan items for the API skeleton (formerly GH #35) |

Swagger UI at `/docs` describes the API. The machine-readable document is `/docs-json` and includes a top-level `openapi` field. The title in the UI is `Cro Sport Hub API`.

#### Sub-features

- `api.openapi-json` serves the document at `GET /docs-json`.
- `api.openapi-ui` renders Swagger UI at `/docs`.

#### How to get to it (user POV)

- Open `http://localhost:3001/docs`.
- Request `GET http://localhost:3001/docs-json`.

#### Driving it with verify

Preconditions: same as `api.health`.

- **Document.** Run `vp run verify:api`. `GET /docs-json` is `pass` and `openapi.json` contains `"openapi"`.
- **UI.** The same run screenshots `/docs` and requires the text `Cro Sport Hub API`.

#### Gotchas

- There is no global prefix. The paths are `/docs` and `/docs-json`, not `/api/docs`.
