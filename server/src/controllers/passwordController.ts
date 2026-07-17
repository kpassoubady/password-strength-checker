import { Request, Response } from 'express';
import { evaluatePassword } from '../services/evaluator';

export function checkPassword(req: Request, res: Response): void {
  const { password } = req.body as { password?: unknown };
  if (typeof password !== 'string') {
    res.status(400).json({ error: 'password must be a string' });
    return;
  }
  res.json(evaluatePassword(password));
}

export function getStatus(_req: Request, res: Response): void {
  res.json({ status: 'ok' });
}

export function getHealth(_req: Request, res: Response): void {
  res.json({ status: 'healthy', uptime: process.uptime() });
}
