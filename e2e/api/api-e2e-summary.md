# API E2E Summary

## Scope

Files created (all under `e2e/api/`, the exclusive scope for this task):

- `e2e/api/check-password.test.ts` — the test suite (13 tests)
- `e2e/api/server-lifecycle.ts` — spawns/tears down a real server process for the suite
- `e2e/api/jest.config.js` — self-contained Jest config scoped to `e2e/api/**/*.test.ts`
- `e2e/api/tsconfig.json` — self-contained TS config for the suite
- `e2e/api/api-e2e-summary.md` — this file

No files outside `e2e/api/` were created or modified. `server/`, `client/`, `e2e/ui/`, `playwright.config.ts`, and all `package.json`/lockfiles were left untouched.

## How the server is started/stopped

`server/src/app.ts` calls `app.listen()` at import time and has no app-factory export, so importing it in-process risks a double-listen/port clash with any server a human or parallel agent already has running on port 3000.

Instead, `server-lifecycle.ts`:
- Spawns `node node_modules/.bin/ts-node src/app.ts` as a child process with `cwd: server/`, setting `PORT=3099` (overridable via `API_E2E_PORT`) to stay isolated from the default port 3000 used by Playwright's UI webServer.
- Polls `GET /api/health` (via global `fetch`, Node 22) until it responds `ok`, or times out after 20s.
- On teardown, sends `SIGTERM` and waits for the `exit` event, with a 5s `SIGKILL` fallback (timeout is cleared on normal exit, verified no open-handle warnings).

Verified after a full run: port 3099 is free and no `ts-node src/app.ts` process remains once the suite finishes.

## Why a separate Jest config instead of reusing `server/jest.config.js`

`server/jest.config.js` has `testMatch: ['<rootDir>/src/**/*.test.ts']` and `rootDir: server`, so it would not pick up tests under `e2e/api/` without modification — and modifying it would mean touching shared config owned by another workstream. Instead, `e2e/api/jest.config.js` is fully self-contained:
- `rootDir` points at the repo root, `testMatch` restricted to `e2e/api/**/*.test.ts`.
- `moduleDirectories: ['node_modules', 'server/node_modules']` resolves `supertest`/`jest`/`ts-jest` from the server's existing `devDependencies` (supertest 7.3.1) without adding any new manifest, lockfile, or `node_modules` under `e2e/api/`.
- `ts-jest` is referenced by absolute path (resolved from `server/node_modules`) since Jest's `preset` loader does not honor `moduleDirectories`.

No new dependencies were installed; no `package.json` or lockfile anywhere in the repo was touched.

## Run command (no shared command exists yet for this path)

```bash
./server/node_modules/.bin/jest --config e2e/api/jest.config.js --runInBand
```

(`--runInBand` avoids spinning up multiple server instances in parallel workers; the suite only has one test file so this has no effect on coverage, only on avoiding redundant server boots if more files are added later.)

No `targeted_command` was supplied for this run; the above was used for actual execution. If the orchestrator wants a named script (e.g. `npm run test:e2e:api`), that would require a `package.json` edit, which is outside this task's exclusive scope — flagging as a follow-up for whichever agent owns manifests.

## Scenarios covered (13 tests, all passing against the real running server)

**POST /api/check-password**
- 200, full response shape, score 4 / "Very Strong" for a strong synthetic password covering all character classes and length >= 12
- 200, score 0 / "Very Weak" for a short, single-class password (`abc`), suggestion list includes "Use at least 8 characters"
- 200, score 0 for an empty string password (verified against actual evaluator behavior per `evaluator.ts`, not assumed)
- 200, score 2 / "Fair" for a password with only lowercase + digits (missing uppercase and special), suggestions include the two missing-class messages
- 200, score 4 for a very long (204-char) password covering all character classes
- 400 `{ error: 'password must be a string' }` for: missing field, number, null, array, boolean, object

**GET /api/status**
- 200 `{ status: 'ok' }`

**GET /api/health**
- 200, `status: 'healthy'`, `uptime` is a non-negative number

All expected scores/strengths/suggestions were derived by reading `server/src/services/evaluator.ts` logic directly, not guessed.

## Command status (real execution, authorized by task instructions)

```
PASS e2e/api/check-password.test.ts
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Time:        ~1.3s
```

Verified stable across two consecutive runs plus a `--detectOpenHandles` run (clean, zero lingering handles after fixing a timer-cleanup bug in `server-lifecycle.ts`'s teardown path). No mocking anywhere — every request hits the real Express app via a real spawned server process.

## Assumptions

- No `targeted_command` or distinct `output_path` was supplied separately from the repo path; this summary was written to `e2e/api/` (within the exclusive scope), mirroring the sibling UI agent's placement of `e2e/ui/ui-e2e-summary.md`.
- Port 3099 was chosen for isolation from the default port 3000 (used by Playwright's `webServer` for UI tests); override via `API_E2E_PORT` env var if 3099 is ever in use.
- `node_modules` state in `server/` was not modified; this suite purely re-reads what the server's own `devDependencies` already provide (jest 29.7.0, ts-jest, supertest 7.3.1, ts-node).

## Mismatches / defects found

None. All observed behavior (status codes, response shapes, scores, suggestions, uptime type) matched the documented contract and the evaluator's actual logic exactly. No product defects to report.

## Risks

- This suite's Jest config is independent of `server/jest.config.js` by design (to stay within scope), so if `server/package.json` test script changes shape later, this suite's invocation command is unaffected but also won't be auto-discovered by `npm test` at the server level — it needs its own invocation, currently only documented here pending a shared script decision.
- The suite spawns a real `ts-node` process per run (~1-2s health-check startup); this is slightly slower than an in-process supertest/app import, but was the safer tradeoff given `app.ts`'s listen-at-import-time quirk and the risk of colliding with a concurrently running dev/Playwright server on port 3000.
