import { test, expect, Page } from '@playwright/test';

const API_PATTERN = '**/api/check-password';

// Fake passwords only.
const WEAK_PASSWORD = 'abc';
const FAIR_PASSWORD = 'abcdefgh1'; // length 8 + digit -> score 2
const STRONG_PASSWORD = 'Abcdefg1'; // length 8 + upper/lower/digit -> score 3
const VERY_STRONG_PASSWORD = 'Fake-Pass-1234!xyz'; // length >= 12 + all classes -> score 4

test.beforeEach(async ({ page }) => {
  // Block the presentation-only Bootstrap CDN so tests do not depend on the network.
  await page.route('**://cdn.jsdelivr.net/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

/** Types into the password input and waits for the debounced API response. */
async function typeAndWaitForApi(page: Page, value: string): Promise<void> {
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/check-password') && res.request().method() === 'POST',
  );
  await page.locator('#passwordInput').fill(value);
  await responsePromise;
}

test.describe('Password strength checker UI', () => {
  test('shows the initial empty state', async ({ page }) => {
    await expect(page.locator('#passwordInput')).toHaveAttribute('type', 'password');
    await expect(page.locator('#passwordInput')).toHaveValue('');
    await expect(page.locator('#strengthLabel')).toHaveText('—');
    await expect(page.locator('#strengthBar')).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('#strengthBar')).toHaveCSS('width', '0px');
    await expect(page.locator('#feedbackList li')).toHaveCount(0);
  });

  test('weak password shows Very Weak, danger styling and suggestions', async ({ page }) => {
    await typeAndWaitForApi(page, WEAK_PASSWORD);

    const bar = page.locator('#strengthBar');
    await expect(page.locator('#strengthLabel')).toHaveText('Very Weak');
    await expect(bar).toHaveClass(/bg-danger/);
    await expect(bar).toHaveAttribute('aria-valuenow', '5');
    await expect(bar).toHaveAttribute('style', /width:\s*5%/);

    const items = page.locator('#feedbackList li');
    await expect(items.first()).toContainText('Use at least 8 characters');
    await expect(items).toContainText([
      'Use at least 8 characters',
      'Add uppercase letters',
      'Add numbers',
      'Add special characters',
    ]);
  });

  test('mid-tier password with a digit shows Fair with warning styling', async ({ page }) => {
    await typeAndWaitForApi(page, FAIR_PASSWORD);

    const bar = page.locator('#strengthBar');
    await expect(page.locator('#strengthLabel')).toHaveText('Fair');
    await expect(bar).toHaveClass(/bg-warning/);
    await expect(bar).toHaveAttribute('aria-valuenow', '50');
    await expect(bar).toHaveAttribute('style', /width:\s*50%/);
    await expect(page.locator('#feedbackList li').first()).toBeVisible();
    await expect(page.locator('#feedbackList')).not.toContainText('Password looks good!');
  });

  test('mid-tier password with mixed case and digit shows Strong with info styling', async ({ page }) => {
    await typeAndWaitForApi(page, STRONG_PASSWORD);

    const bar = page.locator('#strengthBar');
    await expect(page.locator('#strengthLabel')).toHaveText('Strong');
    await expect(bar).toHaveClass(/bg-info/);
    await expect(bar).toHaveAttribute('aria-valuenow', '75');
    await expect(bar).toHaveAttribute('style', /width:\s*75%/);
    await expect(page.locator('#feedbackList')).toContainText('Add special characters');
  });

  test('very strong password shows Very Strong, success styling and a positive message', async ({ page }) => {
    await typeAndWaitForApi(page, VERY_STRONG_PASSWORD);

    const bar = page.locator('#strengthBar');
    await expect(page.locator('#strengthLabel')).toHaveText('Very Strong');
    await expect(bar).toHaveClass(/bg-success/);
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
    await expect(bar).toHaveAttribute('style', /width:\s*100%/);
    await expect(page.locator('#feedbackList li')).toHaveCount(1);
    await expect(page.locator('#feedbackList li')).toHaveText('Password looks good!');
  });

  test('clearing the input resets the UI', async ({ page }) => {
    await typeAndWaitForApi(page, VERY_STRONG_PASSWORD);
    await expect(page.locator('#strengthLabel')).toHaveText('Very Strong');

    await page.locator('#passwordInput').fill('');

    const bar = page.locator('#strengthBar');
    await expect(page.locator('#strengthLabel')).toHaveText('—');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toHaveAttribute('style', /width:\s*0%/);
    await expect(bar).not.toHaveClass(/bg-(danger|warning|info|success)/);
    await expect(page.locator('#feedbackList li')).toHaveCount(0);
  });

  test('toggle button switches input type between password and text', async ({ page }) => {
    const input = page.locator('#passwordInput');
    const toggle = page.locator('#toggleBtn');

    await input.fill(WEAK_PASSWORD);
    await expect(input).toHaveAttribute('type', 'password');

    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue(WEAK_PASSWORD);

    await toggle.click();
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue(WEAK_PASSWORD);
  });

  test('API failure leaves the UI intact without page errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      }),
    );

    await typeAndWaitForApi(page, VERY_STRONG_PASSWORD);

    // UI stays in its initial state and remains usable.
    await expect(page.locator('#strengthLabel')).toHaveText('—');
    await expect(page.locator('#strengthBar')).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('#feedbackList li')).toHaveCount(0);
    await expect(page.locator('#passwordInput')).toBeEnabled();
    await expect(page.locator('#passwordInput')).toHaveValue(VERY_STRONG_PASSWORD);

    await page.locator('#toggleBtn').click();
    await expect(page.locator('#passwordInput')).toHaveAttribute('type', 'text');

    expect(pageErrors).toEqual([]);
  });
});
