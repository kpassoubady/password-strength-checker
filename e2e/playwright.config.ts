import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './api',
      outputDir: '../test-results/api',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui',
      testDir: './ui',
      outputDir: '../test-results/ui',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    cwd: '..',
    url: `${baseURL}/api/status`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
