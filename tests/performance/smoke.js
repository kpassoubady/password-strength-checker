/**
 * k6 LOCAL SMOKE TEST — password-strength-checker
 *
 * Scope: this is a bounded, fast, CI-friendly SMOKE GATE, not a load/stress/
 * soak/spike/capacity test. It exists to catch obvious regressions in basic
 * responsiveness and correctness under a trivial amount of concurrent traffic
 * on a local dev machine. The thresholds below are LOCAL SMOKE SAFEGUARDS
 * only — they make no production capacity claim and must not be cited as
 * evidence of production performance.
 *
 * Target: http://localhost:3000 ONLY (the real Express app, started manually
 * or via `cd server && npm start`). Never point this at a remote host.
 *
 * Endpoint under test: POST /api/check-password
 * Fixed dummy input (per approved test charter, do not invent new values):
 *   { "password": "Abcdefg1" }  -> expected { score: 3, strength: "Strong",
 *   color: "info", suggestions: [...] }
 * This is not a credential of any kind — the app has no authentication.
 *
 * Run:
 *   k6 run tests/performance/smoke.js
 *
 * Prerequisites:
 *   - The server must already be running and healthy at
 *     http://localhost:3000 (GET /api/health -> 200 {"status":"healthy",...}).
 *   - Do not run this concurrently with the Playwright API/UI suites against
 *     the same server instance; run performance only in its own orchestrated
 *     stage.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// Bounded smoke profile: constant 5 virtual users for 15 seconds. No ramping,
// no stress/spike stages — intentionally small per the approved charter.
export const options = {
  vus: 5,
  duration: '15s',
  thresholds: {
    // LOCAL SMOKE SAFEGUARD (not a production SLA): error rate must stay
    // under 1% across the whole run.
    http_req_failed: ['rate<0.01'],
    // LOCAL SMOKE SAFEGUARD (not a production SLA): 95th percentile latency
    // under 300ms. Generous for a trivial in-memory regex evaluation on
    // localhost; report actual observed p(95) regardless of pass/fail.
    http_req_duration: ['p(95)<300'],
    // LOCAL SMOKE SAFEGUARD (not a production SLA): every check() assertion
    // below (status, response shape, and score/strength/color correctness
    // for the fixed dummy input) must pass. Any failure here indicates a
    // real correctness regression, not noise, so k6 must exit non-zero.
    checks: ['rate==1'],
  },
};

const BASE_URL = 'http://localhost:3000';

// Fixed, named dummy input only — reused exactly from the approved charter.
// No secrets, no real credentials (this app has no authentication).
const DUMMY_PASSWORD = 'Abcdefg1';
const EXPECTED_SCORE = 3;
const EXPECTED_STRENGTH = 'Strong';
const EXPECTED_COLOR = 'info';

export default function () {
  const payload = JSON.stringify({ password: DUMMY_PASSWORD });
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}/api/check-password`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has numeric score field': (r) => {
      try {
        const body = r.json();
        return typeof body.score === 'number';
      } catch (e) {
        return false;
      }
    },
    'response has string strength field': (r) => {
      try {
        const body = r.json();
        return typeof body.strength === 'string';
      } catch (e) {
        return false;
      }
    },
    'response has string color field': (r) => {
      try {
        const body = r.json();
        return typeof body.color === 'string';
      } catch (e) {
        return false;
      }
    },
    'response has suggestions array': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.suggestions);
      } catch (e) {
        return false;
      }
    },
    'score matches expected fixed-input value (3)': (r) => {
      try {
        return r.json().score === EXPECTED_SCORE;
      } catch (e) {
        return false;
      }
    },
    'strength matches expected fixed-input value ("Strong")': (r) => {
      try {
        return r.json().strength === EXPECTED_STRENGTH;
      } catch (e) {
        return false;
      }
    },
    'color matches expected fixed-input value ("info")': (r) => {
      try {
        return r.json().color === EXPECTED_COLOR;
      } catch (e) {
        return false;
      }
    },
  });

  // Small pacing delay so 5 VUs produce a gentle, bounded request rate
  // rather than a tight hot loop — consistent with "smoke", not "stress".
  sleep(1);
}
