# Test Charter — password-strength-checker

Approved base commit: 325ce84 (branch main). This charter binds the three parallel
authoring workers (api-e2e-writer, ui-e2e-writer, performance-test-writer). All
three run against the SAME live server; none of them start a competing instance.

## Shared runtime rule (binding for all three workers)

- The target server is the real Express app: `cd server && npm start` (equivalent
  to `npx ts-node src/app.ts`), listening on **port 3000** (hardcoded — the client's
  `API_URL` in `client/index.html` is hardcoded to `http://localhost:3000`, so no
  other port is usable for UI tests).
- A server may already be running on port 3000 from a prior manual session. Workers
  must NOT attempt to kill or restart it. Playwright's `webServer.reuseExistingServer:
  true` (already configured in root `playwright.config.ts`) handles this: it reuses
  whatever is listening, or starts one if nothing is listening.
- Readiness probe: `GET http://localhost:3000/api/health` must return
  `{"status":"healthy","uptime":<number>}` with HTTP 200.
- During the parallel authoring wave (Phase 7), `allow_runtime_execution: false`:
  workers may do static/syntax checks and read-only discovery but must NOT launch
  the app or run tests that hit a live server concurrently with the other two
  workers, since they would share the same port 3000 instance. Real execution
  happens later, sequentially, in Phase 8 (quality-gate-runner).

## API surface (ground truth, read from source — not assumed)

### POST /api/check-password
- Request body: `{ "password": "<string>" }`
- 200 response shape: `{ score: number (0-4), strength: string, color: string, suggestions: string[] }`
- 400 response (non-string `password`, including missing field): `{ "error": "password must be a string" }`
- Empty string `""` is a VALID input (not rejected) — scores 0, all 5 suggestions present.
- Scoring table (must match exactly):

  | Score | Strength | Color | Criteria |
  |---|---|---|---|
  | 0 | Very Weak | danger | length < 8 |
  | 1 | Weak | danger | length >= 8, no upper/digit/special |
  | 2 | Fair | warning | length >= 8 + at least one of upper/digit/special |
  | 3 | Strong | info | length >= 8 + upper + lower + digit |
  | 4 | Very Strong | success | length >= 12 + upper + lower + digit + special |

### GET /api/status
- 200 response: `{ "status": "ok" }`

### GET /api/health
- 200 response: `{ "status": "healthy", "uptime": <number> }` (uptime varies — assert type/presence, not exact value)

### KNOWN DEFECT — do not encode as expected behavior
- `POST /api/check-password` with a malformed JSON body (e.g. `{bad json`) returns
  HTTP 400 but the body is an **HTML page containing a raw Node.js stack trace**
  with absolute filesystem paths (Express's default error handler; no custom JSON
  error middleware exists in `app.ts`). This is a real product defect (error-detail
  leakage). The API E2E suite must NOT assert this HTML/stack-trace shape as
  correct. Either skip this case entirely, or (preferred) write a test that documents
  the current behavior with a clear comment and an explicit `.fails()`/`test.fixme()`
  annotation referencing this charter section, so it is visible but not a false
  "pass" on broken behavior. This will be called out again in the final report.

## UI surface (ground truth, read from client/index.html)

- Entry route: `GET http://localhost:3000/` (served by Express's `express.static`
  pointed at `../../client` — the real production server serves the real production
  HTML, there is no separate static server to configure).
- Stable selectors (element IDs, safe to use in tests): `#passwordInput`,
  `#toggleBtn`, `#eyeIcon`, `#strengthBar`, `#strengthLabel`, `#feedbackList`.
- User actions and async behavior:
  - Typing into `#passwordInput` triggers a fetch to `/api/check-password` after a
    **250ms debounce**. Tests must wait for the resulting UI update (e.g. Playwright
    `expect(...).toHaveText(...)` auto-retry/polling) rather than a fixed `sleep`.
  - Clearing the input (empty value) resets the UI synchronously via `resetUI()`
    WITHOUT calling the API — `#strengthLabel` becomes `—`, `#strengthBar` width
    resets to `0%`, `#feedbackList` is cleared. This is a fast, non-debounced path;
    do not wait 250ms expecting a fetch here.
  - `#toggleBtn` click toggles `#passwordInput` type attribute between `password`
    and `text`.
  - On a successful response, `#strengthBar` width maps via `{0:5,1:25,2:50,3:75,4:100}`
    percent and gets Bootstrap class `bg-{color}`; `#strengthLabel` text becomes the
    `strength` string with class `text-{color}`; `#feedbackList` renders one `<li>`
    per suggestion, or a single "Password looks good!" item when `suggestions` is empty.
  - KNOWN BEHAVIOR (not necessarily a bug, do not "fix", may document): the debounce
    timer is not cancelled when input is cleared mid-debounce, so a stale API
    response can repaint the UI after a clear. Not required to be tested, but if
    the UI writer wants a regression test for the common/expected path, keep it
    simple: type a value, wait for an update reflecting that value's real evaluation
    results (not a timing race test).

## Fixed dummy data (use exactly these — do not invent new variants)

- Weak: `"abc"` → score 0
- Fair: `"abcdefg1"` → score 2
- Strong: `"Abcdefg1"` → score 3
- Very Strong: `"Abcdefgh123!"` → score 4
- Empty: `""` → score 0, all 5 suggestions present

## Performance profile (k6)

- Target: `http://localhost:3000` (local dev server only — never a remote host).
- Scope: `POST /api/check-password` with a fixed dummy password (`"Abcdefg1"`, reused
  from above — no real/sensitive credentials, ever).
- Profile: local **smoke** test only — this is an MVP demo, not a load-capacity
  exercise. Suggested: constant VUs=5, duration=15s (bounded, fast, CI-friendly).
- Thresholds (must be meaningful, not vacuous):
  - `http_req_failed` rate < 1%
  - `http_req_duration` p(95) < 300ms (generous for a trivial in-memory regex
    evaluation on localhost; tune up only if real local runs show it's unrealistic
    — report actual observed numbers either way, do not silently loosen the
    threshold to force a pass)
- Must NOT target any non-local host. Must NOT use real credentials (there are
  none in this app — no auth exists).

## Allowed / prohibited paths per worker

| Worker | Allowed to write | Prohibited |
|---|---|---|
| api-e2e-writer | `tests/e2e/api/**` | everything else |
| ui-e2e-writer | `tests/e2e/ui/**` | everything else |
| performance-test-writer | `tests/performance/**` | everything else |

All three: production source (`server/src/**`, `client/index.html`), shared config
(`playwright.config.ts`, `server/vitest.config.ts`), manifests/lockfiles, and each
other's test paths are PROHIBITED. A worker that believes it needs a shared-config
change must stop and report back to the orchestrator rather than editing around it.

## Targeted commands (for Phase 8 quality-gate-runner, run in this order)

1. Build: `cd server && npm run build`
2. Unit: `cd server && npm run test:unit`
3. API E2E: `npx playwright test tests/e2e/api`
4. UI E2E: `npx playwright test tests/e2e/ui`
5. Performance: `k6 run tests/performance/smoke.js`

## Handoff fields each worker must report

- Exact file(s) created
- Number of test/scenario cases
- Whether real execution was attempted during authoring (should be "no" per the
  `allow_runtime_execution: false` rule — syntax/discovery checks only)
- Any charter ambiguity encountered
- Any suspected product defect encountered beyond the one already documented above
