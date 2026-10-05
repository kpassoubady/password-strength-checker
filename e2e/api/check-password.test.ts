import request from 'supertest';
import { startServer, stopServer, BASE_URL } from './server-lifecycle';

/**
 * Behavior-focused E2E coverage for the public HTTP API surface:
 *   POST /api/check-password
 *   GET  /api/status
 *   GET  /api/health
 *
 * These tests run against a real, dedicated server process (see
 * server-lifecycle.ts) rather than importing the Express app module or
 * mocking any layer. All password values below are fixed, synthetic
 * dummy strings chosen only to exercise character-class combinations;
 * none represent real credentials.
 */

jest.setTimeout(30000);

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe('POST /api/check-password', () => {
  it('returns 200 with the full evaluation shape for a very strong password', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: 'Tr0ub4dor&3!!' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      score: 4,
      strength: 'Very Strong',
      color: 'success',
      suggestions: [],
    });
  });

  it('returns 200 with score 0 / Very Weak for a short, single-class password', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: 'abc' });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(0);
    expect(res.body.strength).toBe('Very Weak');
    expect(res.body.color).toBe('danger');
    expect(res.body.suggestions).toContain('Use at least 8 characters');
  });

  it('returns 200 with score 0 for an empty string password', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: '' });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(0);
    expect(res.body.strength).toBe('Very Weak');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('returns 200 for a password with only lowercase letters and digits (missing upper/special)', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: 'lowercase123' });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(2);
    expect(res.body.strength).toBe('Fair');
    expect(res.body.suggestions).toContain('Add uppercase letters');
    expect(res.body.suggestions).toContain('Add special characters (e.g. !@#$%)');
  });

  it('returns 200 and score 4 for a very long password covering all character classes', async () => {
    const longPassword = `Aa1!${'x'.repeat(200)}`;
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: longPassword });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(4);
    expect(res.body.strength).toBe('Very Strong');
    expect(res.body.suggestions).toEqual([]);
  });

  it('returns 400 when password field is missing', async () => {
    const res = await request(BASE_URL).post('/api/check-password').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });

  it('returns 400 when password is a number', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: 12345678 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });

  it('returns 400 when password is null', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: null });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });

  it('returns 400 when password is an array', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: ['a', 'b', 'c'] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });

  it('returns 400 when password is a boolean', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });

  it('returns 400 when password is an object', async () => {
    const res = await request(BASE_URL)
      .post('/api/check-password')
      .send({ password: { nested: 'value' } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'password must be a string' });
  });
});

describe('GET /api/status', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(BASE_URL).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/health', () => {
  it('returns 200 with a healthy status and numeric uptime', async () => {
    const res = await request(BASE_URL).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
