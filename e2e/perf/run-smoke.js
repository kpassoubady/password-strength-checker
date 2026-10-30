'use strict';
// Lifecycle runner for the k6 smoke gate: start server -> wait ready -> k6 -> always stop server.
// Usage (repo root): node e2e/perf/run-smoke.js     (PORT env optional, default 3000)
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join('e2e', 'perf', 'smoke.k6.js');
const PORT = String(process.env.PORT || 3000);
const BASE_URL = 'http://localhost:' + PORT;
const READY_TIMEOUT_MS = 60000;
const IS_WIN = process.platform === 'win32';

let server = null;
let k6 = null;
let cleaningUp = false;
let serverListening = false;
let serverExited = null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function probe() {
  try {
    const res = await fetch(BASE_URL + '/api/status', { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function groupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

async function killTree(child) {
  if (!child || !child.pid) return;
  const pid = child.pid;
  if (IS_WIN) {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try { process.kill(-pid, 'SIGTERM'); } catch (e) { /* already gone */ }
  const deadline = Date.now() + 5000;
  while (groupAlive(pid) && Date.now() < deadline) await sleep(100);
  if (groupAlive(pid)) {
    try { process.kill(-pid, 'SIGKILL'); } catch (e) { /* already gone */ }
  }
}

async function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  if (k6 && k6.exitCode === null && k6.signalCode === null) {
    try { k6.kill('SIGTERM'); } catch (e) { /* ignore */ }
  }
  await killTree(server);
  server = null;
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    console.error('[perf] received ' + sig + ', cleaning up');
    cleanup().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143));
  });
}

function runK6() {
  return new Promise((resolve) => {
    // If our own server dies mid-run, stop k6 and fail instead of reporting a misleading result.
    const watch = setInterval(() => {
      if (serverExited && k6 && k6.exitCode === null && k6.signalCode === null) {
        console.error('[perf] server ' + serverExited + ' during k6 run, aborting');
        k6.kill('SIGTERM');
      }
    }, 250);
    k6 = spawn('k6', ['run', '-e', 'BASE_URL=' + BASE_URL, SCRIPT], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    k6.on('error', (err) => {
      clearInterval(watch);
      console.error('[perf] failed to run k6 (is it installed and on PATH?): ' + err.message);
      resolve(1);
    });
    k6.on('exit', (code, signal) => {
      clearInterval(watch);
      if (signal) console.error('[perf] k6 terminated by signal ' + signal);
      resolve(serverExited || code === null ? 1 : code);
    });
  });
}

async function main() {
  if (await probe()) {
    console.error('[perf] ' + BASE_URL + ' already responds before start. Refusing to load-test an unknown process. Stop it or set PORT.');
    return 1;
  }

  console.log('[perf] starting server: npm start (PORT=' + PORT + ')');
  server = spawn('npm start', {
    cwd: REPO_ROOT,
    shell: true,
    detached: !IS_WIN,
    stdio: ['ignore', 'pipe', 'inherit'],
    env: Object.assign({}, process.env, { PORT: PORT }),
  });
  server.on('error', (err) => { serverExited = 'spawn error: ' + err.message; });
  server.on('exit', (code, signal) => { serverExited = 'exited (code=' + code + ', signal=' + signal + ')'; });
  // Ready only counts when OUR child reports it is listening, so a foreign process that
  // grabs the port after the pre-check cannot satisfy the readiness probe.
  server.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    if (!serverListening && chunk.toString().includes('Server running on')) serverListening = true;
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  let ready = false;
  while (Date.now() < deadline) {
    if (serverExited) {
      console.error('[perf] server ' + serverExited + ' before becoming ready');
      return 1;
    }
    if (serverListening && (await probe())) { ready = true; break; }
    await sleep(500);
  }
  if (!ready) {
    console.error('[perf] server not ready at ' + BASE_URL + '/api/status within ' + READY_TIMEOUT_MS / 1000 + 's');
    return 1;
  }
  console.log('[perf] server ready, running k6 smoke');
  return runK6();
}

main()
  .catch((err) => {
    console.error('[perf] unexpected error: ' + (err && err.stack || err));
    return 1;
  })
  .then(async (code) => {
    await cleanup();
    process.exit(code);
  });
