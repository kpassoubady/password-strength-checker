export interface EvaluationResult {
  score: number;
  strength: string;
  suggestions: string[];
  color: string;
}

export function evaluatePassword(password: string): EvaluationResult {
  const suggestions: string[] = [];
  const hasMinLength = password.length >= 8;
  const hasGoodLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasMinLength) {
    suggestions.push('Use at least 8 characters');
  } else if (!hasGoodLength) {
    suggestions.push('Use 12 or more characters for better security');
  }
  if (!hasUpper) suggestions.push('Add uppercase letters');
  if (!hasLower) suggestions.push('Add lowercase letters');
  if (!hasDigit) suggestions.push('Add numbers');
  if (!hasSpecial) suggestions.push('Add special characters (e.g. !@#$%)');

  let score = 0;
  if (hasMinLength) score = 1;
  if (hasMinLength && (hasUpper || hasDigit || hasSpecial)) score = 2;
  if (hasMinLength && hasUpper && hasLower && hasDigit) score = 3;
  if (hasGoodLength && hasUpper && hasLower && hasDigit && hasSpecial) score = 4;

  const levels: Array<{ strength: string; color: string }> = [
    { strength: 'Very Weak', color: 'danger' },
    { strength: 'Weak', color: 'danger' },
    { strength: 'Fair', color: 'warning' },
    { strength: 'Strong', color: 'info' },
    { strength: 'Very Strong', color: 'success' },
  ];

  return { score, ...levels[score], suggestions };
}
