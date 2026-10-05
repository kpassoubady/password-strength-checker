import { Request, Response } from 'express';
import { checkPassword, getStatus, getHealth } from './passwordController';

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockRequest(body: unknown): Request {
  return { body } as Request;
}

describe('checkPassword', () => {
  it.each([
    ['missing password', {}],
    ['password is a number', { password: 12345678 }],
    ['password is null', { password: null }],
    ['password is undefined', { password: undefined }],
    ['password is an object', { password: { not: 'a string' } }],
    ['password is an array', { password: ['a', 'b'] }],
    ['password is a boolean', { password: true }],
  ])('responds 400 when %s', (_label, body) => {
    const req = mockRequest(body);
    const res = mockResponse();

    checkPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'password must be a string',
    });
  });

  it('delegates to evaluatePassword and returns its result on the happy path', () => {
    const req = mockRequest({ password: 'Abcdefghij1!' });
    const res = mockResponse();

    checkPassword(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload).toEqual({
      score: 4,
      strength: 'Very Strong',
      color: 'success',
      suggestions: [],
    });
  });

  it('returns real evaluation output (not a stub) for a weak password', () => {
    const req = mockRequest({ password: 'abc' });
    const res = mockResponse();

    checkPassword(req, res);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.score).toBe(0);
    expect(payload.strength).toBe('Very Weak');
    expect(payload.suggestions).toContain('Use at least 8 characters');
  });

  it('accepts an empty string as a valid (if weak) password', () => {
    const req = mockRequest({ password: '' });
    const res = mockResponse();

    checkPassword(req, res);

    expect(res.status).not.toHaveBeenCalled();
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.score).toBe(0);
  });
});

describe('getStatus', () => {
  it('returns a status of ok', () => {
    const req = {} as Request;
    const res = mockResponse();

    getStatus(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});

describe('getHealth', () => {
  it('returns a healthy status with a numeric uptime', () => {
    const req = {} as Request;
    const res = mockResponse();

    getHealth(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.status).toBe('healthy');
    expect(typeof payload.uptime).toBe('number');
    expect(payload.uptime).toBeGreaterThanOrEqual(0);
  });
});
