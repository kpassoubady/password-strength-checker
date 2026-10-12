# Performance smoke test

Local k6 smoke gate for `POST /api/check-password`. This is an MVP smoke
check, not a load/stress/soak/spike/capacity test, and its thresholds are
local safeguards only — they make no production capacity claim.

## Prerequisites

- The real Express server must already be running and healthy at
  `http://localhost:3000` (e.g. `cd server && npm start`).
- Verify readiness first: `curl http://localhost:3000/api/health` should
  return `{"status":"healthy","uptime":<number>}` with HTTP 200.
- Do not run this concurrently with the Playwright API/UI suites against the
  same server instance.

## Run

```bash
k6 run tests/performance/smoke.js
```

## Profile

- Constant 5 virtual users for 15 seconds (bounded smoke, no ramping).
- Fixed dummy input `{"password":"Abcdefg1"}` (score 3 / Strong / info) —
  reused exactly from the approved test charter. No real credentials are
  used or needed; this app has no authentication.

## Thresholds (local smoke safeguards, not production SLAs)

- `http_req_failed`: rate < 1%
- `http_req_duration`: p(95) < 300ms
- `checks`: rate == 1 (every `check()` assertion must pass, including the
  status/shape checks and the score/strength/color correctness checks for
  the fixed dummy input — a correctness regression fails the gate, not just
  latency/error-rate)

If any threshold fails, k6 exits non-zero. Do not loosen these to force a
pass — report the real observed numbers instead.
