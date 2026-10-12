import { describe, expect, it } from 'vitest';
import { evaluatePassword } from './evaluator';

describe('evaluatePassword', () => {
  describe('score tier 0 (Very Weak)', () => {
    it('scores 0 for an empty string', () => {
      const result = evaluatePassword('');
      expect(result.score).toBe(0);
      expect(result.strength).toBe('Very Weak');
      expect(result.color).toBe('danger');
    });

    it('scores 0 for a short all-lowercase password', () => {
      expect(evaluatePassword('abc').score).toBe(0);
    });

    it('scores 0 for a short password with mixed character types (length still wins)', () => {
      expect(evaluatePassword('aB1!').score).toBe(0);
    });
  });

  describe('score tier 1 (Weak)', () => {
    it('scores 1 for length >= 8 with no uppercase/digit/special variety', () => {
      const result = evaluatePassword('abcdefgh');
      expect(result.score).toBe(1);
      expect(result.strength).toBe('Weak');
      expect(result.color).toBe('danger');
    });

    it('scores 1 for a longer all-lowercase password', () => {
      expect(evaluatePassword('abcdefghijklmnop').score).toBe(1);
    });
  });

  describe('score tier 2 (Fair)', () => {
    it('scores 2 for length >= 8 plus a digit only', () => {
      expect(evaluatePassword('abcdefg1').score).toBe(2);
    });

    it('scores 2 for length >= 8 plus an uppercase letter only', () => {
      expect(evaluatePassword('Abcdefgh').score).toBe(2);
    });

    it('scores 2 for length >= 8 plus a special character only', () => {
      expect(evaluatePassword('abcdefg!').score).toBe(2);
    });
  });

  describe('score tier 3 (Strong)', () => {
    it('scores 3 for length >= 8 with upper + lower + digit but no special', () => {
      expect(evaluatePassword('Abcdefg1').score).toBe(3);
    });

    it('scores 3 for a 12+ character password missing only special characters (does not reach 4)', () => {
      const result = evaluatePassword('Abcdefghijk1');
      expect(result.score).toBe(3);
      expect(result.strength).toBe('Strong');
      expect(result.color).toBe('info');
    });
  });

  describe('score tier 4 (Very Strong)', () => {
    it('scores 4 for a realistic strong password (12+ chars, all 4 character classes)', () => {
      const result = evaluatePassword('Abcdefgh123!');
      expect(result.score).toBe(4);
      expect(result.strength).toBe('Very Strong');
      expect(result.color).toBe('success');
      expect(result.suggestions).toEqual([]);
    });

    it('scores 4 for a long realistic passphrase-style password', () => {
      expect(evaluatePassword('Tr0ub4dor&3Extra').score).toBe(4);
    });
  });

  describe('length boundaries', () => {
    it('treats 7 characters as below the minimum length threshold', () => {
      const result = evaluatePassword('Abcdef1'); // 7 chars, upper+lower+digit
      expect(result.score).toBe(0);
      expect(result.suggestions).toContain('Use at least 8 characters');
    });

    it('treats 8 characters as meeting the minimum length threshold', () => {
      const result = evaluatePassword('Abcdefg1'); // 8 chars, upper+lower+digit
      expect(result.score).toBe(3);
      expect(result.suggestions).not.toContain('Use at least 8 characters');
    });

    it('treats 11 characters as below the "good length" threshold', () => {
      const result = evaluatePassword('Abcdefgh12!'); // 11 chars, all 4 classes
      expect(result.score).toBe(3); // cannot reach 4 without hasGoodLength
      expect(result.suggestions).toContain('Use 12 or more characters for better security');
    });

    it('treats 12 characters as meeting the "good length" threshold', () => {
      const result = evaluatePassword('Abcdefgh123!'); // 12 chars, all 4 classes
      expect(result.score).toBe(4);
      expect(result.suggestions).not.toContain('Use 12 or more characters for better security');
    });
  });

  describe('suggestions content', () => {
    it('suggests only the missing character classes for an otherwise strong password', () => {
      // 12+ chars, upper+lower+digit present, special missing
      const result = evaluatePassword('Abcdefghijk1');
      expect(result.suggestions).toEqual(['Add special characters (e.g. !@#$%)']);
    });

    it('does not suggest length improvements once length is already 12+', () => {
      const result = evaluatePassword('abcdefghijkl'); // 12 chars, lowercase only
      expect(result.suggestions).not.toContain('Use at least 8 characters');
      expect(result.suggestions).not.toContain('Use 12 or more characters for better security');
    });

    it('suggests the short-length message (not the long-length message) when under 8 characters', () => {
      const result = evaluatePassword('ab');
      expect(result.suggestions).toContain('Use at least 8 characters');
      expect(result.suggestions).not.toContain('Use 12 or more characters for better security');
    });

    it('lists all suggestions for an empty password', () => {
      const result = evaluatePassword('');
      expect(result.suggestions).toEqual([
        'Use at least 8 characters',
        'Add uppercase letters',
        'Add lowercase letters',
        'Add numbers',
        'Add special characters (e.g. !@#$%)',
      ]);
    });

    it('suggests missing lowercase and special characters for an all-uppercase+digit password', () => {
      const result = evaluatePassword('ABCDEFGH123');
      expect(result.suggestions).toContain('Add lowercase letters');
      expect(result.suggestions).toContain('Add special characters (e.g. !@#$%)');
      expect(result.suggestions).not.toContain('Add uppercase letters');
      expect(result.suggestions).not.toContain('Add numbers');
    });
  });

  describe('full response shape', () => {
    it('returns the exact {score, strength, color, suggestions} shape for a Fair password', () => {
      const result = evaluatePassword('abcdefg1');
      expect(result).toEqual({
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
  });

  describe('edge cases', () => {
    it('handles an empty string without throwing', () => {
      expect(() => evaluatePassword('')).not.toThrow();
      expect(evaluatePassword('').score).toBe(0);
    });

    it('treats a whitespace-only password as containing a "special" character', () => {
      const result = evaluatePassword('        '); // 8 spaces
      expect(result.suggestions).not.toContain('Add special characters (e.g. !@#$%)');
      // still missing upper/lower/digit, so capped below tier 3
      expect(result.score).toBe(2);
    });

    it('treats emoji/unicode characters as "special" characters for hasSpecial', () => {
      const result = evaluatePassword('Abcdefgh123😀'); // 12 chars incl. emoji, all classes present
      expect(result.suggestions).not.toContain('Add special characters (e.g. !@#$%)');
      expect(result.score).toBe(4);
    });

    it('does not misbehave on a very long (200 char) password with all character classes', () => {
      const longPassword = 'Aa1!'.repeat(50); // 200 chars, all 4 classes present
      const result = evaluatePassword(longPassword);
      expect(result.score).toBe(4);
      expect(result.strength).toBe('Very Strong');
      expect(result.suggestions).toEqual([]);
    });

    it('does not misbehave on a very long (200 char) all-lowercase password', () => {
      const longPassword = 'a'.repeat(200);
      const result = evaluatePassword(longPassword);
      expect(result.score).toBe(1);
      expect(result.suggestions).toEqual(['Add uppercase letters', 'Add numbers', 'Add special characters (e.g. !@#$%)']);
    });

    it('does not reach score 4 when 12+ chars but missing a required class (multi-boundary case)', () => {
      // Exactly 12 chars, has upper/lower/digit but not special -> capped at 3 per cascade
      const result = evaluatePassword('Abcdefghij1A');
      expect(result.score).toBe(3);
    });
  });

  describe('score cascade integrity (sequential if-statements, not else-if)', () => {
    it('lands exactly at score 3 when the score-3 condition is met but the score-4 condition is not', () => {
      // Satisfies: hasMinLength && hasUpper && hasLower && hasDigit (score 3 condition)
      // Does NOT satisfy: hasGoodLength (only 8 chars) -> score 4 condition fails
      const result = evaluatePassword('Abcdefg1');
      expect(result.score).toBe(3);
    });

    it('does not fall back to a lower tier once a higher cascade condition has been satisfied', () => {
      // hasMinLength=true -> score becomes 1
      // hasUpper||hasDigit||hasSpecial=true -> score becomes 2
      // hasUpper&&hasLower&&hasDigit=true -> score becomes 3
      // hasGoodLength&&hasSpecial=false -> score-4 condition fails, score STAYS at 3 (not reset to 0/1/2)
      const result = evaluatePassword('Abcdefgh1234');
      expect(result.score).toBe(3);
    });

    it('reaches the maximum score only when every cascade condition up to score 4 is satisfied', () => {
      const result = evaluatePassword('Abcdefgh123!');
      expect(result.score).toBe(4);
    });
  });
});
