import { defineConfig, devices } from '@playwright/test';

/**
 * Shared Playwright configuration for the password-strength-checker MVP.
 *
 * UI specs live under e2e/ui/ (populated by a downstream UI E2E agent).
 * API specs live under e2e/api/ (populated by a downstream API E2E agent);
 * those specs typically use supertest directly against the Express app
 * rather than this config's webServer/browser stack, but the directory is
 * reserved here for consistency.
 */
export default defineConfig({
  testDir: './e2e/ui',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    cwd: './server',
    url: 'http://localhost:3000/api/health',
    timeout: 30_000,
    reuseExistingServer: !process.env.CI,
  },
});
