# Context Brief: mvp-test-factory (password-strength-checker)

Generated 2026-10-12 by context-collector (read-only). Repo: `/Users/kangs/code/github/password-strength-checker`. Branch `main`, HEAD `325ce84` ("updated with screenshots"), parent `f736b90`.

## Context Summary

### Target
Type: module (whole MVP) | Identifier: password-strength-checker | Repository: `/Users/kangs/code/github/password-strength-checker`

---

## 1. Source Map

Every source file (excludes `node_modules/`, `.git/`, `.claude/`, `test-results/`, `docs/`, images).

| File | Purpose |
|---|---|
| `server/src/app.ts` | Express entry. Reads `PORT` (default 3000), mounts `cors()`, `express.json()`, `express.static(../../client)`, router at `/api`. Calls `app.listen` at module load. Default-exports `app`. |
| `server/src/routes/index.ts` | Router: `POST /check-password`, `GET /status`, `GET /health`. |
| `server/src/controllers/passwordController.ts` | `checkPassword` (type-checks `password`, returns 400 or evaluation), `getStatus`, `getHealth`. |
| `server/src/services/evaluator.ts` | `evaluatePassword(password)`: pure function returning `{score, strength, color, suggestions}`. Exports `EvaluationResult`. |
| `client/index.html` | Single-file page: inline CSS and JS, Bootstrap 5.3.3 from CDN, no build step. |

Build output (gitignored, not source): `server/dist/{app,routes/index,controllers/passwordController,services/evaluator}.js`, plus `server/dist/controllers/passwordController.test.js` and `server/dist/services/evaluator.test.js` (see Section 3).

---

## 2. Dependency Manifests

**Package manager: npm.** Lockfile: `server/package-lock.json` (lockfileVersion 3). No yarn/pnpm lock anywhere.

**Root `package.json`** (`password-strength-checker` 1.0.0): no dependencies, no devDependencies. Scripts only: `install:server` (`cd server && npm install`), `start` (`cd server && npm start`), `dev` (`cd server && npm run dev`).

**`server/package.json`** (`password-strength-checker-server` 1.0.0, `main: dist/app.js`)

Scripts: `start` = `ts-node src/app.ts`; `dev` = `ts-node src/app.ts`; `build` = `tsc`. No `test` script.

| Kind | Package | Declared | Locked |
|---|---|---|---|
| dep | `express` | ^4.19.2 | 4.22.2 |
| dep | `cors` | ^2.8.5 | 2.8.6 |
| devDep | `typescript` | ^5.5.0 | 5.9.3 |
| devDep | `ts-node` | ^10.9.2 | 10.9.2 |
| devDep | `@types/express` | ^4.17.21 | 4.17.25 |
| devDep | `@types/cors` | ^2.8.17 | 2.8.19 |
| devDep | `@types/node` | ^20.14.0 | 20.19.43 |

**Installed but NOT declared** (present in `server/node_modules/.package-lock.json` only; absent from `package.json` and `package-lock.json`; `npm ci` would remove them):
- `jest` 29.7.0, `ts-jest` 29.4.14, `supertest` 7.3.1, `@types/jest` 29.5.14, `@types/supertest` 7.2.1 (plus transitive `babel-jest` and friends)

**Root `node_modules/`** (gitignored, installed Oct 4, no root manifest or lockfile declares it): `playwright` 1.63.0, `@playwright/test` 1.63.0, `playwright-core`. No npm lock at root, so this is not an npm signal by itself, but it indicates Playwright was installed out-of-band.

---

## 3. Existing Test Configuration

**Confirmed: none.** Checked via `find`, excluding `node_modules/` and `.git/`:
- No config files: `jest.config*`, `vitest.config*`, `playwright.config*`, `.mocharc*`, `karma.conf*`, `cypress.config*`, `ava.config*`, `babel.config*`, `.babelrc*`.
- No directories: `__tests__/`, `test/`, `tests/`, `e2e/`, `spec/` (none under `server/`, `client/`, or root).
- No source test files: no `*.test.*`, `*.spec.*`, `*_test.*` outside `node_modules/`.
- No `test` script in any `package.json`.
- `server/src/` contains only the 4 `.ts` files listed in Section 1.

**Orphaned compiled tests (not source, not tracked):** `server/dist/controllers/passwordController.test.js` and `server/dist/services/evaluator.test.js` are jest-style compiled output. `dist/` is gitignored, and `git ls-files server/dist` returns 0 files. No corresponding `.ts` exists in `src/`. `dist/app.js` (Oct 5) is newer than the last `src/app.ts` edit (Jul 17), which suggests the compiled output came from an earlier source state. Jest's default `testMatch` would match `*.test.js` under `dist/`, so a default jest run from `server/` would pick them up. The factory should exclude `dist/` explicitly.

Compiled test inventory (for reference):
- `passwordController.test.js`: `checkPassword` (it.each for missing/non-string password, happy path delegation, weak-password real output, empty string accepted), `getStatus` (ok), `getHealth` (healthy + numeric uptime).
- `evaluator.test.js`: score tiers 0-4 (including "not 4" cases), length boundaries (7, 8, 11, 12), suggestion messages (each category present/absent), edge case empty string.

