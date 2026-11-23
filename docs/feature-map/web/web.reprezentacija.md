# web.reprezentacija: Reprezentacija schedule (stub)

| App | Status | Entry point (user POV) | Verify                                      | Since |
| --- | ------ | ---------------------- | ------------------------------------------- | ----- |
| web | stub   | `/reprezentacija`      | `vp run verify:web --route /reprezentacija` | #347  |

Empty App Router stub so the public nav target returns HTTP 200 with the shared shell. Schedule content lands in a sibling ticket.

#### How to get to it (user POV)

- Choose **Reprezentacija** in the header, or open `http://localhost:3000/reprezentacija`.

#### Driving it with verify

- `vp run verify:web --route /reprezentacija` — `main` with heading `Reprezentacija`.
