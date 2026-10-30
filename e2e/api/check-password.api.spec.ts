import { test, expect, APIRequestContext } from '@playwright/test';

// All passwords below are FAKE, synthetic fixtures. They are never logged.

const ENDPOINT = '/api/check-password';

interface Tier {
  name: string;
  password: string;
  score: number;
  strength: string;
  color: string;
}

const TIERS: Tier[] = [
  // Tier 0: length < 8
  { name: 'tier 0: short lowercase', password: 'abc', score: 0, strength: 'Very Weak', color: 'danger' },
  { name: 'tier 0: 7 chars with every class', password: 'Ab1!xyz', score: 0, strength: 'Very Weak', color: 'danger' },
  // Tier 1: length >= 8, lowercase only
  { name: 'tier 1: lowercase only, 8 chars', password: 'abcdefgh', score: 1, strength: 'Weak', color: 'danger' },
  { name: 'tier 1: lowercase only, long', password: 'fakelowercasepassphrase', score: 1, strength: 'Weak', color: 'danger' },
  // Tier 2: length >= 8 + some (not all) classes
  { name: 'tier 2: digits only', password: '12345678', score: 2, strength: 'Fair', color: 'warning' },
  { name: 'tier 2: upper + lower, no digit', password: 'Abcdefgh', score: 2, strength: 'Fair', color: 'warning' },
  { name: 'tier 2: lower + special, no upper/digit', password: 'abcdef!!', score: 2, strength: 'Fair', color: 'warning' },
  { name: 'tier 2: lower + digit, no upper', password: 'abcdef12', score: 2, strength: 'Fair', color: 'warning' },
  // Tier 3: length >= 8 + upper + lower + digit, but not tier 4
  { name: 'tier 3: upper+lower+digit, 8 chars', password: 'Abcdef12', score: 3, strength: 'Strong', color: 'info' },
  { name: 'tier 3: upper+lower+digit, long, no special', password: 'FakeSample12345', score: 3, strength: 'Strong', color: 'info' },
  { name: 'tier 3: all classes but only 8 chars', password: 'Abcdef1!', score: 3, strength: 'Strong', color: 'info' },
  // Tier 4: length >= 12 + all four classes
  { name: 'tier 4: exactly 12 chars, all classes', password: 'Abcdefgh123!', score: 4, strength: 'Very Strong', color: 'success' },
  { name: 'tier 4: long, all classes', password: 'Fake-Sample-Passphrase-42!', score: 4, strength: 'Very Strong', color: 'success' },
];

async function check(request: APIRequestContext, password: unknown) {
  return request.post(ENDPOINT, { data: { password } });
}

test.describe('POST /api/check-password - scoring tiers', () => {
  for (const tier of TIERS) {
    test(tier.name, async ({ request }) => {
      const res = await check(request, tier.password);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.score).toBe(tier.score);
      expect(body.strength).toBe(tier.strength);
      expect(body.color).toBe(tier.color);
    });
  }

  test('boundary: 7 chars is tier 0, 8 chars is tier 1', async ({ request }) => {
    const seven = await (await check(request, 'abcdefg')).json();
    const eight = await (await check(request, 'abcdefgh')).json();
    expect(seven.score).toBe(0);
    expect(eight.score).toBe(1);
  });

  test('boundary: 11 chars is tier 3, 12 chars is tier 4 (same classes)', async ({ request }) => {
    const eleven = await (await check(request, 'Abcdefg123!')).json();
    const twelve = await (await check(request, 'Abcdefgh123!')).json();
    expect(eleven.score).toBe(3);
    expect(twelve.score).toBe(4);
  });

  test('empty string is a valid string and scores 0', async ({ request }) => {
    const res = await check(request, '');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(0);
    expect(body.strength).toBe('Very Weak');
    expect(body.color).toBe('danger');
    expect(body.suggestions).toContain('Use at least 8 characters');
  });

  test('non-ASCII characters count as special characters', async ({ request }) => {
    const res = await check(request, 'Abcdefg123é!');
    expect(res.status()).toBe(200);
    expect((await res.json()).score).toBe(4);
  });
});