**Existing CLAUDE.md testing section** states: "No test suite is configured. Manual testing: curl ..."

---

## 4. API Surface

Base: `http://localhost:3000` (override with `PORT` env). CORS: `cors()` with no options, so library default `Access-Control-Allow-Origin: *` on all routes (not header-verified). JSON bodies parsed by `express.json()` (default 100kb limit, strict mode). Unknown routes return Express's default 404 (HTML).

### POST /api/check-password

Request body: `{"password": <value>}`

| Input | Status | Response |
|---|---|---|
| `password` is a string (including `""`) | 200 | evaluation object (below) |
| `password` missing, or non-string (number, null, boolean, array, object) | 400 | `{"error":"password must be a string"}` |
| Malformed JSON | 400 | Express default error page (HTML, not JSON), includes the SyntaxError message and a stack trace with server file paths (observed on live server) |
| Any non-POST method on this path (e.g., GET) | 404 | Express default (observed: `GET /api/check-password` → 404) |

Success response shape (key order as emitted): `{"score", "strength", "color", "suggestions"}`
- `score`: integer 0-4
- `strength`: string label from table below
- `color`: Bootstrap contextual name (`danger|warning|info|success`)
- `suggestions`: array of strings, may be empty

Example (observed): `""` → `{"score":0,"strength":"Very Weak","color":"danger","suggestions":["Use at least 8 characters","Add uppercase letters","Add lowercase letters","Add numbers","Add special characters (e.g. !@#$%)"]}`

**Scoring (code-verified, matches CLAUDE.md table).** Definitions: `len` = JS `.length` (UTF-16 code units). `upper` = `/[A-Z]/`, `lower` = `/[a-z]/`, `digit` = `/[0-9]/`, `special` = `/[^A-Za-z0-9]/` (any non-alphanumeric, including spaces and non-ASCII letters).

| Score | strength | color | Criteria (evaluated in code order; highest matching wins) |
|---|---|---|---|
| 0 | Very Weak | danger | `len < 8` |
| 1 | Weak | danger | `len >= 8` |
| 2 | Fair | warning | `len >= 8` AND (`upper` OR `digit` OR `special`) |
| 3 | Strong | info | `len >= 8` AND `upper` AND `lower` AND `digit` (special not required, 8-11 chars allowed) |
| 4 | Very Strong | success | `len >= 12` AND `upper` AND `lower` AND `digit` AND `special` |

Notes: `lower` alone does not lift score 2 (8+ lowercase-only = score 1). A 12+ char password missing special = score 3.

**Suggestions (order fixed, each independent):**
1. Length: `len < 8` → "Use at least 8 characters"; `8 <= len < 12` → "Use 12 or more characters for better security"; `len >= 12` → none
2. `!upper` → "Add uppercase letters"
3. `!lower` → "Add lowercase letters"
4. `!digit` → "Add numbers"
5. `!special` → "Add special characters (e.g. !@#$%)"

Suggestions do not map 1:1 to score. Example: an 8-11 char password with upper, lower, digit, and special scores 3 and gets only the length suggestion ("Use 12 or more characters for better security"). Empty suggestions implies score 4.

### GET /api/status
200 `{"status":"ok"}`. Ignores body and query.

### GET /api/health
200 `{"status":"healthy","uptime":<number>}`. `uptime` is `process.uptime()` as a float in seconds (observed 1411.6).

### GET /
Not an API route. `express.static` serves `client/index.html` (200, `text/html; charset=UTF-8`).

---

## 5. UI Surface (`client/index.html`)

