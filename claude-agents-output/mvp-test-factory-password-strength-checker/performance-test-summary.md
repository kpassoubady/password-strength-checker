# Performance Test Summary — password-strength-checker

## Files created

- `tests/performance/smoke.js` — k6 smoke test script
- `tests/performance/README.md` — run instructions and prerequisites

No other files were created or modified. No lifecycle wrapper (Node spawn/
poll/kill script) was added: the charter's targeted command for this stage
is a direct `k6 run tests/performance/smoke.js` against a server the
orchestrator/quality-gate-runner is responsible for starting and probing in
Phase 8 (per charter's shared runtime rule and targeted-commands list). No
safe-start-command ambiguity existed that required one.

## Profile and thresholds

Matches the approved charter exactly, no deviation:

- Scenario: single scenario, constant VUs = 5, duration = 15s (bounded
  smoke — no ramping/stress/spike/soak stages).
- Endpoint: `POST http://localhost:3000/api/check-password`
- Fixed dummy input: `{"password":"Abcdefg1"}` (reused exactly from charter;
  expected `score: 3`, `strength: "Strong"`, `color: "info"`). No real or
  sensitive credential is used or exists in this app (no auth).
- Checks per request: HTTP status 200; response has numeric `score`, string
  `strength`, string `color`, array `suggestions`; and the fixed input's
  score/strength/color match the exact expected values (correctness check
  during load, not just a liveness ping).
- Thresholds:
  - `http_req_failed`: rate < 1%
  - `http_req_duration`: p(95) < 300ms
- All thresholds and the profile are labeled in-script and in the README as
  **local smoke safeguards**, explicitly not production capacity/SLA claims.

## Charter ambiguity

None encountered. The charter's suggested profile (VUs=5, 15s) and
thresholds (`http_req_failed` rate < 1%, `http_req_duration` p95 < 300ms)
were used verbatim — no numbers were loosened or tightened.

## Execution status

Not executed. Per `allow_runtime_execution: false` for this authoring phase,
the script was authored and reviewed by eye only; it was never run against
the live server (three workers would otherwise share the same port-3000
instance concurrently). No dry-run was attempted either, since k6 has no
no-op/lint-only mode that avoids a real network call. Real execution is
deferred to the orchestrated Phase 8 quality-gate-runner stage, run
sequentially after the API and UI E2E stages, via:

```
k6 run tests/performance/smoke.js
```

No metrics are available yet since the test has not been run.

## Limitations

- Thresholds are local-machine smoke safeguards only; they say nothing about
  production capacity, concurrency limits, or behavior under realistic
  production traffic shapes.
- The 300ms p(95) duration threshold is generous for a trivial in-memory
  regex evaluation on localhost; if a real run shows it is unrealistic
  (e.g. due to local machine contention), that should be reported with
  actual observed numbers in Phase 8 rather than silently loosened here.
- Only one endpoint (`POST /api/check-password`) is covered, per charter
  scope; `/api/status` and `/api/health` are not load-tested.
