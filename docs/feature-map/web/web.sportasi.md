# web.sportasi: Sportaši index (stub)

| App | Status | Entry point (user POV) | Verify                                | Since |
| --- | ------ | ---------------------- | ------------------------------------- | ----- |
| web | stub   | `/sportasi`            | `vp run verify:web --route /sportasi` | #347  |

Empty App Router stub so the public nav target returns HTTP 200 with the shared shell. Index content lands in a sibling ticket.

#### How to get to it (user POV)

- Choose **Sportaši** in the header, or open `http://localhost:3000/sportasi`.

#### Driving it with verify

- `vp run verify:web --route /sportasi` — `main` with heading `Sportaši`.
