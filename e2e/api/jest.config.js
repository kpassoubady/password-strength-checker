/**
 * Self-contained Jest config for the API E2E suite.
 *
 * This config lives entirely under e2e/api/ so it does not touch any
 * shared/root test configuration (server/jest.config.js, playwright.config.ts).
 * It reuses the ts-jest/jest/supertest tooling already installed in
 * server/node_modules (via moduleDirectories) rather than adding a new
 * package.json or lockfile under e2e/api/.
 *
 * Run with:
 *   cd <repo-root>
 *   ./server/node_modules/.bin/jest --config e2e/api/jest.config.js
 */

const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '../..',
  roots: ['<rootDir>/e2e/api'],
  testMatch: ['<rootDir>/e2e/api/**/*.test.ts'],
  moduleDirectories: ['node_modules', 'server/node_modules'],
  transform: {
    '^.+\\.ts$': [
      path.join(__dirname, '../../server/node_modules/ts-jest'),
      {
        tsconfig: path.join(__dirname, 'tsconfig.json'),
      },
    ],
  },
  clearMocks: true,
  testTimeout: 15000,
};
