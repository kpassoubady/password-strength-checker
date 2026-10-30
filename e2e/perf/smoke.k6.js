// Local k6 smoke gate for the password strength checker API.
// Small, bounded load (max 3 VUs, ~10s). The thresholds are local smoke
// safeguards only; they make NO claim about production capacity.
//
// Run via `npm run test:perf` (starts/stops the server), or directly:
//   BASE_URL=http://localhost:3000 k6 run e2e/perf/smoke.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Fixed, obviously fake inputs. Never logged.
const FAKE_PASSWORDS = ['abc', 'Fake1pass', 'Fake-Pass#2026-xyz'];

export const options = {
  scenarios: {
    smoke: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2s', target: 3 },
        { duration: '6s', target: 3 },
        { duration: '2s', target: 0 },
      ],
      gracefulRampDown: '2s',
      gracefulStop: '3s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

function jsonBody(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

export default function () {
  const password = FAKE_PASSWORDS[(__VU + __ITER) % FAKE_PASSWORDS.length];

  const checkRes = http.post(
    `${BASE_URL}/api/check-password`,
    JSON.stringify({ password: password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /api/check-password' } }
  );
  const body = jsonBody(checkRes);
  check(checkRes, {
    'check-password: status 200': (r) => r.status === 200,
    'check-password: score is integer 0-4': () =>
      body !== null && Number.isInteger(body.score) && body.score >= 0 && body.score <= 4,
    'check-password: strength is string': () =>
      body !== null && typeof body.strength === 'string' && body.strength.length > 0,
  });

  const statusRes = http.get(`${BASE_URL}/api/status`, { tags: { name: 'GET /api/status' } });
  const statusBody = jsonBody(statusRes);
  check(statusRes, {
    'status: 200': (r) => r.status === 200,
    'status: body.status is ok': () => statusBody !== null && statusBody.status === 'ok',
  });

  const healthRes = http.get(`${BASE_URL}/api/health`, { tags: { name: 'GET /api/health' } });
  const healthBody = jsonBody(healthRes);
  check(healthRes, {
    'health: 200': (r) => r.status === 200,
    'health: status is healthy and uptime is number': () =>
      healthBody !== null && healthBody.status === 'healthy' && typeof healthBody.uptime === 'number',
  });

  sleep(0.1 + Math.random() * 0.2);
}
