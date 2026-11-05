import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { after, before, test } from 'node:test';
import mysql from 'mysql2/promise';

const timeoutMs = 30_000;
const testEmails = [
  `express-integration-${randomUUID()}@example.com`,
  `express-expiry-${randomUUID()}@example.com`,
  `express-gemini-${randomUUID()}@example.com`,
  `express-ats-${randomUUID()}@example.com`,
  `express-ats-other-${randomUUID()}@example.com`,
  `express-voice-${randomUUID()}@example.com`,
  `express-gemini-rate-${randomUUID()}@example.com`,
];
const testEmailPlaceholders = testEmails.map(() => '?').join(', ');

let smtpServer;
let smtpPort;
let httpPort;
let database;
let appProcess;
let fastApiMockServer;
let fastApiMockPort;
let fastApiToken;
const capturedMessages = [];
const smtpWaiters = new Set();
const fastApiRequests = [];
const sensitiveGeminiMarkers = [
  'integration-test-mock-only-key',
  'TEST_ONLY_SECRET_MUST_NOT_LEAK',
  'STACK_TRACE_MARKER',
  'at mockGeminiProvider',
  'PRIVATE_RESUME_TEXT_MUST_NOT_LEAK',
  'PRIVATE_PROVIDER_DETAIL_MUST_NOT_LEAK',
];
let appOutput = '';

function notifySmtpWaiters() {
  for (const waiter of smtpWaiters) {
    if (capturedMessages.length > waiter.afterCount) {
      smtpWaiters.delete(waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(capturedMessages[waiter.afterCount]);
    }
  }
}

function waitForSmtpMessage(afterCount) {
  if (capturedMessages.length > afterCount) {
    return Promise.resolve(capturedMessages[afterCount]);
  }

  return new Promise((resolve, reject) => {
    const waiter = {
      afterCount,
      resolve,
      timer: setTimeout(() => {
        smtpWaiters.delete(waiter);
        reject(new Error('Timed out waiting for the local SMTP test sink.'));
      }, timeoutMs),
    };
    smtpWaiters.add(waiter);
  });
}

function startSmtpSink() {
  smtpServer = createNetServer((socket) => {
    let input = '';
    let inData = false;
    let authStage = 0;
    socket.write('220 local SMTP test sink\r\n');

    socket.on('data', (chunk) => {
      input += chunk.toString('utf8');

      while (input.length > 0) {
        if (inData) {
          const end = input.indexOf('\r\n.\r\n');
          if (end < 0) return;
          capturedMessages.push(input.slice(0, end));
          input = input.slice(end + 5);
          inData = false;
          socket.write('250 Message accepted by local test sink\r\n');
          notifySmtpWaiters();
          continue;
        }

        const lineEnd = input.indexOf('\r\n');
        if (lineEnd < 0) return;
        const line = input.slice(0, lineEnd);
        input = input.slice(lineEnd + 2);

        if (authStage === 1) {
          authStage = 2;
          socket.write('334 UGFzc3dvcmQ6\r\n');
        } else if (authStage === 2) {
          authStage = 0;
          socket.write('235 Authentication accepted by local test sink\r\n');
        } else if (/^EHLO\b|^HELO\b/i.test(line)) {
          socket.write('250-localhost\r\n250-AUTH LOGIN PLAIN\r\n250 SIZE 10485760\r\n');
        } else if (/^AUTH LOGIN\b/i.test(line)) {
          authStage = 1;
          socket.write('334 VXNlcm5hbWU6\r\n');
        } else if (/^AUTH PLAIN\b/i.test(line)) {
          socket.write('235 Authentication accepted by local test sink\r\n');
        } else if (/^(MAIL FROM|RCPT TO|RSET|NOOP)\b/i.test(line)) {
          socket.write('250 OK\r\n');
        } else if (/^DATA\b/i.test(line)) {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (/^QUIT\b/i.test(line)) {
          socket.write('221 Closing connection\r\n');
          socket.end();
        } else {
          socket.write('500 Unsupported command\r\n');
        }
      }
    });
  });

  return new Promise((resolve, reject) => {
    smtpServer.once('error', reject);
    smtpServer.listen(0, '127.0.0.1', () => {
      smtpPort = smtpServer.address().port;
      resolve();
    });
  });
}

async function startFastApiMock() {
  fastApiMockServer = createHttpServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        res.writeHead(400).end();
        return;
      }

      const requestRecord = {
        path: req.url,
        body: payload,
        internalTokenValid: req.headers['x-internal-ats-token'] === fastApiToken,
        expressAuthorizationForwarded: Boolean(req.headers.authorization),
      };
      fastApiRequests.push(requestRecord);
      if (!requestRecord.internalTokenValid) {
        res.writeHead(401).end();
        return;
      }

      const jobDescription = payload.jobDescription;
      if (jobDescription === '__test_upstream_503__') {
        res.writeHead(503).end(JSON.stringify({ detail: 'mock upstream failure' }));
        return;
      }
      if (jobDescription === '__test_upstream_timeout__') {
        const timer = setTimeout(() => res.writeHead(200).end('{}'), 6000);
        res.on('close', () => clearTimeout(timer));
        return;
      }
      if (jobDescription === '__test_malformed_response__') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"success":true}');
        return;
      }
      if (jobDescription === '__test_oversized_response__') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': String(256 * 1024 + 1),
        }).end(' '.repeat(256 * 1024 + 1));
        return;
      }
      if (req.url === '/internal/ats/analyze') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
          score: 76,
          scoreLabel: 'Good',
          scoreColor: 'green',
          breakdown: [{ category: 'Keyword Match', score: 18, maxScore: 25, icon: 'Target' }],
          foundKeywords: ['PYTHON'],
          missingKeywords: ['AWS'],
          issues: [],
          aiSuggestions: {
            score_improvement_estimate: 20,
            suggestions: [{
              section: 'Skills',
              issue: 'Group related skills.',
              fix: 'Use clear skill categories.',
              example_rewrite: { before: '', after: 'Languages: [relevant languages]' },
            }],
            rewritten_summary: '',
            missing_keywords: ['AWS'],
          },
          wordCount: 30,
          charCount: 220,
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        success: true,
        result: {
          matchScore: 82,
          tfidfCosineSimilarity: 0.74,
          matchedKeywords: ['PYTHON', 'REACT'],
          missingKeywords: ['AWS'],
          recommendations: ['Include relevant missing terms only when accurate.'],
        },
      }));
    });
  });
  await new Promise((resolve, reject) => {
    fastApiMockServer.once('error', reject);
    fastApiMockServer.listen(0, '127.0.0.1', () => {
      fastApiMockPort = fastApiMockServer.address().port;
      resolve();
    });
  });
}

