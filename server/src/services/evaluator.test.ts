import { describe, it, expect } from 'vitest';
import { evaluatePassword } from './evaluator';

const MSG_MIN = 'Use at least 8 characters';
const MSG_LONG = 'Use 12 or more characters for better security';
const MSG_UPPER = 'Add uppercase letters';
const MSG_LOWER = 'Add lowercase letters';
const MSG_DIGIT = 'Add numbers';
const MSG_SPECIAL = 'Add special characters (e.g. !@#$%)';

describe('evaluatePassword score tiers', () => {
  it('score 0: length < 8 is Very Weak / danger', () => {
    const r = evaluatePassword('Ab1!xyz');
    expect(r.score).toBe(0);
    expect(r.strength).toBe('Very Weak');
    expect(r.color).toBe('danger');
  });

  it('score 1: length >= 8 with only lowercase is Weak / danger', () => {
    const r = evaluatePassword('abcdefgh');
    expect(r.score).toBe(1);
    expect(r.strength).toBe('Weak');
    expect(r.color).toBe('danger');
  });

  it('score 2: length >= 8 with one extra class is Fair / warning', () => {
    const r = evaluatePassword('abcdefg1');
    expect(r.score).toBe(2);
    expect(r.strength).toBe('Fair');
    expect(r.color).toBe('warning');
  });

  it('score 3: length >= 8 with upper, lower, digit is Strong / info', () => {
    const r = evaluatePassword('Abcdefg1');
    expect(r.score).toBe(3);
    expect(r.strength).toBe('Strong');
    expect(r.color).toBe('info');
  });

  it('score 4: length >= 12 with all four classes is Very Strong / success', () => {
    const r = evaluatePassword('Hello123!world');
    expect(r.score).toBe(4);
    expect(r.strength).toBe('Very Strong');
    expect(r.color).toBe('success');
    expect(r.suggestions).toEqual([]);
  });
});

describe('evaluatePassword length boundaries', () => {
  it('7 chars scores 0 and 8 chars scores 3 with same character classes', () => {
    expect(evaluatePassword('Abcdef1').score).toBe(0);
    expect(evaluatePassword('Abcdefg1').score).toBe(3);
  });

  it('11 chars with all classes scores 3 and 12 chars scores 4', () => {
    expect(evaluatePassword('Abcdefgh1!x').score).toBe(3);
    expect(evaluatePassword('Abcdefghi1!x').score).toBe(4);
  });

  it('length suggestion switches between 7, 8, 11 and 12 chars', () => {
    expect(evaluatePassword('Abcdef1').suggestions).toContain(MSG_MIN);
    const eight = evaluatePassword('Abcdefg1');
    expect(eight.suggestions).not.toContain(MSG_MIN);
    expect(eight.suggestions).toContain(MSG_LONG);
    expect(evaluatePassword('Abcdefgh1!x').suggestions).toContain(MSG_LONG);
    const twelve = evaluatePassword('Abcdefghi1!x');
    expect(twelve.suggestions).not.toContain(MSG_MIN);
    expect(twelve.suggestions).not.toContain(MSG_LONG);
  });
});

describe('evaluatePassword suggestions', () => {
  it('suggests uppercase when missing', () => {
    expect(evaluatePassword('abcdefghij1!').suggestions).toEqual([MSG_UPPER]);
  });

  it('suggests lowercase when missing', () => {
    expect(evaluatePassword('ABCDEFGHIJ1!').suggestions).toEqual([MSG_LOWER]);
  });

  it('suggests numbers when missing', () => {
    expect(evaluatePassword('Abcdefghij!k').suggestions).toEqual([MSG_DIGIT]);
  });

  it('suggests special characters when missing', () => {
    expect(evaluatePassword('Abcdefghij1k').suggestions).toEqual([MSG_SPECIAL]);
  });

  it('lists every suggestion in order for an empty password', () => {
    const r = evaluatePassword('');
    expect(r.score).toBe(0);
    expect(r.suggestions).toEqual([MSG_MIN, MSG_UPPER, MSG_LOWER, MSG_DIGIT, MSG_SPECIAL]);
  });
});
