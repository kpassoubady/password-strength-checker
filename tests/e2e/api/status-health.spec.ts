import { test, expect } from '@playwright/test';

/**
 * API E2E tests for the two liveness endpoints.
 * Ground truth: server/src/controllers/passwordController.ts (getStatus,
 * getHealth) and test-charter.md.
 */

test.describe('GET /api/status', () => {
  test('returns exact ok status shape', async ({ request }) => {
    const res = await request.get('/api/status');

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });
});

test.describe('GET /api/health', () => {
  test('returns healthy status with a numeric uptime', async ({ request }) => {
    const res = await request.get('/api/health');

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('uptime');
    expect(typeof body.uptime).toBe('number');
  });
});