async function findFreePort() {
  const server = createNetServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function otpFromCapturedMessage(message) {
  const match = message.match(/\b(\d{6})\b/);
  assert.ok(match, 'Expected a six-digit code in the local test mail message.');
  return match[1];
}

function assertNoSensitiveGeminiDetails(value) {
  const serialized = JSON.stringify(value);
  for (const marker of sensitiveGeminiMarkers) {
    assert.equal(serialized.includes(marker), false, `Response exposed sensitive Gemini detail: ${marker}`);
  }
  for (const setting of ['GEMINI_API_KEY', 'GEMINI_TEST_MODE', 'JWT_SECRET_KEY', 'MYSQL_PASSWORD']) {
    assert.equal(serialized.includes(setting), false, `Response exposed sensitive configuration name: ${setting}`);
  }
}

async function request(path, options = {}) {
  return fetch(`http://127.0.0.1:${httpPort}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
}

async function waitForApp() {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (appProcess.exitCode !== null) {
      throw new Error('Express test process exited before becoming ready.');
    }
    try {
      const response = await request('/api/health');
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error('Timed out waiting for the isolated Express test process.');
}

before(async () => {
  const databaseName = process.env.MYSQL_DATABASE || 'resume_ats';
  const databaseHost = process.env.MYSQL_HOST || '127.0.0.1';
  assert.notEqual(process.env.NODE_ENV, 'production', 'Integration tests are disabled in production.');
  assert.equal(databaseName, 'resume_ats', 'Tests are restricted to the configured local resume_ats database.');
  assert.ok(
    ['127.0.0.1', 'localhost', '::1'].includes(databaseHost),
    'Integration tests require a loopback MySQL host.'
  );

  await startSmtpSink();
  await startFastApiMock();
  httpPort = await findFreePort();
  fastApiToken = randomBytes(32).toString('hex');

  try {
    database = await mysql.createConnection({
      host: databaseHost,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'resume_app',
      password: process.env.MYSQL_PASSWORD || '',
      database: databaseName,
      connectTimeout: 5000,
    });
    const [existing] = await database.execute(
      `SELECT email FROM app_users WHERE email IN (${testEmailPlaceholders})`,
      testEmails
    );
    assert.equal(existing.length, 0, 'A generated disposable test address already exists.');
  } catch {
    throw new Error('Could not establish the disposable Express integration-test database prerequisite.');
  }

  appProcess = spawn(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'server.ts', '--port', String(httpPort)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JWT_SECRET_KEY: randomBytes(32).toString('hex'),
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: String(smtpPort),
        SMTP_USER: 'local-test-sink',
        SMTP_PASS: randomBytes(16).toString('hex'),
        MAIL_FROM: 'Resume Builder Integration Test <noreply@example.invalid>',
        GEMINI_API_KEY: 'integration-test-mock-only-key',
        GEMINI_TEST_MODE: 'true',
        FASTAPI_ATS_URL: `http://127.0.0.1:${fastApiMockPort}`,
        FASTAPI_ATS_TOKEN: fastApiToken,
        NODE_ENV: 'test',
        PORT: String(httpPort),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const captureOutput = (chunk) => {
    appOutput = `${appOutput}${chunk.toString('utf8')}`.slice(-64 * 1024);
  };
  appProcess.stdout.on('data', captureOutput);
  appProcess.stderr.on('data', captureOutput);
  appProcess.stdout.resume();
  appProcess.stderr.resume();

  await waitForApp();
});

after(async () => {
  let cleanupError;
  if (database) {
    try {
      const [users] = await database.execute(
        `SELECT id FROM app_users WHERE email IN (${testEmailPlaceholders})`,
        testEmails
      );
      for (const user of users) {
        await database.execute('DELETE FROM app_resumes WHERE user_id = ?', [user.id]);
        await database.execute('DELETE FROM app_users WHERE id = ?', [user.id]);
      }
      const [remaining] = await database.execute(
        `SELECT COUNT(*) AS count FROM app_users WHERE email IN (${testEmailPlaceholders})`,
        testEmails
      );
      if (Number(remaining[0].count) !== 0) {
        cleanupError = new Error('Disposable Express test account cleanup could not be verified.');
      }
    } catch {
      cleanupError = new Error('Disposable Express test account cleanup failed.');
    } finally {
      await database.end();
    }
  }

  if (appProcess && appProcess.exitCode === null) {
    appProcess.kill();
    await once(appProcess, 'exit');
  }
  if (smtpServer) {
    await new Promise((resolve) => smtpServer.close(resolve));
  }
  if (fastApiMockServer) {
    await new Promise((resolve) => fastApiMockServer.close(resolve));
  }
  if (cleanupError) throw cleanupError;
});

test('registration OTP, password recovery, and resume CRUD use isolated mail and disposable MySQL records', async () => {
  const email = testEmails[0];
  const originalPassword = `Initial-${randomInt(100000, 1_000_000)}!a`;
  const newPassword = `Changed-${randomInt(100000, 1_000_000)}!b`;
  let messageIndex = capturedMessages.length;

  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: originalPassword, name: 'Disposable Test User' }),
  });
  assert.equal(registration.status, 201);
  const registrationBody = await registration.json();
  assert.equal(registrationBody.sentViaSmtp, true);

  const verificationMessage = await waitForSmtpMessage(messageIndex);
  messageIndex += 1;
  const verificationCode = otpFromCapturedMessage(verificationMessage);
  const incorrectCode = String((Number(verificationCode) % 900000) + 100000);
  const wrongVerification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: incorrectCode }),
  });
  assert.equal(wrongVerification.status, 400);

  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: verificationCode }),
  });
  assert.equal(verification.status, 200);
  assert.equal((await verification.json()).verified, true);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: originalPassword }),
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  const token = loginBody.token;
  assert.ok(token);
  const headers = { Authorization: `Bearer ${token}` };

  const create = await request('/api/resumes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Disposable integration resume',
      templateId: 'tmpl-1',
      accentColor: '#123456',
      content: { summary: 'Test-only resume content', skills: ['Testing'] },
    }),
  });
  assert.equal(create.status, 201);
  const created = (await create.json()).resume;
  assert.ok(created.id);
  assert.equal(created.content.summary, 'Test-only resume content');

  const unauthenticatedUpdate = await request(`/api/resumes/${encodeURIComponent(created.id)}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Unauthenticated change attempt' }),
  });
  assert.equal(unauthenticatedUpdate.status, 401);

  const get = await request(`/api/resumes/${encodeURIComponent(created.id)}`, { headers });
  assert.equal(get.status, 200);
  assert.equal((await get.json()).resume.id, created.id);

  const list = await request('/api/resumes', { headers });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).resumes.some((resume) => resume.id === created.id));

  const update = await request(`/api/resumes/${encodeURIComponent(created.id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      title: 'Updated disposable integration resume',
      content: { summary: 'Persisted after update' },
    }),
  });
  assert.equal(update.status, 200);

  for (const invalidContent of [null, [], 'not-an-object', 42]) {
    const invalidUpdate = await request(`/api/resumes/${encodeURIComponent(created.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content: invalidContent }),
    });
    assert.equal(invalidUpdate.status, 400);
    assert.equal((await invalidUpdate.json()).error, 'Resume content must be an object.');
  }

  const partialUpdate = await request(`/api/resumes/${encodeURIComponent(created.id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Partially updated disposable integration resume' }),
  });
  assert.equal(partialUpdate.status, 200);
  const partialUpdateBody = await partialUpdate.json();
  assert.equal(partialUpdateBody.resume.title, 'Partially updated disposable integration resume');
  assert.equal(partialUpdateBody.resume.content.summary, 'Persisted after update');

  const reread = await request(`/api/resumes/${encodeURIComponent(created.id)}`, { headers });
  assert.equal(reread.status, 200);
  const rereadResume = (await reread.json()).resume;
  assert.equal(rereadResume.content.summary, 'Persisted after update');
  assert.equal(rereadResume.title, 'Partially updated disposable integration resume');

  const deletion = await request(`/api/resumes/${encodeURIComponent(created.id)}`, {
    method: 'DELETE',
    headers,
  });
  assert.equal(deletion.status, 200);
  const afterDelete = await request(`/api/resumes/${encodeURIComponent(created.id)}`, { headers });
  assert.equal(afterDelete.status, 404);

  messageIndex = capturedMessages.length;
  const forgot = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  assert.equal(forgot.status, 200);
  const recoveryMessage = await waitForSmtpMessage(messageIndex);
  const recoveryCode = otpFromCapturedMessage(recoveryMessage);
  const wrongReset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, resetCode: String((Number(recoveryCode) % 900000) + 100000), newPassword }),
  });
  assert.equal(wrongReset.status, 400);

  const reset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, resetCode: recoveryCode, newPassword }),
  });
  assert.equal(reset.status, 200);

  const newLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: newPassword }),
  });
  assert.equal(newLogin.status, 200);
  const oldLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: originalPassword }),
  });
  assert.equal(oldLogin.status, 401);
});

