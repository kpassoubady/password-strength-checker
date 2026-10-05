/**
 * k6 SMOKE test for the password-strength-checker API.
 *
 * Scope: local correctness + basic latency smoke gate ONLY.
 * This is explicitly NOT a load, stress, soak, or capacity test, and the
 * thresholds below are LOCAL SMOKE SAFEGUARDS calibrated on a developer
 * machine running the app in-process via ts-node. They make no production
 * capacity claim and should not be read as an SLO.
 *
 * Target endpoints (public, no auth):
 *   - GET  /api/health          (warm-up / liveness)
 *   - POST /api/check-password  (primary workload: in-memory scoring, no I/O)
 *
 * Load profile: fixed, small, short-lived.
 *   - 8 virtual users
 *   - 20 second duration
 *   - No ramp-up/ramp-down stages, no spike/soak phases.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 8,
  duration: '20s',
  thresholds: {
    // Local smoke safeguard, not a production SLO.
    http_req_failed: ['rate<0.01'],
    // Local smoke safeguard, not a production SLO.
    // Generous bound for a pure in-memory regex computation on a dev machine.
    http_req_duration: ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Fixed, named dummy inputs only. None of these are real credentials.
const PASSWORD_PAYLOADS = [
  { label: 'empty', password: '' },
  { label: 'short-weak', password: 'abc123' },
  { label: 'long-strong', password: 'Tr0ub4dor&3-Zebra-Canyon-99!' },
];

function checkPasswordRequest() {
  const sample = PASSWORD_PAYLOADS[Math.floor(Math.random() * PASSWORD_PAYLOADS.length)];
  const res = http.post(
    `${BASE_URL}/api/check-password`,
    JSON.stringify({ password: sample.password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'check-password', input: sample.label } }
  );

  check(res, {
    'check-password: status is 200': (r) => r.status === 200,
    'check-password: has numeric score': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && typeof body.score === 'number';
    },
    'check-password: has strength string': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && typeof body.strength === 'string';
    },
    'check-password: has suggestions array': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && Array.isArray(body.suggestions);
    },
    'check-password: has color string': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && typeof body.color === 'string';
    },
  });
}

function healthRequest() {
  const res = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: 'health' } });

  check(res, {
    'health: status is 200': (r) => r.status === 200,
    'health: status field is healthy': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && body.status === 'healthy';
    },
    'health: uptime is numeric': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return !!body && typeof body.uptime === 'number';
    },
  });
}

export default function () {
  // Primary workload most of the time, occasional health check.
  if (Math.random() < 0.8) {
    checkPasswordRequest();
  } else {
    healthRequest();
  }
  sleep(1);
}
