import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer as createNetServer } from 'node:net';
import { test } from 'node:test';

const timeoutMs = 30_000;

async function findFreePort() {
  const server = createNetServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return port;
}

test('authentication rate limiting ignores spoofed X-Forwarded-For values', async (t) => {
  const databaseName = process.env.MYSQL_DATABASE || 'resume_ats';
  const databaseHost = process.env.MYSQL_HOST || '127.0.0.1';
  assert.notEqual(process.env.NODE_ENV, 'production');
  assert.equal(databaseName, 'resume_ats');
  assert.ok(['127.0.0.1', 'localhost', '::1'].includes(databaseHost));

  const port = await findFreePort();
  const appProcess = spawn(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'server.ts', '--port', String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JWT_SECRET_KEY: randomBytes(32).toString('hex'),
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: '1',
        SMTP_USER: 'local-rate-limit-test',
        SMTP_PASS: randomBytes(16).toString('hex'),
        MAIL_FROM: 'Rate Limit Test <noreply@example.invalid>',
        GEMINI_API_KEY: 'rate-limit-test-only',
        GEMINI_TEST_MODE: 'true',
        FASTAPI_ATS_URL: '',
        FASTAPI_ATS_TOKEN: '',
        NODE_ENV: 'test',
        PORT: String(port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let appOutput = '';
  const captureOutput = (chunk) => {
    appOutput = `${appOutput}${chunk.toString('utf8')}`.slice(-16 * 1024);
  };
  appProcess.stdout.on('data', captureOutput);
  appProcess.stderr.on('data', captureOutput);
  appProcess.stdout.resume();
  appProcess.stderr.resume();

  t.after(async () => {
    if (appProcess.exitCode === null) {
      appProcess.kill();
      await once(appProcess, 'exit');
    }
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;
  let ready = false;
  while (Date.now() < deadline) {
    if (appProcess.exitCode !== null) {
      assert.fail('Isolated Express process exited before readiness.');
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert.equal(ready, true, 'Isolated Express process did not become ready.');
  assert.equal(appOutput.includes('rate-limit-test-only'), false);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `192.0.2.${attempt + 1}`,
      },
      body: JSON.stringify({ email: 'invalid-email', password: 'not-a-real-password' }),
    });
    assert.equal(response.status, 400, `Request ${attempt + 1} should reach validation.`);
  }

  const spoofedRetry = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.250',
    },
    body: JSON.stringify({ email: 'invalid-email', password: 'not-a-real-password' }),
  });
  assert.equal(spoofedRetry.status, 429);
  assert.match(spoofedRetry.headers.get('retry-after') || '', /^\d+$/);
  const rateLimitBody = await spoofedRetry.json();
  assert.match(rateLimitBody.error || '', /^Too many attempts\./);
  assert.equal(JSON.stringify(rateLimitBody).includes('198.51.100.250'), false);
});