test('expired signup OTP is rejected', async () => {
  const email = testEmails[1];
  const password = `Expiry-${randomInt(100000, 1_000_000)}!c`;
  const messageIndex = capturedMessages.length;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Disposable Expiry User' }),
  });
  assert.equal(registration.status, 201);

  const message = await waitForSmtpMessage(messageIndex);
  const code = otpFromCapturedMessage(message);
  await database.execute(
    'UPDATE app_users SET otp_expires_at = ? WHERE email = ?',
    [Date.now() - 1, email]
  );

  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: code }),
  });
  assert.equal(verification.status, 400);
  const response = await verification.json();
  assert.match(response.error, /expired/i);
});

test('authenticated Gemini routes use the test mock for success, failure and invalid input', async () => {
  const email = testEmails[2];
  const password = `Gemini-${randomInt(100000, 1_000_000)}!d`;
  const messageIndex = capturedMessages.length;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Disposable Gemini Test User' }),
  });
  assert.equal(registration.status, 201);

  const verificationMessage = await waitForSmtpMessage(messageIndex);
  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: otpFromCapturedMessage(verificationMessage) }),
  });
  assert.equal(verification.status, 200);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  const response = await request('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Harmless integration test prompt.' }] }),
  });
  assert.equal(response.status, 200);
  const successBody = await response.json();
  assert.deepEqual(successBody, {
    success: true,
    reply: 'Mocked Gemini response for integration testing.',
  });
  assertNoSensitiveGeminiDetails(successBody);

  const modelSelection = await request('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'GEMINI_MODEL_SELECTION_FIXTURE' }],
    }),
  });
  assert.equal(modelSelection.status, 200);
  assert.equal((await modelSelection.json()).reply, 'Mock model selection: gemini-3.5-flash');

  const guidedChat = await request('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'VOICE_CHAT_GUIDED_FIXTURE I want to create a resume.' },
        { role: 'model', content: 'What is your full name and target role?' },
        { role: 'user', content: 'My name is Asha Rao and I am a frontend developer.' },
      ],
      currentResume: {
        personalInfo: { fullName: 'Asha Rao', jobTitle: 'Frontend developer' },
        summary: '',
      },
    }),
  });
  assert.equal(guidedChat.status, 200);
  const guidedChatBody = await guidedChat.json();
  assert.equal(
    guidedChatBody.reply,
    'I can help organize the details you have shared. Please tell me your education and any projects you have completed.'
  );
  assertNoSensitiveGeminiDetails(guidedChatBody);

  const unauthenticated = await request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Harmless integration test prompt.' }] }),
  });
  assert.equal(unauthenticated.status, 401);

  const invalidInput = await request('/api/ai/rewrite-text', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: '   ' }),
  });
  assert.equal(invalidInput.status, 400);

  const providerFallback = await request('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'MOCK_GEMINI_PROVIDER_ERROR' }],
    }),
  });
  assert.equal(providerFallback.status, 200);
  const fallbackBody = await providerFallback.json();
  assert.equal(fallbackBody.success, true);
  assert.equal(fallbackBody.fallbackUsed, true);
  assertNoSensitiveGeminiDetails(fallbackBody);

  const providerError = await request('/api/ai/rewrite-text', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: 'MOCK_GEMINI_PROVIDER_ERROR' }),
  });
  assert.equal(providerError.status, 503);
  const errorBody = await providerError.json();
  assert.equal(errorBody.success, false);
  assert.equal(errorBody.error, 'AI rewrite service temporarily unavailable.');
  assertNoSensitiveGeminiDetails(errorBody);
  for (const marker of sensitiveGeminiMarkers) {
    assert.equal(appOutput.includes(marker), false, `Server logs exposed sensitive Gemini detail: ${marker}`);
  }
  assert.match(appOutput, /\[Gemini Fallback\] Provider attempt \d+ failed; trying configured fallback\./);

  const rateLimitEmail = testEmails[6];
  const rateLimitPassword = `GeminiRate-${randomInt(100000, 1_000_000)}!r`;
  const rateLimitMessageIndex = capturedMessages.length;
  const rateLimitRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: rateLimitEmail,
      password: rateLimitPassword,
      name: 'Disposable Gemini Rate-Limit User',
    }),
  });
  assert.equal(rateLimitRegistration.status, 201);

  const rateLimitVerificationMessage = await waitForSmtpMessage(rateLimitMessageIndex);
  const rateLimitVerification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: rateLimitEmail,
      otp: otpFromCapturedMessage(rateLimitVerificationMessage),
    }),
  });
  assert.equal(rateLimitVerification.status, 200);

  const rateLimitLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: rateLimitEmail, password: rateLimitPassword }),
  });
  assert.equal(rateLimitLogin.status, 200);
  const { token: rateLimitToken } = await rateLimitLogin.json();
  const rateLimitHeaders = { Authorization: `Bearer ${rateLimitToken}` };

  for (let call = 0; call < 10; call += 1) {
    const allowed = await request('/api/ai/chat', {
      method: 'POST',
      headers: rateLimitHeaders,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Rate-limit test prompt.' }] }),
    });
    assert.equal(allowed.status, 200);
  }
  const rateLimited = await request('/api/ai/chat', {
    method: 'POST',
    headers: rateLimitHeaders,
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Rate-limit test prompt.' }] }),
  });
  assert.equal(rateLimited.status, 429);
  assert.match(rateLimited.headers.get('retry-after') || '', /^\d+$/);
  assertNoSensitiveGeminiDetails(await rateLimited.json());
});

