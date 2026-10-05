import { spawn, ChildProcess } from 'child_process';
import path from 'path';

/**
 * Boots the real Express server (server/src/app.ts via ts-node) as a child
 * process and waits for GET /api/health to respond before resolving.
 *
 * The app module calls app.listen() at import time (see server/src/app.ts),
 * so it cannot be safely `require`'d in-process without risking a double
 * listen / port clash with any server a human or another agent already has
 * running. Spawning a dedicated child process on an isolated port avoids
 * that entirely and gives this suite a clean, disposable server instance.
 */

const SERVER_DIR = path.join(__dirname, '../../server');
export const API_PORT = Number(process.env.API_E2E_PORT) || 3099;
export const BASE_URL = `http://localhost:${API_PORT}`;

let serverProcess: ChildProcess | null = null;

function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(`${BASE_URL}/api/health`)
        .then((res) => {
          if (res.ok) {
            resolve();
          } else if (Date.now() > deadline) {
            reject(new Error(`Server health check failed with status ${res.status}`));
          } else {
            setTimeout(attempt, 200);
          }
        })
        .catch((err) => {
          if (Date.now() > deadline) {
            reject(err);
          } else {
            setTimeout(attempt, 200);
          }
        });
    };
    attempt();
  });
}

export async function startServer(): Promise<void> {
  serverProcess = spawn(
    'node',
    ['node_modules/.bin/ts-node', 'src/app.ts'],
    {
      cwd: SERVER_DIR,
      env: { ...process.env, PORT: String(API_PORT) },
      stdio: 'pipe',
    }
  );

  serverProcess.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to spawn API server for e2e tests:', err);
  });

  await waitForHealth(20000);
}

export async function stopServer(): Promise<void> {
  if (!serverProcess) return;
  const proc = serverProcess;
  serverProcess = null;

  await new Promise<void>((resolve) => {
    const forceKill = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* already exited */
      }
      resolve();
    }, 5000);

    proc.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    proc.kill('SIGTERM');
  });
}
