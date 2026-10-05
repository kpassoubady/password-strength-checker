import { evaluatePassword } from './evaluator';

describe('evaluatePassword', () => {
  describe('score tiers', () => {
    it('scores 0 for a password under 8 characters', () => {
      const result = evaluatePassword('abc123');
      expect(result.score).toBe(0);
      expect(result.strength).toBe('Very Weak');
      expect(result.color).toBe('danger');
    });

    it('scores 1 for a password with min length but no upper/digit/special', () => {
      const result = evaluatePassword('abcdefgh');
      expect(result.score).toBe(1);
      expect(result.strength).toBe('Weak');
      expect(result.color).toBe('danger');
    });

    it('scores 2 for a password with min length plus one of upper/digit/special, but not all three categories', () => {
      const result = evaluatePassword('abcdefg1');
      expect(result.score).toBe(2);
      expect(result.strength).toBe('Fair');
      expect(result.color).toBe('warning');
    });

    it('scores 3 for a password with upper, lower, and digit but under 12 chars (no need for special)', () => {
      const result = evaluatePassword('Abcdefg1');
      expect(result.score).toBe(3);
      expect(result.strength).toBe('Strong');
      expect(result.color).toBe('info');
    });

    it('scores 3 (not 4) for a password with upper, lower, digit, and special but under 12 chars', () => {
      const result = evaluatePassword('Abcdef1!');
      expect(result.score).toBe(3);
      expect(result.strength).toBe('Strong');
    });

    it('scores 4 for a password with 12+ chars and all four character categories', () => {
      const result = evaluatePassword('Abcdefghij1!');
      expect(result.score).toBe(4);
      expect(result.strength).toBe('Very Strong');
      expect(result.color).toBe('success');
    });

    it('scores 3 (not 4) for a 12+ char password missing a special character', () => {
      const result = evaluatePassword('Abcdefghij12');
      expect(result.score).toBe(3);
    });
  });

  describe('length boundary conditions', () => {
    it('treats a 7-char password as below the minimum length', () => {
      const result = evaluatePassword('Abcdef1');
      expect(result.suggestions).toContain('Use at least 8 characters');
      expect(result.score).toBe(0);
    });

    it('treats an 8-char password as meeting the minimum length', () => {
      const result = evaluatePassword('Abcdefg1');
      expect(result.suggestions).not.toContain('Use at least 8 characters');
      expect(result.suggestions).toContain(
        'Use 12 or more characters for better security'
      );
    });

    it('treats an 11-char password as below the "good length" threshold', () => {
      const result = evaluatePassword('Abcdefghij1');
      expect(result.suggestions).toContain(
        'Use 12 or more characters for better security'
      );
    });

    it('treats a 12-char password as meeting the "good length" threshold', () => {
      const result = evaluatePassword('Abcdefghij12');
      expect(result.suggestions).not.toContain(
        'Use 12 or more characters for better security'
      );
      expect(result.suggestions).not.toContain('Use at least 8 characters');
    });
  });

  describe('suggestion messages', () => {
    it('suggests adding uppercase letters when none are present', () => {
      const result = evaluatePassword('abcdefgh1!');
      expect(result.suggestions).toContain('Add uppercase letters');
    });

    it('does not suggest adding uppercase letters when present', () => {
      const result = evaluatePassword('Abcdefgh1!');
      expect(result.suggestions).not.toContain('Add uppercase letters');
    });

    it('suggests adding lowercase letters when none are present', () => {
      const result = evaluatePassword('ABCDEFGH1!');
      expect(result.suggestions).toContain('Add lowercase letters');
    });

    it('does not suggest adding lowercase letters when present', () => {
      const result = evaluatePassword('ABCDEFGh1!');
      expect(result.suggestions).not.toContain('Add lowercase letters');
    });

    it('suggests adding numbers when none are present', () => {
      const result = evaluatePassword('Abcdefgh!!');
      expect(result.suggestions).toContain('Add numbers');
    });

    it('does not suggest adding numbers when present', () => {
      const result = evaluatePassword('Abcdefgh1!');
      expect(result.suggestions).not.toContain('Add numbers');
    });

    it('suggests adding special characters when none are present', () => {
      const result = evaluatePassword('Abcdefgh12');
      expect(result.suggestions).toContain(
        'Add special characters (e.g. !@#$%)'
      );
    });

    it('does not suggest adding special characters when present', () => {
      const result = evaluatePassword('Abcdefgh1!');
      expect(result.suggestions).not.toContain(
        'Add special characters (e.g. !@#$%)'
      );
    });

    it('produces no suggestions for a maximally strong password', () => {
      const result = evaluatePassword('Abcdefghij1!');
      expect(result.suggestions).toEqual([]);
    });

    it('produces all applicable suggestions for a very weak password', () => {
      const result = evaluatePassword('abc');
      expect(result.suggestions).toEqual([
        'Use at least 8 characters',
        'Add uppercase letters',
        'Add numbers',
        'Add special characters (e.g. !@#$%)',
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles an empty string', () => {
      const result = evaluatePassword('');
      expect(result.score).toBe(0);
      expect(result.strength).toBe('Very Weak');
      expect(result.suggestions).toContain('Use at least 8 characters');
    });
  });
});