test('authenticated voice resume extraction is source-grounded, rate-limited and fails safely', async () => {
  const email = testEmails[5];
  const password = `Voice-${randomInt(100000, 1_000_000)}!v`;
  const messageIndex = capturedMessages.length;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Disposable Voice Test User' }),
  });
  assert.equal(registration.status, 201);

  const verificationMessage = await waitForSmtpMessage(messageIndex);
  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: otpFromCapturedMessage(verificationMessage) }),
  });
  assert.equal(verification.status, 200);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const transcript = [
    'VOICE_EXTRACTION_SUCCESS_FIXTURE Asha Rao. Frontend developer. Email asha.rao@example.com.',
    'Phone 555 010 2040. Location Bengaluru. LinkedIn linkedin.com/in/asharao.',
    'Frontend developer with React and TypeScript.',
    'At Northstar Labs from June 2022 to Present I worked as UI Developer in Bengaluru.',
    'Built design system. Bachelor of Computer Applications at University College.',
    'Skills React, TypeScript. Campus Portal project built portal.',
  ].join(' ');

  const unauthenticated = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });
  assert.equal(unauthenticated.status, 401);

  const invalidInput = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcript: 'too short' }),
  });
  assert.equal(invalidInput.status, 400);
  assertNoSensitiveGeminiDetails(await invalidInput.json());

  const success = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcript }),
  });
  assert.equal(success.status, 200);
  const successBody = await success.json();
  assert.equal(successBody.success, true);
  assert.equal(successBody.data.personalInfo.fullName, 'Asha Rao');
  assert.equal(successBody.data.experiences[0].company, 'Northstar Labs');
  assert.deepEqual(successBody.data.skills[0].skills, ['React', 'TypeScript']);
  assert.equal(Object.hasOwn(successBody, 'transcript'), false);
  assertNoSensitiveGeminiDetails(successBody);

  const ungrounded = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transcript: transcript.replace('VOICE_EXTRACTION_SUCCESS_FIXTURE', 'VOICE_EXTRACTION_INVALID_FIXTURE'),
    }),
  });
  assert.equal(ungrounded.status, 503);
  const ungroundedBody = await ungrounded.json();
  assert.equal(ungroundedBody.error, 'Could not extract a source-grounded resume right now. Review the transcript and try again.');
  assertNoSensitiveGeminiDetails(ungroundedBody);

  const providerFailure = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcript: 'MOCK_GEMINI_PROVIDER_ERROR. ' + transcript }),
  });
  assert.equal(providerFailure.status, 503);
  assertNoSensitiveGeminiDetails(await providerFailure.json());

  for (let call = 0; call < 6; call += 1) {
    const allowed = await request('/api/ai/extract-voice-resume', {
      method: 'POST',
      headers,
      body: JSON.stringify({ transcript }),
    });
    assert.equal(allowed.status, 200);
  }
  const rateLimited = await request('/api/ai/extract-voice-resume', {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcript }),
  });
  assert.equal(rateLimited.status, 429);
  assertNoSensitiveGeminiDetails(await rateLimited.json());
  for (const marker of sensitiveGeminiMarkers) {
    assert.equal(appOutput.includes(marker), false, `Server logs exposed sensitive Gemini detail: ${marker}`);
  }
});

