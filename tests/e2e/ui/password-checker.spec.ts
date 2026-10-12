import { test, expect } from '@playwright/test';

/**
 * UI E2E tests for the Password Strength Checker client (client/index.html),
 * served directly by the Express app at GET /.
 *
 * Ground truth: claude-agents-output/mvp-test-factory-password-strength-checker/test-charter.md
 *
 * Fixed dummy passwords (per charter — do not invent new ones):
 *   - "abc"              -> score 0, Very Weak, danger
 *   - "abcdefg1"         -> score 2, Fair, warning
 *   - "Abcdefg1"         -> score 3, Strong, info
 *   - "Abcdefgh123!"     -> score 4, Very Strong, success
 */

const passwordInput = (page: import('@playwright/test').Page) => page.locator('#passwordInput');
const toggleBtn = (page: import('@playwright/test').Page) => page.locator('#toggleBtn');
const strengthBar = (page: import('@playwright/test').Page) => page.locator('#strengthBar');
const strengthLabel = (page: import('@playwright/test').Page) => page.locator('#strengthLabel');
const feedbackList = (page: import('@playwright/test').Page) => page.locator('#feedbackList');

test.describe('Password Strength Checker UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully with the expected initial state', async ({ page }) => {
    await expect(page).toHaveTitle('Password Strength Checker');
    await expect(passwordInput(page)).toBeVisible();
    await expect(strengthLabel(page)).toHaveText('—');
    await expect(strengthBar(page)).toHaveAttribute('style', /width:\s*0%/);
    await expect(feedbackList(page)).toBeEmpty();
  });

  test('typing a weak password shows "Very Weak" with danger styling and suggestions', async ({ page }) => {
    await passwordInput(page).fill('abc');

    await expect(strengthLabel(page)).toHaveText('Very Weak');
    await expect(strengthLabel(page)).toHaveClass(/text-danger/);
    await expect(strengthBar(page)).toHaveClass(/bg-danger/);

    // "abc": length < 8, has lowercase only -> real suggestions per
    // server/src/services/evaluator.ts are exactly these four (no
    // "Add lowercase letters", since "abc" already has lowercase).
    await expect(feedbackList(page)).toContainText('Use at least 8 characters');
    await expect(feedbackList(page)).toContainText('Add uppercase letters');
    await expect(feedbackList(page)).toContainText('Add numbers');
    await expect(feedbackList(page)).toContainText('Add special characters (e.g. !@#$%)');
    await expect(feedbackList(page)).not.toContainText('Password looks good!');

    const items = feedbackList(page).locator('li');
    await expect(items).toHaveCount(4);
  });

  test('typing a very strong password shows "Very Strong" with success styling and no suggestions', async ({ page }) => {
    await passwordInput(page).fill('Abcdefgh123!');

    await expect(strengthLabel(page)).toHaveText('Very Strong');
    await expect(strengthLabel(page)).toHaveClass(/text-success/);
    await expect(strengthBar(page)).toHaveClass(/bg-success/);

    const items = feedbackList(page).locator('li');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toHaveText('Password looks good!');
  });

  test('typing a mid-tier (Fair) password shows correct label, color, and bar width', async ({ page }) => {
    await passwordInput(page).fill('abcdefg1');

    await expect(strengthLabel(page)).toHaveText('Fair');
    await expect(strengthLabel(page)).toHaveClass(/text-warning/);
    await expect(strengthBar(page)).toHaveClass(/bg-warning/);
    // widthMap: score 2 -> 50%
    await expect(strengthBar(page)).toHaveAttribute('style', /width:\s*50%/);
  });

  test('clearing the input resets the UI synchronously to the initial state', async ({ page }) => {
    await passwordInput(page).fill('Abcdefg1');
    await expect(strengthLabel(page)).toHaveText('Strong');

    await passwordInput(page).fill('');

    // Synchronous resetUI() path — no debounce/fetch wait required, but the
    // auto-retrying assertions below are still safe/non-flaky if a repaint occurs.
    await expect(strengthLabel(page)).toHaveText('—');
    await expect(strengthBar(page)).toHaveAttribute('style', /width:\s*0%/);
    await expect(feedbackList(page)).toBeEmpty();
  });

  test('toggle button flips the password field type between password and text', async ({ page }) => {
    await expect(passwordInput(page)).toHaveAttribute('type', 'password');

    await toggleBtn(page).click();
    await expect(passwordInput(page)).toHaveAttribute('type', 'text');

    await toggleBtn(page).click();
    await expect(passwordInput(page)).toHaveAttribute('type', 'password');
  });
});
