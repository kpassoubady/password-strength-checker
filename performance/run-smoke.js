#!/usr/bin/env node
/**
 * Lifecycle wrapper for the k6 smoke gate.
 *
 * Chosen as a Node script (rather than a shell script) for cross-platform
 * portability, since this is already a Node project and contributors may
 * be on macOS, Linux, or Windows.
 *
 * Responsibilities (and ONLY these):
 *   1. Spawn the approved start command (`npm start` from server/) as a
 *      child process, on a known port.
 *   2. Poll GET /api/health until it returns 200, up to a deadline.
 *   3. Invoke `k6 run performance/smoke.js`.
 *   4. Capture k6's exit code.
 *   5. Terminate the server child process it spawned (success, failure,
 *      or interruption) — never any other process on the machine.
 *   6. Exit with k6's exit code so CI/gate runners see pass/fail correctly.
 *
 * This script does not touch any port owned by an unrelated process: if the
 * readiness probe fails, it stops and surfaces the real error rather than
 * guessing or force-killing anything.
 */

'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(REPO_ROOT, 'server');
const PORT = process.env.PORT || '3000';
const BASE_URL = `http://localhost:${PORT}`;
const HEALTH_URL = `${BASE_URL}/api/health`;
const READINESS_TIMEOUT_MS = 15000;
const READINESS_POLL_INTERVAL_MS = 500;
const K6_SCRIPT = path.join(__dirname, 'smoke.js');

let serverProcess = null;
let cleanedUp = false;

function log(msg) {
  process.stdout.write(`[run-smoke] ${msg}\n`);
}

function probeHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ ok: res.statusCode === 200, statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: new Error('health probe timed out') });
    });
  });
}

async function waitForReadiness() {
  const deadline = Date.now() + READINESS_TIMEOUT_MS;
  let lastError = null;
  let lastStatus = null;

  while (Date.now() < deadline) {
    const result = await probeHealth();
    if (result.ok) {
      log(`Server ready at ${HEALTH_URL} (status 200).`);
      return;
    }
    lastError = result.error;
    lastStatus = result.statusCode;
    await new Promise((r) => setTimeout(r, READINESS_POLL_INTERVAL_MS));
  }

  const detail = lastError
    ? `last error: ${lastError.message}`
    : `last status code: ${lastStatus}`;
  throw new Error(
    `Readiness probe failed: ${HEALTH_URL} did not return 200 within ${READINESS_TIMEOUT_MS}ms (${detail})`
  );
}

function startServer() {
  log(`Starting server via "npm start" in ${SERVER_DIR} on PORT=${PORT}...`);
  const child = spawn('npm', ['start'], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[server] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[server] ${chunk}`);
  });

  return child;
}

function runK6() {
  return new Promise((resolve) => {
    log(`Running k6 smoke test: k6 run ${K6_SCRIPT}`);
    const child = spawn('k6', ['run', K6_SCRIPT], {
      cwd: REPO_ROOT,
      env: { ...process.env, BASE_URL },
      stdio: 'inherit',
    });
    child.on('exit', (code) => resolve(code === null ? 1 : code));
    child.on('error', (err) => {
      log(`Failed to start k6: ${err.message}`);
      resolve(1);
    });
  });
}

function stopServer() {
  if (cleanedUp || !serverProcess) {
    return;
  }
  cleanedUp = true;
  log(`Stopping server process it started (pid ${serverProcess.pid})...`);
  // Only ever signals the child process this script itself spawned.
  serverProcess.kill('SIGTERM');
}

async function main() {
  let exitCode = 1;

  process.on('SIGINT', () => {
    log('Received SIGINT, cleaning up...');
    stopServer();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    log('Received SIGTERM, cleaning up...');
    stopServer();
    process.exit(143);
  });

  try {
    serverProcess = startServer();
    await waitForReadiness();
    exitCode = await runK6();
  } catch (err) {
    log(`ERROR: ${err.message}`);
    exitCode = 1;
  } finally {
    stopServer();
  }

  process.exitCode = exitCode;
}

main();