Served by the Express server at `GET /` (same origin as the API when loaded from localhost:3000). No separate frontend dev server. External CDN dependency: Bootstrap 5.3.3 CSS and bundle JS from `cdn.jsdelivr.net` (network needed; the page's own script does not call Bootstrap JS).

**DOM ids:**
| id | Element | Notes |
|---|---|---|
| `passwordInput` | `<input type="password">` | `autocomplete="new-password"`, placeholder "Enter your password" |
| `toggleBtn` | `<button type="button">` | `aria-label="Toggle password visibility"` |
| `eyeIcon` | inline `<svg>` inside toggleBtn | Not referenced by JS; no behavior |
| `strengthBar` | `div.progress-bar[role=progressbar]` | initial inline `width: 0%`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow=0` |
| `strengthLabel` | `<small>` | initial text `—` |
| `feedbackList` | `<ul>` | populated with `<li>` elements |

**Behavior:**
- **Toggle:** `toggleBtn` click flips `input.type` between `password` and `text`. Icon and aria-label do not change.
- **Input handling:** on `input` event:
  - Empty value → `resetUI()` (bar width `0%`, class `progress-bar`, `aria-valuenow=0`, label `—` with class `fw-semibold text-secondary`, feedback list cleared). No request is made.
  - Non-empty value → `clearTimeout` then a **250 ms debounce**, then `fetch` POST to `API_URL` with `Content-Type: application/json` and body `{"password": value}`.
- **API URL:** hardcoded `const API_URL = 'http://localhost:3000/api/check-password'` (absolute, not relative). Tests on another port need request interception or a client change.
- **Errors:** non-2xx responses and network errors are silently ignored. The UI keeps the last state.
- **Score to bar width** (`widthMap`): `{0:5, 1:25, 2:50, 3:75, 4:100}` → `style.width = N%`, `aria-valuenow = N`.
- **Color map** (`colorMap`): `danger → bar bg-danger / text text-danger`; same pattern for `warning`, `info`, `success`. Bar class becomes `progress-bar bg-<color>`; label class becomes `fw-semibold text-<color>`.
- **Label:** `strengthLabel.textContent = data.strength`.
- **Feedback list:** if `suggestions` is empty → `<li class="text-success">Password looks good!</li>`; otherwise each item → `<li class="text-<color>">• <suggestion></li>`.
- **Known timing edge (from code reading, not run):** the empty-input branch returns before `clearTimeout`. A timer scheduled by a prior non-empty keystroke can still fire up to 250 ms later and repaint the UI with the stale value after the field was cleared.

---

## 6. Runtime Facts

- **Start:** from `server/`: `npm start`, `npm run dev`, or `npx ts-node src/app.ts` (no compile step). Root `npm start` and `npm run dev` delegate to server.
- **Build:** `npm run build` (`tsc`). tsconfig: `strict: true`, `target: ES2020`, `module: commonjs`, `rootDir: ./src`, `outDir: ./dist`, `include: src/**/*`. Compiled entry: `node dist/app.js` (no script defines this).
- **Port:** `Number(process.env.PORT) || 3000`. Startup log: `Server running on http://localhost:<PORT>`.
- **Side effect on import:** `app.ts` calls `app.listen` at module load and default-exports `app`. Any test that imports `app.ts` (e.g., supertest) starts a listener on `PORT`. If that port is busy, the server emits `error` (EADDRINUSE), which is unhandled. Tests should set `PORT` to a free value before import, or the factory should avoid importing `app.ts` directly.
- **Live server on 3000 (pre-existing, do not kill):** PID 94864, `node` listening on `*:3000` (IPv6). Started manually before this session. Read-only probes returned:
  - `GET /` → 200 `text/html`
  - `GET /api/status` → `{"status":"ok"}`
  - `GET /api/health` → `{"status":"healthy","uptime":1411.6...}`
  - POST `{"password":""}` → 200, score 0 "Very Weak"
  - POST `{"password":42}` → 400 `{"error":"password must be a string"}`
  - POST `{}` → 400 same error
  - POST malformed JSON → 400 HTML error page
  - POST `{"password":"Abcdefgh1!xyz"}` (13 chars, all classes) → 200 score 4 "Very Strong", suggestions `[]`
  - `GET /api/check-password` → 404
- **Port 3100:** free at time of check (no listener). Recommended for an isolated test server.

---

## 7. CLAUDE.md Conventions Relevant to Testing

Source: `/Users/kangs/code/github/password-strength-checker/CLAUDE.md`.
- TypeScript strict mode enabled. All types explicit.
- No database. All evaluation in memory.
- No authentication or rate limiting (local dev tool only).
- CORS open (`cors()` with no restrictions).
- Never store or log raw passwords at any point. (Current code logs only the startup line in `app.ts`.) Test output, fixtures, and reports must not include raw passwords.
- Frontend: "plain ES5-compatible JavaScript (no build toolchain)." **Discrepancy:** `client/index.html` uses `const` (lines 61-80). The page is not strictly ES5. Test tooling for client must not add a build step.
- Testing section: "No test suite is configured. Manual testing: curl ..."

---

## 8. Git State

- Branch `main`, HEAD `325ce84`, parent `f736b90` ("Initial commit: password strength checker app").
- `git status`: `?? .claude/`, `?? test-results/` (untracked; do not touch). `test-results/` contains `.last-run.json` (Playwright-style artifact, not inspected).
- `claude-agents-output/` was an empty directory before this brief. It will show as untracked once files are written.
- `.gitignore`: `node_modules/`, `.DS_Store`, `*.log`, `dist/`.
- Per-file history (`git log -10 -- <file>`) not collected. Only 2 commits exist, so history adds nothing beyond the commit list above.

---

## Risks and Constraints for Downstream Agents

1. Stale compiled jest tests under `server/dist/` are picked up by default jest discovery. Exclude `dist/`.
2. jest, ts-jest, supertest, and Playwright are installed but undeclared. A test setup must add them explicitly to `server/package.json` (and root for Playwright) to be reproducible.
3. `app.ts` listens on import. Use a non-3000 `PORT` for any isolated test server (e.g., 3100).
4. `API_URL` is hardcoded to `localhost:3000`. UI e2e against another port needs request interception or a client change.
5. The live server on 3000 must not be stopped, restarted, or reused for writes.
6. Malformed JSON returns an HTML stack trace, not the JSON error shape. Assert on status only, or on the HTML.
