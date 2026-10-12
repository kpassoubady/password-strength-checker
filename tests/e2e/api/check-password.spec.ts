import { test, expect } from '@playwright/test';

/**
 * API E2E tests for POST /api/check-password.
 *
 * Ground truth: server/src/controllers/passwordController.ts and
 * server/src/services/evaluator.ts (see test-charter.md for the full
 * approved contract this file implements).
 *
 * Fixed, synthetic dummy passwords per the charter — do not invent new
 * variants:
 *   - "abc"              -> score 0 (Very Weak)
 *   - "abcdefg1"         -> score 2 (Fair)
 *   - "Abcdefg1"         -> score 3 (Strong)
 *   - "Abcdefgh123!"     -> score 4 (Very Strong)
 *   - ""                 -> score 0 (Very Weak), all 5 suggestions
 *
 * These are placeholder/dummy values only, safe to record in traces or
 * CI logs. No real credentials are used anywhere in this suite.
 */

test.describe('POST /api/check-password — score tiers', () => {
  test('scores a very weak password (score 0) with full response shape', async ({ request }) => {
    const res = await request.post('/api/check-password', {
      data: { password: 'abc' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      score: 0,
      strength: 'Very Weak',
      color: 'danger',
      suggestions: [
        'Use at least 8 characters',
        'Add uppercase letters',
        'Add numbers',
        'Add special characters (e.g. !@#$%)',
      ],
    });
  });

  test('scores a fair password (score 2) with full response shape', async ({ request }) => {
    const res = await request.post('/api/check-password', {
      data: { password: 'abcdefg1' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      score: 2,
      strength: 'Fair',
      color: 'warning',
      suggestions: [
        'Use 12 or more characters for better security',
        'Add uppercase letters',
        'Add special characters (e.g. !@#$%)',
      ],
    });
  });

  test('scores a strong password (score 3) with full response shape', async ({ request }) => {
    const res = await request.post('/api/check-password', {
      data: { password: 'Abcdefg1' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      score: 3,
      strength: 'Strong',
      color: 'info',
      suggestions: [
        'Use 12 or more characters for better security',
        'Add special characters (e.g. !@#$%)',
      ],
    });
  });

  test('scores a very strong password (score 4) with full response shape', async ({ request }) => {
    const res = await request.post('/api/check-password', {
      data: { password: 'Abcdefgh123!' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      score: 4,
      strength: 'Very Strong',
      color: 'success',
      suggestions: [],
    });
  });
});

test.describe('POST /api/check-password — boundary: empty string', () => {
  test('treats empty string password as valid input, scoring 0 with all 5 suggestions', async ({
    request,
  }) => {
    const res = await request.post('/api/check-password', {
      data: { password: '' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      score: 0,
      strength: 'Very Weak',
      color: 'danger',
      suggestions: [
        'Use at least 8 characters',
        'Add uppercase letters',
        'Add lowercase letters',
        'Add numbers',
        'Add special characters (e.g. !@#$%)',
      ],
    });
    expect(body.suggestions).toHaveLength(5);
  });
});

test.describe('POST /api/check-password — validation errors', () => {
  test('missing password field returns 400 with documented error shape', async ({ request }) => {
    const res = await request.post('/api/check-password', {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'password must be a string' });
  });

  test('non-string password (number) returns 400 with documented error shape', async ({
    request,
  }) => {
    const res = await request.post('/api/check-password', {
      data: { password: 12345678 },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'password must be a string' });
  });
});

test.describe('POST /api/check-password — known defect (do not treat as passing behavior)', () => {
  // KNOWN DEFECT (charter section "KNOWN DEFECT — do not encode as expected
  // behavior"): a malformed JSON request body currently returns HTTP 400 but
  // with an HTML page containing a raw Node.js stack trace (absolute
  // filesystem paths) instead of the documented `{ "error": ... }` JSON
  // shape. This is error-detail leakage and a real product defect. Marked
  // fixme so it is visible without asserting the broken behavior as correct.
  test.fixme(
    true,
    'KNOWN DEFECT (test-charter.md): malformed JSON body leaks an HTML stack trace instead of a JSON error response',
  );

  test('malformed JSON body should return a documented JSON error shape, not an HTML stack trace', async ({
    request,
  }) => {
    const res = await request.post('/api/check-password', {
      headers: { 'Content-Type': 'application/json' },
      data: '{bad json',
    });

    // Documented/expected behavior once the defect is fixed:
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: expect.any(String) });
  });
});
