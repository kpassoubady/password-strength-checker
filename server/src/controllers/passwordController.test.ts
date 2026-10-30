import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { checkPassword, getStatus, getHealth } from './passwordController';
import { evaluatePassword } from '../services/evaluator';

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function call(
  handler: (req: Request, res: Response) => void,
  body: unknown,
) {
  const res = mockRes();
  handler({ body } as Request, res as unknown as Response);
  return res;
}

describe('checkPassword', () => {
  it.each([
    ['missing password', {}],
    ['number', { password: 123 }],
    ['null', { password: null }],
    ['object', { password: { a: 1 } }],
    ['array', { password: ['abc'] }],
    ['boolean', { password: true }],
  ])('returns 400 for %s', (_name, body) => {
    const res = call(checkPassword, body);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'password must be a string' });
  });

  it('returns the evaluatePassword result for a string password', () => {
    const res = call(checkPassword, { password: 'Hello123!world' });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(evaluatePassword('Hello123!world'));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ score: 4, strength: 'Very Strong', color: 'success' }),
    );
  });

  it('accepts an empty string as a valid password', () => {
    const res = call(checkPassword, { password: '' });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 0 }));
  });
});

describe('getStatus', () => {
  it('responds with {status: ok}', () => {
    const res = mockRes();
    getStatus({} as Request, res as unknown as Response);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});

describe('getHealth', () => {
  it('responds with healthy status and numeric uptime', () => {
    const res = mockRes();
    getHealth({} as Request, res as unknown as Response);
    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = res.json.mock.calls[0][0] as { status: string; uptime: number };
    expect(payload.status).toBe('healthy');
    expect(typeof payload.uptime).toBe('number');
    expect(payload.uptime).toBeGreaterThanOrEqual(0);
  });
});