test('authenticated ATS requests use the private FastAPI service and handle upstream failures safely', async () => {
  const email = testEmails[3];
  const password = `Ats-${randomInt(100000, 1_000_000)}!e`;
  const messageIndex = capturedMessages.length;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Disposable ATS Test User' }),
  });
  assert.equal(registration.status, 201);

  const verificationMessage = await waitForSmtpMessage(messageIndex);
  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: otpFromCapturedMessage(verificationMessage) }),
  });
  assert.equal(verification.status, 200);
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const resumeCreate = await request('/api/resumes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'ATS authorization test resume',
      content: { summary: 'Disposable owner-only resume' },
    }),
  });
  assert.equal(resumeCreate.status, 201);
  const ownerResume = (await resumeCreate.json()).resume;

  const otherEmail = testEmails[4];
  const otherPassword = `Other-${randomInt(100000, 1_000_000)}!f`;
  const otherMessageIndex = capturedMessages.length;
  const otherRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: otherEmail, password: otherPassword, name: 'Disposable Other ATS User' }),
  });
  assert.equal(otherRegistration.status, 201);
  const otherVerificationMessage = await waitForSmtpMessage(otherMessageIndex);
  const otherVerification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: otherEmail, otp: otpFromCapturedMessage(otherVerificationMessage) }),
  });
  assert.equal(otherVerification.status, 200);
  const otherLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: otherEmail, password: otherPassword }),
  });
  assert.equal(otherLogin.status, 200);
  const otherHeaders = { Authorization: `Bearer ${(await otherLogin.json()).token}` };
  const otherGet = await request(`/api/resumes/${encodeURIComponent(ownerResume.id)}`, { headers: otherHeaders });
  assert.equal(otherGet.status, 404);
  const otherUpdate = await request(`/api/resumes/${encodeURIComponent(ownerResume.id)}`, {
    method: 'PUT',
    headers: otherHeaders,
    body: JSON.stringify({ title: 'Unauthorized change attempt' }),
  });
  assert.equal(otherUpdate.status, 404);
  const otherDelete = await request(`/api/resumes/${encodeURIComponent(ownerResume.id)}`, {
    method: 'DELETE',
    headers: otherHeaders,
  });
  assert.equal(otherDelete.status, 404);
  const ownerReadback = await request(`/api/resumes/${encodeURIComponent(ownerResume.id)}`, { headers });
  assert.equal(ownerReadback.status, 200);
  assert.equal((await ownerReadback.json()).resume.title, 'ATS authorization test resume');

  const matchPayload = {
    resumeText: 'Python React SQL developer experience',
    jobDescription: 'Python React engineering role',
    targetRole: 'Software Engineer',
  };

  let upstreamCount = fastApiRequests.length;
  const unauthenticated = await request('/api/ai/match-job', {
    method: 'POST',
    body: JSON.stringify(matchPayload),
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(fastApiRequests.length, upstreamCount);

  const invalidInput = await request('/api/ai/match-job', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...matchPayload, resumeText: ' ' }),
  });
  assert.equal(invalidInput.status, 400);
  assert.equal(fastApiRequests.length, upstreamCount);

  const match = await request('/api/ai/match-job', {
    method: 'POST',
    headers,
    body: JSON.stringify(matchPayload),
  });
  assert.equal(match.status, 200);
  const matchBody = await match.json();
  assert.equal(matchBody.success, true);
  assert.equal(matchBody.result.matchScore, 82);
  assert.equal(matchBody.result.matchedKeywords[0], 'PYTHON');
  assert.equal(fastApiRequests.at(-1).internalTokenValid, true);
  assert.equal(fastApiRequests.at(-1).expressAuthorizationForwarded, false);
  assert.deepEqual(Object.keys(fastApiRequests.at(-1).body).sort(), [
    'jobDescription',
    'resumeText',
    'targetRole',
  ]);
  upstreamCount = fastApiRequests.length;

  for (const [description, expectedStatus, expectedMessage] of [
    ['__test_upstream_503__', 503, 'ATS processing service is temporarily unavailable.'],
    ['__test_upstream_timeout__', 504, 'ATS processing service timed out.'],
    ['__test_malformed_response__', 502, 'ATS processing service returned an invalid response.'],
    ['__test_oversized_response__', 502, 'ATS processing service returned an invalid response.'],
  ]) {
    const upstreamFailure = await request('/api/ai/match-job', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...matchPayload, jobDescription: description }),
    });
    assert.equal(upstreamFailure.status, expectedStatus);
    const failureBody = await upstreamFailure.json();
    assert.equal(failureBody.error, expectedMessage);
    assert.equal(JSON.stringify(failureBody).includes(fastApiToken), false);
  }

  const unauthorizedAnalyze = await request('/api/ats/analyze', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(unauthorizedAnalyze.status, 401);

  const resumeText = 'Python React SQL experience with measurable project outcomes. '.repeat(5);
  const analysis = await request('/api/ats/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileBase64: Buffer.from(resumeText).toString('base64'),
      mimeType: 'text/plain',
      fileName: 'resume.txt',
      jobDescription: 'Python React engineering position',
    }),
  });
  assert.equal(analysis.status, 200);
  const analysisBody = await analysis.json();
  assert.equal(analysisBody.success, true);
  assert.equal(analysisBody.data.scoreLabel, 'Good');
  assert.equal(analysisBody.data.breakdown[0].category, 'Keyword Match');
  assert.equal(fastApiRequests.at(-1).path, '/internal/ats/analyze');
  assert.deepEqual(Object.keys(fastApiRequests.at(-1).body).sort(), ['jobDescription', 'resumeText']);
  assert.equal(JSON.stringify(analysisBody).includes(fastApiToken), false);
  assert.ok(fastApiRequests.length > upstreamCount);
});