test.describe('POST /api/check-password - response shape', () => {
  test('returns JSON with score, strength, color, suggestions of correct types', async ({ request }) => {
    const res = await check(request, 'Abcdef12');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['color', 'score', 'strength', 'suggestions']);
    expect(typeof body.score).toBe('number');
    expect(Number.isInteger(body.score)).toBe(true);
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(4);
    expect(typeof body.strength).toBe('string');
    expect(['danger', 'warning', 'info', 'success']).toContain(body.color);
    expect(Array.isArray(body.suggestions)).toBe(true);
    for (const s of body.suggestions) expect(typeof s).toBe('string');
  });

  test('response does not echo the submitted password', async ({ request }) => {
    const password = 'FakeEchoCheck-99!';
    const res = await check(request, password);
    expect(await res.text()).not.toContain(password);
  });
});

test.describe('POST /api/check-password - suggestions', () => {
  test('very strong password has no suggestions', async ({ request }) => {
    const body = await (await check(request, 'Fake-Sample-Passphrase-42!')).json();
    expect(body.suggestions).toEqual([]);
  });

  test('short lowercase password gets all applicable suggestions', async ({ request }) => {
    const body = await (await check(request, 'abc')).json();
    expect(body.suggestions).toEqual([
      'Use at least 8 characters',
      'Add uppercase letters',
      'Add numbers',
      'Add special characters (e.g. !@#$%)',
    ]);
  });

  test('8-11 char password is advised to use 12+ characters, not the 8 char message', async ({ request }) => {
    const body = await (await check(request, 'Abcdef1!')).json();
    expect(body.suggestions).toEqual(['Use 12 or more characters for better security']);
  });

  test('digits-only password is asked for upper, lower and special', async ({ request }) => {
    const body = await (await check(request, '12345678')).json();
    expect(body.suggestions).toEqual([
      'Use 12 or more characters for better security',
      'Add uppercase letters',
      'Add lowercase letters',
      'Add special characters (e.g. !@#$%)',
    ]);
  });

  test('long password missing only a special character is asked for one', async ({ request }) => {
    const body = await (await check(request, 'FakeSample12345')).json();
    expect(body.suggestions).toEqual(['Add special characters (e.g. !@#$%)']);
  });

  test('long password missing only a digit is asked for one', async ({ request }) => {
    const body = await (await check(request, 'FakeSample-Words!')).json();
    expect(body.suggestions).toEqual(['Add numbers']);
  });
});

test.describe('POST /api/check-password - invalid input', () => {
  const INVALID: Array<{ name: string; data: Record<string, unknown> }> = [
    { name: 'missing password field', data: {} },
    { name: 'number', data: { password: 12345678 } },
    { name: 'null', data: { password: null } },
    { name: 'array', data: { password: ['Abcdef12'] } },
    { name: 'object', data: { password: { value: 'Abcdef12' } } },
    { name: 'boolean', data: { password: true } },
  ];

  for (const c of INVALID) {
    test(`rejects ${c.name} with 400`, async ({ request }) => {
      const res = await request.post(ENDPOINT, { data: c.data });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: 'password must be a string' });
    });
  }

  test('rejects a different field name with 400', async ({ request }) => {
    const res = await request.post(ENDPOINT, { data: { pass: 'Abcdef12' } });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'password must be a string' });
  });
});

test.describe('Other endpoints', () => {
  test('GET /api/status returns ok', async ({ request }) => {
    const res = await request.get('/api/status');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('GET /api/health returns healthy with numeric uptime', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('CORS header is present when an Origin header is sent', async ({ request }) => {
    const res = await request.get('/api/status', {
      headers: { Origin: 'http://example.test' },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('CORS preflight for check-password is allowed', async ({ request }) => {
    const res = await request.fetch(ENDPOINT, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.test',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(res.status()).toBeLessThan(300);
    expect(res.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('GET / serves the client HTML', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
    expect((await res.text()).toLowerCase()).toContain('<html');
  });
});
