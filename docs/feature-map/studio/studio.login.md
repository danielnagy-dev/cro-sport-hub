# studio.login: Login and auth guard

| App    | Status | Entry point (user POV)        | Verify                 | Since        |
| ------ | ------ | ----------------------------- | ---------------------- | ------------ |
| studio | live   | `http://localhost:4200/login` | `vp run verify:studio` | plan item 22 |

`/login` posts `{ id, password }` to `POST /api/login` and stores the JWT for the browser tab. Log out is in the studio header. An editor or an admin can open `/`. `adminGuard` allows only an admin and is not attached to a page yet. A guest or an expired token lands on `/login`. The form labels User id and Password and announces errors. The studio reads `sub`, `role`, and `exp` and does not check the signature.

#### How to get to it (user POV)

- Open `http://localhost:4200/login`, or open `/` with no session.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`. The home list is still the stub (`studio.shell`).

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker. The API is not required to render the form.

- **Open login.** `vp run verify:studio`. The check `Login` is `pass`. `main` contains `Log in`. A 401, a bad id, and a stored session are the studio unit tests.

#### Gotchas

- Demo passwords and `JWT_SECRET` stay in the environment. The page does not display them.
