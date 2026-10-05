import { test, expect } from '@playwright/test';

/**
 * E2E coverage for the password strength checker UI (client/index.html).
 *
 * Behavior under test is driven by server/src/services/evaluator.ts via the
 * live POST /api/check-password endpoint (no mocking of that API - these
 * tests assert against the real server response). Bootstrap/jsdelivr CDN
 * assets are presentation-only (CSS/JS for styling) and are blocked so
 * tests run deterministically offline and aren't coupled to a third party.
 */

const CDN_BLOCK_PATTERNS = ['**://cdn.jsdelivr.net/**'];

test.beforeEach(async ({ page }) => {
  for (const pattern of CDN_BLOCK_PATTERNS) {
    await page.route(pattern, (route) => route.abort());
  }
  await page.goto('/');
});

test.describe('Password Strength Checker - initial state', () => {
  test('loads with reset/initial UI state', async ({ page }) => {
    const label = page.locator('#strengthLabel');
    const bar = page.locator('#strengthBar');
    const feedback = page.locator('#feedbackList');

    await expect(label).toHaveText('—');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('style', /width:\s*0%/);
    await expect(feedback.locator('li')).toHaveCount(0);
    await expect(page.locator('#passwordInput')).toHaveAttribute('type', 'password');
  });
});

test.describe('Password Strength Checker - weak password', () => {
  test('typing a weak password shows a low strength label and suggestions', async ({ page }) => {
    const input = page.locator('#passwordInput');
    const label = page.locator('#strengthLabel');
    const bar = page.locator('#strengthBar');
    const feedback = page.locator('#feedbackList');

    await input.fill('abc');

    // Debounce is 250ms; rely on auto-retrying assertions instead of sleeps.
    await expect(label).toHaveText('Very Weak');
    await expect(bar).toHaveAttribute('aria-valuenow', '5');
    await expect(feedback.locator('li')).toContainText([
      'Use at least 8 characters',
    ]);
    await expect(feedback.locator('li')).toHaveCount(4);
  });
});

test.describe('Password Strength Checker - strong password', () => {
  test('typing a strong password shows highest strength label and positive feedback', async ({ page }) => {
    const input = page.locator('#passwordInput');
    const label = page.locator('#strengthLabel');
    const bar = page.locator('#strengthBar');
    const feedback = page.locator('#feedbackList');

    // 15 chars, upper/lower/digit/special present -> score 4 per evaluator.ts
    await input.fill('Tr0ub4dor&9xyz!');

    await expect(label).toHaveText('Very Strong');
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
    await expect(bar).toHaveAttribute('style', /width:\s*100%/);
    await expect(feedback).toHaveText('Password looks good!');
  });
});

test.describe('Password Strength Checker - visibility toggle', () => {
  test('clicking the toggle switches input type between password and text', async ({ page }) => {
    const input = page.locator('#passwordInput');
    const toggleBtn = page.locator('#toggleBtn');

    await expect(input).toHaveAttribute('type', 'password');

    await toggleBtn.click();
    await expect(input).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(input).toHaveAttribute('type', 'password');
  });
});

test.describe('Password Strength Checker - clearing input', () => {
  test('clearing the password resets the UI back to initial state', async ({ page }) => {
    const input = page.locator('#passwordInput');
    const label = page.locator('#strengthLabel');
    const bar = page.locator('#strengthBar');
    const feedback = page.locator('#feedbackList');

    await input.fill('abc');
    await expect(label).toHaveText('Very Weak');

    await input.fill('');

    await expect(label).toHaveText('—');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('style', /width:\s*0%/);
    await expect(feedback.locator('li')).toHaveCount(0);
  });
});
