# Performance Smoke Gate Summary

## Scope

Local smoke gate only. This is **not** a load, stress, soak, or capacity
test, and the thresholds below are **local smoke safeguards** calibrated on
one developer machine running the app in-process via `ts-node`. They make no
production capacity claim.

## Files

- `performance/smoke.js` — k6 smoke script.
- `performance/run-smoke.js` — Node lifecycle wrapper (chosen over a shell
  script for cross-platform portability, since this is a Node project).
- Root `package.json` — added one new script key, `test:perf:smoke`, no
  other changes (devDependencies and `test:e2e:ui` untouched).

## Profile

- 8 virtual users, fixed, no ramp stages.
- 20 second fixed duration.
- Workload mix per iteration (1s sleep between iterations): ~80% `POST
  /api/check-password`, ~20% `GET /api/health`.
- Fixed, named dummy password payloads only (`empty`, `short-weak`,
  `long-strong`) — no real credentials, nothing secret-shaped logged.

## Checks

- `check-password`: status 200, numeric `score`, string `strength`, array
  `suggestions`, string `color`.
- `health`: status 200, `status === 'healthy'`, numeric `uptime`.
- All body-parsing checks guard on `r.status === 200` first, so a failed
  request degrades to a normal check failure instead of a k6 script
  exception.

## Thresholds (local smoke safeguards, not SLOs)

- `http_req_duration`: `p(95) < 200ms`
- `http_req_failed`: `rate < 1%`

## Lifecycle wrapper behavior

`performance/run-smoke.js`:
1. Spawns `npm start` in `server/` with `PORT=3000` as its own child process.
2. Polls `GET /api/health` up to a 15s deadline (500ms interval) before
   proceeding.
3. Runs `k6 run performance/smoke.js` with `BASE_URL` set, inheriting stdio.
4. Captures k6's exit code.
5. Terminates only the server child process it spawned (`SIGTERM`), on
   success, failure, or `SIGINT`/`SIGTERM` interruption of the wrapper
   itself.
6. Exits with k6's exit code.

## Command to run the gate

```bash
npm run test:perf:smoke
# equivalent to:
node performance/run-smoke.js
```

## Real execution result (2026-10-04)

First attempt hit `EADDRINUSE` on port 3000 from a leftover process (not an
unrelated service — traced to an orphaned process from an earlier
interrupted attempt in this same session); it had already exited by the
time it was investigated, and the port was confirmed free before re-running.
That same run also exposed a script bug (check callbacks called `r.json()`
before checking `r.status`, causing k6 script exceptions instead of clean
check failures on connection failures) — fixed by guarding every body-read
check on `r.status === 200` first.

Second (clean) run, full lifecycle, real k6 output:

```
THRESHOLDS
  http_req_duration
  ✓ 'p(95)<200' p(95)=6.13ms
  http_req_failed
  ✓ 'rate<0.01' rate=0.00%

TOTAL RESULTS
  checks_total.......: 730     36.358877/s
  checks_succeeded...: 100.00% 730 out of 730
  checks_failed......: 0.00%   0 out of 730

  HTTP
  http_req_duration: avg=3.03ms min=162µs med=2.53ms max=7.41ms p(90)=5.77ms p(95)=6.13ms
  http_req_failed:   0.00% (0 out of 160)
  http_reqs:         160 (7.969069/s)

  iterations: 160, vus=8 (constant)
```

- Requests: 160 total, 0 failed.
- p95 latency: 6.13ms (threshold: <200ms) — PASS.
- Error rate: 0.00% (threshold: <1%) — PASS.
- All 8 check types: 100% pass (730/730 individual check assertions).
- Wrapper exit code: 0 (propagated from k6).
- Server process (pid confirmed in log) was terminated by the wrapper after
  the run; port 3000 and the process list were verified clean afterward.

Thresholds were left as originally written (200ms p95, 1% error rate) —
measured p95 (6.13ms) was far under the bound, so no loosening was needed
and no real performance problem was observed.

## Limitations

- Single-machine, single-run measurement; no statistical confidence interval
  across multiple runs.
- `ts-node` (unCompiled TypeScript) startup/runtime overhead, not a built
  `tsc` artifact — real production deployments may differ.
- No concurrent client-side network latency (localhost only).
- Does not exercise the static client assets or any downstream dependency
  beyond the in-memory password evaluator.
- Not run alongside or interleaved with functional/e2e suites, per
  instructions; must be explicitly authorized by the orchestrator before
  running in any shared environment.
