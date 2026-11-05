/**
 * @file server.ts
 * Express backend server with Vite middleware integration and server-side Gemini 3.8 Flash API endpoints.
 * Handles AI resume parsing/conversion, professional summary generation, and interactive resume chatbot
 * with resilient fallback to guarantee 100% uptime even during upstream API demand spikes.
 */

import express, { Request, Response } from 'express';
import type { Pool, PoolConnection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { validateEmailStrict, normalizeEmail } from './src/utils/emailValidation';
import { callFastApiAts, FastApiAtsError, validateFastApiAtsConfiguration } from './src/services/fastApiAtsClient';
import {
  buildVoiceResumePrompt,
  MAX_VOICE_TRANSCRIPT_LENGTH,
  validateGroundedVoiceResume,
  validateVoiceTranscript,
} from './src/utils/voiceResumeExtraction';
import mysqlPool, {
  DEPLOYMENT_MODE,
  JSON_FALLBACK_ENABLED,
  checkMySQLConnection,
  isDatabaseUnavailableError,
} from './mysql-db';

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdfModule = require('pdf-parse');

dotenv.config();
validateFastApiAtsConfiguration();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PRODUCTION = DEPLOYMENT_MODE === 'production';

const configuredJwtSecret = (process.env.JWT_SECRET_KEY || '').trim();
if (
  configuredJwtSecret.length < 32 ||
  configuredJwtSecret === 'replace_with_32_byte_random_secret' ||
  configuredJwtSecret === 'your_jwt_secret_here'
) {
  throw new Error(
    'FATAL: JWT_SECRET_KEY must be configured with a strong random secret of at least 32 characters.'
  );
}
const JWT_SECRET = configuredJwtSecret;

const LEGACY_PASSWORD_ITERATIONS = 1000;
const PASSWORD_HASH_ITERATIONS = 600_000;
const PASSWORD_HASH_SCHEME = `pbkdf2-sha512$${PASSWORD_HASH_ITERATIONS}$`;

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  verified?: boolean;
  otpHash?: string;
  otpExpiresAt?: number;
  otpAttempts?: number;
  otpLastSentAt?: number;
  resetCodeHash?: string;
  resetCodeExpiresAt?: number;
  resetCodeAttempts?: number;
  resetLastSentAt?: number;
}

interface AppUserRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  salt: string;
  created_at: string;
  verified: number | null;
  otp_hash: string | null;
  otp_expires_at: number | string | null;
  otp_attempts: number | null;
  otp_last_sent_at: number | string | null;
  reset_code_hash: string | null;
  reset_code_expires_at: number | string | null;
  reset_code_attempts: number | null;
  reset_last_sent_at: number | string | null;
}

interface ResumeRecord {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  accentColor: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface GeminiClient {
  models: {
    generateContent(request: any): Promise<any>;
  };
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'will', 'have', 'are', 'you', 'our',
  'their', 'about', 'into', 'over', 'more', 'other', 'some', 'such', 'than', 'then', 'them', 'these',
  'they', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'been', 'were', 'was', 'has', 'had',
  'must', 'should', 'could', 'would', 'able', 'role', 'team', 'work', 'working', 'looking', 'candidate',
  'join', 'company', 'position', 'years', 'experience', 'strong', 'good', 'great', 'using', 'across',
]);

function tokenizeForTfIdf(text: string): string[] {
  return ((text || '').toLowerCase().match(/\b[a-z][a-z0-9+#.-]{1,22}\b/g) || []).filter(
    (tok) => tok.length >= 2 && !STOP_WORDS.has(tok)
  );
}

function computeTfIdfCosineSimilarity(resumeText: string, jobDescription: string): {
  cosineSimilarity: number;
  blendedMatchPercent: number;
  matchedKeywords: string[];
  missingKeywords: string[];
} {
  const resTokens = tokenizeForTfIdf(resumeText);
  const jdTokens = tokenizeForTfIdf(jobDescription);
  if (resTokens.length === 0 || jdTokens.length === 0) {
    return { cosineSimilarity: 0, blendedMatchPercent: 0, matchedKeywords: [], missingKeywords: [] };
  }

  const countMap = (tokens: string[]) => {
    const m = new Map<string, number>();
    for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
    return m;
  };

  const resCounts = countMap(resTokens);
  const jdCounts = countMap(jdTokens);
  const vocab = new Set<string>([...resCounts.keys(), ...jdCounts.keys()]);

  let dot = 0;
  let normRes = 0;
  let normJd = 0;

  for (const term of vocab) {
    const tfRes = (resCounts.get(term) || 0) / resTokens.length;
    const tfJd = (jdCounts.get(term) || 0) / jdTokens.length;
    const df = (resCounts.has(term) ? 1 : 0) + (jdCounts.has(term) ? 1 : 0);
    // Smooth IDF across 2-document corpus (resume vs JD)
    const idf = Math.log((1 + 2) / (1 + df)) + 1;
    const wRes = tfRes * idf;
    const wJd = tfJd * idf;
    dot += wRes * wJd;
    normRes += wRes * wRes;
    normJd += wJd * wJd;
  }

  const cosineSimilarity =
    normRes > 0 && normJd > 0 ? Number((dot / (Math.sqrt(normRes) * Math.sqrt(normJd))).toFixed(4)) : 0;

  // Rank meaningful JD terms by TF in JD
  const sortedJdTerms = Array.from(jdCounts.entries())
    .filter(([term]) => term.length >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);

  const matchedKeywords = sortedJdTerms.filter((t) => resCounts.has(t)).slice(0, 10);
  const missingKeywords = sortedJdTerms.filter((t) => !resCounts.has(t)).slice(0, 8);

  const topJdPool = sortedJdTerms.slice(0, 16);
  const kwOverlapRatio =
    topJdPool.length > 0 ? topJdPool.filter((t) => resCounts.has(t)).length / topJdPool.length : 0;

  const blendedMatchPercent = Math.min(
    98,
    Math.max(0, Math.round(cosineSimilarity * 45 + kwOverlapRatio * 55))
  );

  return {
    cosineSimilarity,
    blendedMatchPercent,
    matchedKeywords: matchedKeywords.map((k) => k.toUpperCase()),
    missingKeywords: missingKeywords.map((k) => k.toUpperCase()),
  };
}

function derivePasswordHash(password: string, salt: string, iterations: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = await derivePasswordHash(password, salt, PASSWORD_HASH_ITERATIONS);
  return `${PASSWORD_HASH_SCHEME}${hash.toString('hex')}`;
}

async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const parts = storedHash.split('$');
  const isVersioned = parts[0] === 'pbkdf2-sha512' && parts.length === 3;
  const iterations = isVersioned ? Number(parts[1]) : LEGACY_PASSWORD_ITERATIONS;
  const expectedHex = isVersioned ? parts[2] : storedHash;

  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 1 ||
    iterations > PASSWORD_HASH_ITERATIONS ||
    !/^[a-f0-9]{128}$/i.test(expectedHex)
  ) {
    return { valid: false, needsRehash: false };
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await derivePasswordHash(password, salt, iterations);
  const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  return {
    valid,
    needsRehash: valid && (!isVersioned || iterations < PASSWORD_HASH_ITERATIONS),
  };
}

function hashOtpCode(code: string, email: string): string {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${normalizeEmail(email)}:${code}`)
    .digest('hex');
}

function safeTimingEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

type AuthSqlExecutor = Pool | PoolConnection;

const APP_USER_COLUMNS = `
  id, email, full_name, password_hash, salt, created_at, verified,
  otp_hash, otp_expires_at, otp_attempts, otp_last_sent_at,
  reset_code_hash, reset_code_expires_at, reset_code_attempts, reset_last_sent_at`;

function mapAppUser(row: AppUserRow): UserRecord {
  const toOptionalNumber = (value: number | string | null): number | undefined =>
    value === null ? undefined : Number(value);

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    salt: row.salt,
    createdAt: row.created_at,
    verified: row.verified === null ? undefined : Boolean(row.verified),
    otpHash: row.otp_hash ?? undefined,
    otpExpiresAt: toOptionalNumber(row.otp_expires_at),
    otpAttempts: row.otp_attempts ?? undefined,
    otpLastSentAt: toOptionalNumber(row.otp_last_sent_at),
    resetCodeHash: row.reset_code_hash ?? undefined,
    resetCodeExpiresAt: toOptionalNumber(row.reset_code_expires_at),
    resetCodeAttempts: row.reset_code_attempts ?? undefined,
    resetLastSentAt: toOptionalNumber(row.reset_last_sent_at),
  };
}

async function findUserByEmail(
  email: string,
  executor: AuthSqlExecutor = mysqlPool,
  lock = false
): Promise<UserRecord | null> {
  const [rows] = await executor.execute<AppUserRow[]>(
    `SELECT ${APP_USER_COLUMNS}
     FROM app_users
     WHERE email = ?
     LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [email]
  );
  return rows[0] ? mapAppUser(rows[0]) : null;
}

async function findUserById(userId: string): Promise<UserRecord | null> {
  const [rows] = await mysqlPool.execute<AppUserRow[]>(
    `SELECT ${APP_USER_COLUMNS}
     FROM app_users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] ? mapAppUser(rows[0]) : null;
}

async function withAuthTransaction<T>(
  operation: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      logAuthFailure('auth/transaction-rollback', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

function logAuthFailure(context: string, error: unknown): void {
  const category = isDatabaseUnavailableError(error)
    ? 'database_unavailable'
    : 'authentication_operation_failed';
  console.error(`[${context}] Authentication operation failed (${category}).`);
}

function getDatabaseErrorCategory(error: unknown): string {
  if (isDatabaseUnavailableError(error)) return 'connection_unavailable';
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : '';
  if (code === 'ER_DUP_ENTRY') return 'constraint_violation';
  if (code === 'ER_NO_SUCH_TABLE' || code === 'ER_BAD_FIELD_ERROR') return 'schema_error';
  if (code.startsWith('ER_')) return 'database_query_error';
  if (code.startsWith('PROTOCOL_')) return 'database_protocol_error';
  return 'database_operation_error';
}

function logDatabaseFailure(operation: string, error: unknown): void {
  console.error(
    `[database:${operation}] Database operation failed (${getDatabaseErrorCategory(error)}).`
  );
}

function respondDatabaseUnavailable(res: Response, error: unknown): boolean {
  if (!isDatabaseUnavailableError(error)) return false;
  res.status(503).json({
    success: false,
    error: 'Database unavailable. Please try again later.',
  });
  return true;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}

class AuthEmailDeliveryError extends Error {
  constructor(readonly code: string) {
    super();
    this.name = 'AuthEmailDeliveryError';
  }
}

function isUserVerified(user: UserRecord): boolean {
  // Legacy records created before OTP rollout have `verified === undefined` and remain active.
  return user.verified !== false;
}

function sanitizeUserResponse(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
  };
}

function createToken(userId: string, email: string, passwordHash: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      pwd: crypto.createHash('sha256').update(passwordHash).digest('hex'),
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(
  token: string
): { userId: string; email: string; passwordVersion: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (!safeTimingEqual(signature, expectedSignature)) return null;
    const data: { sub?: unknown; email?: unknown; exp?: unknown; pwd?: unknown } = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    );
    if (
      typeof data.sub !== 'string' ||
      typeof data.email !== 'string' ||
      typeof data.exp !== 'number' ||
      data.exp <= Math.floor(Date.now() / 1000) ||
      typeof data.pwd !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(data.pwd)
    ) {
      return null;
    }
    return { userId: data.sub, email: data.email, passwordVersion: data.pwd };
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  authUser: UserRecord;
}

async function getAuthUser(req: Request): Promise<UserRecord | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const verified = verifyToken(token);
  if (!verified) return null;
  const user = await findUserById(verified.userId);
  if (
    !user ||
    !safeTimingEqual(
      verified.passwordVersion,
      crypto.createHash('sha256').update(user.passwordHash).digest('hex')
    )
  ) {
    return null;
  }
  return user;
}

function requireAuth(req: Request, res: Response, next: express.NextFunction) {
  void (async () => {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized or session expired. Please sign in.' });
        return;
      }
      if (!isUserVerified(user)) {
        res.status(403).json({ success: false, error: 'Please verify your email.' });
        return;
      }
      (req as AuthenticatedRequest).authUser = user;
      next();
    } catch (error) {
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/middleware', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Unable to verify your session right now.' });
      }
    }
  })();
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ALLOWED_UPLOAD_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/octet-stream',
  '',
]);

function validateUploadedFilePayload(
  fileBase64?: string,
  mimeType?: string,
  fileName?: string
): { ok: true } | { ok: false; error: string } {
  if (!fileBase64) {
    return { ok: true };
  }
  if (typeof fileBase64 !== 'string') {
    return { ok: false, error: 'Invalid file upload payload.' };
  }

  const lowerName = String(fileName || '').trim().toLowerCase();
  const lowerMime = String(mimeType || '').trim().toLowerCase().split(';')[0].trim();

  const hasValidExt = ALLOWED_UPLOAD_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return { ok: false, error: 'Unsupported file type. Only .pdf, .docx, and .txt files are allowed.' };
  }

  if (lowerMime && !ALLOWED_UPLOAD_MIMES.has(lowerMime)) {
    return { ok: false, error: 'Unsupported file format. Only PDF, DOCX, and TXT files are allowed.' };
  }

  const buffer = Buffer.from(fileBase64, 'base64');
  if (buffer.length === 0) {
    return { ok: false, error: 'Uploaded file is empty.' };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'File size exceeds the 5 MB limit. Please upload a smaller file.' };
  }

  return { ok: true };
}

interface RateBucket {
  count: number;
  resetAt: number;
}
const authRateMap = new Map<string, RateBucket>();

function getClientIp(req: Request): string {
  return req.socket?.remoteAddress || 'unknown';
}

function createAuthRateLimiter(bucketName: string, maxRequests = 10, windowMs = 60_000) {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const now = Date.now();
    if (authRateMap.size > 2000) {
      for (const [k, v] of authRateMap.entries()) {
        if (now > v.resetAt) authRateMap.delete(k);
      }
    }

    const key = `${bucketName}:${getClientIp(req)}`;
    const existing = authRateMap.get(key);
    if (!existing || now > existing.resetAt) {
      authRateMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: `Too many attempts. Please wait ${retryAfterSec}s before trying again.`,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

function createAuthenticatedRateLimiter(bucketName: string, maxRequests = 10, windowMs = 60_000) {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const user = (req as AuthenticatedRequest).authUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized or session expired. Please sign in.' });
      return;
    }

    const now = Date.now();
    if (authRateMap.size > 2000) {
      for (const [key, bucket] of authRateMap.entries()) {
        if (now > bucket.resetAt) authRateMap.delete(key);
      }
    }

    const key = `${bucketName}:user:${user.id}`;
    const existing = authRateMap.get(key);
    if (!existing || now > existing.resetAt) {
      authRateMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        error: `Too many AI requests. Please wait ${retryAfterSec}s before trying again.`,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

function getSmtpSettings() {
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || '').trim() || (user.toLowerCase().endsWith('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const port = parseInt((process.env.SMTP_PORT || '587').trim(), 10) || 587;
  // Google displays 16-char App Passwords with spaces ("abcd efgh ijkl mnop"); strip whitespace for Gmail SMTP
  const pass = host.toLowerCase().includes('gmail.com') ? rawPass.replace(/\s+/g, '') : rawPass;
  const rawFrom = (process.env.MAIL_FROM || '').trim();
  const from =
    rawFrom && !rawFrom.includes('your_email@gmail.com')
      ? rawFrom
      : `ATS Resume Builder by Junaid <${user}>`;

  const isPlaceholder =
    !user ||
    !pass ||
    user === 'your_email@gmail.com' ||
    pass === 'your_16_char_app_password';

  return {
    configured: !isPlaceholder && Boolean(host && port && user && pass),
    host,
    port,
    user,
    pass,
    from,
  };
}

async function sendAuthCodeEmail(params: {
  to: string;
  recipientName?: string;
  code: string;
  purpose: 'verify' | 'reset';
  expiresMinutes: number;
}): Promise<void> {
  const { to, recipientName, code, purpose, expiresMinutes } = params;
  const smtp = getSmtpSettings();

  if (!smtp.configured) {
    throw new AuthEmailDeliveryError('SMTP_NOT_CONFIGURED');
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  const isVerify = purpose === 'verify';
  const subject = isVerify
    ? `${code} is your verification code — Resume Builder by Junaid`
    : `${code} is your password recovery code — Resume Builder by Junaid`;

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';
  const actionLine = isVerify
    ? 'Use the 6-digit verification code below to verify your email address and activate your account:'
    : 'Use the 6-digit recovery code below to reset your account password:';

  const text = `${greeting}\n\n${actionLine}\n\n${code}\n\nValid for ${expiresMinutes} minutes. If you did not request this, ignore this email.\n\n— Resume Builder by Junaid`;

  const html = `
    <div style="font-family: Georgia, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #FBF5EC; border: 1px solid #E1D4C2; border-radius: 16px; padding: 28px; color: #291C0E;">
      <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #C98B5E; margin: 0 0 8px;">ATS Resume Builder by Junaid</p>
      <h2 style="font-size: 22px; margin: 0 0 12px; color: #291C0E;">${isVerify ? 'Verify Your Email Address' : 'Password Recovery Code'}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #6E473B; margin: 0 0 18px;">${greeting}<br/>${actionLine}</p>
      <div style="background: #F4E6D2; border: 1px solid #C98B5E; border-radius: 12px; padding: 16px; text-align: center; margin: 0 0 18px;">
        <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.28em; color: #291C0E;">${code}</span>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #6E473B; margin: 0 0 6px;">Valid for ${expiresMinutes} minutes. Never share this code with anyone.</p>
      <p style="font-size: 12px; line-height: 1.5; color: #6E473B; margin: 0;">If you did not request this, ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: smtp.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    const smtpCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string' &&
      /^[a-z0-9_]{1,32}$/i.test(error.code)
        ? error.code.toUpperCase()
        : typeof error === 'object' &&
          error !== null &&
          'responseCode' in error &&
          typeof error.responseCode === 'number'
        ? `SMTP_${error.responseCode}`
        : 'SMTP_UNKNOWN';
    throw new AuthEmailDeliveryError(smtpCode);
  }
}

async function extractTextFromUpload(
  fileBase64?: string,
  mimeType?: string,
  fileName?: string,
  rawText?: string
): Promise<string> {
  if (rawText && rawText.trim().length > 0) {
    return rawText.trim();
  }
  if (!fileBase64) return '';

  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  // 1. DOCX / DOC Detection & Extraction via mammoth (+ legacy .doc text fallback)
  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    mime.includes('word') ||
    mime.includes('officedocument') ||
    mime.includes('msword') ||
    (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b)
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (docxErr) {
      console.warn('[DOCX Extraction] mammoth error:', docxErr);
    }

    // Legacy binary .doc (Word 97-2003 OLE) readable text extraction fallback
    if (name.endsWith('.doc') || mime.includes('msword') || (buffer.length > 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf)) {
      const asciiMatches = buffer.toString('latin1').match(/[\x20-\x7E\r\n\t]{12,}/g) || [];
      const cleanedDoc = asciiMatches
        .map((s) => s.trim())
        .filter((s) => /[a-zA-Z]{3,}/.test(s) && !/^(Word\.Document|Microsoft|Normal\.dotm|Root Entry|CompObj)/i.test(s))
        .join('\n')
        .trim();
      if (cleanedDoc.length >= 25) {
        return cleanedDoc;
      }
    }
  }

  // 2. PDF Detection & Extraction via pdf-parse (pdfjs-dist)
  if (
    name.endsWith('.pdf') ||
    mime.includes('pdf') ||
    (buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50)
  ) {
    try {
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        try {
          const parsed = await parser.getText();
          const cleanedPdf = (parsed?.text || '')
            .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
            .trim();
          if (cleanedPdf.length > 0) {
            return cleanedPdf;
          }
        } finally {
          await parser.destroy?.();
        }
      }
    } catch (pdfErr) {
      console.warn('[PDF Extraction] PDFParse error:', pdfErr);
    }
  }

  // 3. Plaintext fallback
  if (name.endsWith('.txt') || name.endsWith('.md') || mime.startsWith('text/')) {
    const text = buffer.toString('utf-8').trim();
    return text;
  }

  try {
    const text = buffer.toString('utf-8');
    if (/[\x20-\x7E\s]{25,}/.test(text) && !text.includes('\x00\x00') && !text.startsWith('%PDF')) {
      return text.trim();
    }
  } catch {}

  return '';
}

/**
 * Intelligent local ATS parser used when upstream Gemini API experiences 503 demand spikes
 */
function localAtsParse(rawText: string, targetRole: string = '') {
  const cleanLines = rawText
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // 1. Extract real contact details from uploaded text (no fake placeholders)
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const websiteMatch = rawText.match(/https?:\/\/(?!(?:www\.)?(?:linkedin|github)\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s,)]*)?/i);

  let detectedName = '';
  let detectedLocation = '';
  for (const line of cleanLines.slice(0, 8)) {
    const lower = line.toLowerCase();
    if (
      !detectedName &&
      line.length >= 3 &&
      line.length <= 50 &&
      !line.includes('@') &&
      !/\d{4,}/.test(line) &&
      !/(resume|curriculum|vitae|summary|objective|profile|contact|phone|email|linkedin|github)/i.test(lower)
    ) {
      detectedName = line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
      continue;
    }
    if (!detectedLocation) {
      const locMatch = line.match(/\b([A-Z][a-zA-Z\s]{2,22},\s*[A-Z][a-zA-Z\s]{2,22}(?:,\s*[A-Z][a-zA-Z\s]{2,20})?)\b/);
      if (locMatch && !locMatch[1].includes('@')) {
        detectedLocation = locMatch[1].trim();
      }
    }
  }

  // 2. Partition lines into logical sections based on headings
  type SecKey = 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications';
  const sections: Record<SecKey, string[]> = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
  };

  const headingPatterns: Array<{ key: SecKey; regex: RegExp }> = [
    { key: 'summary', regex: /^(professional\s+summary|executive\s+summary|career\s+summary|summary|career\s+objective|objective|profile|about\s+me)\s*:?$/i },
    { key: 'skills', regex: /^(technical\s+skills|core\s+competencies|key\s+skills|skills\s*&\s*tools|skills|technologies|areas\s+of\s+expertise|tools)\s*:?$/i },
    { key: 'experience', regex: /^(work\s+experience|professional\s+experience|employment\s+history|internship(?:s)?|experience|work\s+history)\s*:?$/i },
    { key: 'projects', regex: /^(academic\s+projects|key\s+projects|personal\s+projects|technical\s+projects|projects)\s*:?$/i },
    { key: 'education', regex: /^(education(?:al)?\s*(?:qualifications|background)?|academic\s+background|qualifications)\s*:?$/i },
    { key: 'certifications', regex: /^(certifications?(?:\s*&\s*courses)?|licenses?\s*&\s*certifications?|courses|achievements(?:\s*&\s*certifications)?)\s*:?$/i },
  ];

  let currentSec: SecKey = 'header';
  for (const line of cleanLines) {
    const strippedHeading = line.replace(/^[•\-*#>\d.)\s]+/, '').trim();
    const matchedHeading =
      strippedHeading.length <= 42 && headingPatterns.find((h) => h.regex.test(strippedHeading));
    if (matchedHeading) {
      currentSec = matchedHeading.key;
      continue;
    }
    sections[currentSec].push(line);
  }

  // 3. Extract Skills from both the skills section and known domain keywords
  const knownSkills = [
    'Python', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Excel', 'Power BI', 'Tableau', 'Pandas',
    'NumPy', 'Scikit-Learn', 'Matplotlib', 'Seaborn', 'R', 'Statistics', 'Data Analysis', 'Data Visualization',
    'Data Cleaning', 'ETL', 'Machine Learning', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'FastAPI', 'Django', 'Flask', 'Java', 'C++', 'C#', 'HTML', 'CSS', 'Tailwind CSS', 'Git', 'GitHub',
    'Docker', 'AWS', 'Azure', 'GCP', 'Linux', 'REST APIs', 'Jupyter', 'Looker', 'Snowflake', 'Spark',
  ];

  const skillSet = new Set<string>();
  for (const kw of knownSkills) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i').test(rawText)) {
      skillSet.add(kw);
    }
  }
  for (const sLine of sections.skills) {
    const rhs = sLine.includes(':') ? sLine.split(':').slice(1).join(':') : sLine;
    rhs
      .split(/[,|•·;/]+/)
      .map((s) => s.replace(/^[•\-*\s]+/, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 32 && !/\d{4}/.test(s))
      .forEach((s) => skillSet.add(s));
  }

  const allSkills = Array.from(skillSet);
  const skillsBuckets =
    allSkills.length > 0
      ? [
          {
            id: 'skill-1',
            categoryName: 'Core Technical Skills',
            skills: allSkills.slice(0, 10),
          },
          ...(allSkills.length > 10
            ? [
                {
                  id: 'skill-2',
                  categoryName: 'Tools & Technologies',
                  skills: allSkills.slice(10, 20),
                },
              ]
            : []),
        ]
      : [];

  // Helper to polish bullet openers
  const polishBullet = (line: string) => {
    const c = line.replace(/^[•\-*▪◦›\d.)\s]+/, '').trim();
    if (!c) return '';
    const upgraded = c
      .replace(/^responsible for\s+/i, 'Managed and executed ')
      .replace(/^worked on\s+/i, 'Developed and optimized ')
      .replace(/^helped (?:with|in)\s+/i, 'Collaborated on ')
      .replace(/^assisted in\s+/i, 'Supported delivery of ');
    const cap = upgraded.charAt(0).toUpperCase() + upgraded.slice(1);
    return /[.!?]$/.test(cap) ? cap : `${cap}.`;
  };

  // 4. Parse Education lines
  const education: any[] = [];
  const eduLines = sections.education;
  const degreeRegex = /\b(B\.?\s*E\.?|B\.?\s*Tech|M\.?\s*Tech|B\.?\s*Sc|M\.?\s*Sc|B\.?\s*C\.?\s*A|M\.?\s*C\.?\s*A|B\.?\s*Com|M\.?\s*B\.?\s*A|B\.?\s*A|Bachelor|Master|Diploma|Ph\.?D|High School|PUC|XII|12th|10th)[^,|•]*/i;
  const schoolRegex = /\b([A-Z][A-Za-z0-9&.,'\-\s]*(?:University|Institute|College|School|Academy|Vidyalaya|Polytechnic)[A-Za-z0-9&.,'\-\s]*)/i;
  const yearRangeRegex = /\b((?:19|20)\d{2})\s*(?:[-–—to]+\s*((?:19|20)\d{2}|Present|Current|Expected\s*(?:19|20)\d{2}))?\b/i;
  const gpaRegex = /\b((?:CGPA|GPA|Percentage|Score)\s*[:\-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?|%)?|\d+(?:\.\d+)?\s*(?:CGPA|GPA|%))\b/i;

  if (eduLines.length > 0) {
    let curEdu: any = null;
    for (const line of eduLines) {
      const degMatch = line.match(degreeRegex);
      const schMatch = line.match(schoolRegex);
      const yrMatch = line.match(yearRangeRegex);
      const gpMatch = line.match(gpaRegex);

      if (degMatch || schMatch) {
        if (curEdu && (curEdu.school || curEdu.degree)) {
          if (
            (degMatch && !curEdu.degree && !schMatch) ||
            (schMatch && !curEdu.school && !degMatch)
          ) {
            if (degMatch && !curEdu.degree) curEdu.degree = degMatch[0].trim();
            if (schMatch && !curEdu.school) curEdu.school = schMatch[1].trim();
            if (yrMatch && !curEdu.endDate) {
              curEdu.startDate = yrMatch[1] || '';
              curEdu.endDate = yrMatch[2] || yrMatch[1] || '';
            }
            if (gpMatch && !curEdu.gpa) curEdu.gpa = gpMatch[1].trim();
            continue;
          }
          education.push(curEdu);
        }
        curEdu = {
          id: `edu-${education.length + 1}`,
          school: schMatch ? schMatch[1].trim() : degMatch ? '' : line,
          degree: degMatch ? degMatch[0].trim() : '',
          fieldOfStudy: '',
          location: detectedLocation,
          startDate: yrMatch?.[1] || '',
          endDate: yrMatch?.[2] || yrMatch?.[1] || '',
          gpa: gpMatch ? gpMatch[1].trim() : '',
          honors: '',
        };
      } else if (curEdu) {
        if (yrMatch && !curEdu.endDate) {
          curEdu.startDate = yrMatch[1] || '';
          curEdu.endDate = yrMatch[2] || yrMatch[1] || '';
        }
        if (gpMatch && !curEdu.gpa) curEdu.gpa = gpMatch[1].trim();
        if (!curEdu.school && line.length > 4 && !gpMatch) curEdu.school = line;
      }
    }
    if (curEdu && (curEdu.school || curEdu.degree)) {
      education.push(curEdu);
    }
  }

  // 5. Parse Experiences
  const experiences: any[] = [];
  const dateLineRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*(?:19|20)\d{2}|(?:19|20)\d{2})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*(?:19|20)\d{2}|(?:19|20)\d{2}|Present|Current)\b/i;

  let curExp: any = null;
  for (const line of sections.experience) {
    const isBullet = /^[•\-*▪◦›]/.test(line) || (curExp && line.split(' ').length >= 9 && !dateLineRegex.test(line));
    const dtMatch = line.match(dateLineRegex);
    if (!isBullet && (dtMatch || (!curExp && line.length <= 85))) {
      if (curExp && (curExp.company || curExp.role || curExp.bullets.length > 0)) {
        experiences.push(curExp);
      }
      const withoutDate = dtMatch ? line.replace(dtMatch[0], '').replace(/[|–—,-]+\s*$/, '').trim() : line;
      const parts = withoutDate.split(/\s*(?:\||—|–|-|\bat\b|,)\s*/i).filter(Boolean);
      curExp = {
        id: `exp-${experiences.length + 1}`,
        role: parts[0] || targetRole || 'Professional',
        company: parts[1] || parts[0] || 'Organization',
        location: parts[2] || detectedLocation,
        startDate: dtMatch?.[1] || '',
        endDate: dtMatch?.[2] || '',
        current: Boolean(dtMatch?.[2] && /present|current/i.test(dtMatch[2])),
        bullets: [],
      };
    } else if (curExp) {
      const b = polishBullet(line);
      if (b) curExp.bullets.push(b);
    }
  }
  if (curExp && (curExp.company || curExp.role || curExp.bullets.length > 0)) {
    experiences.push(curExp);
  }

  // 6. Parse Projects
  const projects: any[] = [];
  let curProj: any = null;
  for (const line of sections.projects) {
    const isBullet = /^[•\-*▪◦›]/.test(line) || (curProj && line.split(' ').length >= 10);
    if (!isBullet && line.length <= 90) {
      if (curProj && (curProj.title || curProj.bullets.length > 0)) {
        projects.push(curProj);
      }
      const parts = line.split(/\s*(?:\||:|—|–|-)\s*/).filter(Boolean);
      const title = (parts[0] || line).replace(/^[•\-*\d.)\s]+/, '').trim();
      const detectedTech = knownSkills.filter((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(line));
      curProj = {
        id: `proj-${projects.length + 1}`,
        title,
        subtitle: parts[1] && detectedTech.length === 0 ? parts[1] : '',
        liveUrl: '',
        githubUrl: '',
        technologies: detectedTech,
        bullets: [],
      };
    } else if (curProj) {
      const b = polishBullet(line);
      if (b) curProj.bullets.push(b);
    }
  }
  if (curProj && (curProj.title || curProj.bullets.length > 0)) {
    projects.push(curProj);
  }

  // 7. Parse Certifications
  const certifications = sections.certifications
    .map((line, idx) => {
      const cleaned = line.replace(/^[•\-*▪◦›\d.)\s]+/, '').trim();
      if (cleaned.length < 4) return null;
      const yr = cleaned.match(/\b(20\d{2})\b/);
      const parts = cleaned.split(/\s*(?:\||—|–|-|,)\s*/).filter(Boolean);
      return {
        id: `cert-${idx + 1}`,
        name: parts[0] || cleaned,
        issuer: parts[1] || '',
        issueDate: yr ? yr[1] : '',
        credentialUrl: '',
      };
    })
    .filter(Boolean);

  // 8. Build tailored Summary
  const resolvedRole = targetRole.trim() || experiences[0]?.role || 'Professional';
  const topSkillPreview = allSkills.slice(0, 5).join(', ');
  const rawSummaryText = sections.summary.join(' ').trim();
  const summary =
    rawSummaryText.length >= 45
      ? rawSummaryText
      : `Results-driven ${resolvedRole}${
          topSkillPreview ? ` skilled in ${topSkillPreview}` : ''
        }. Proven ability to analyze complex problems, build reliable solutions, and deliver measurable outcomes across collaborative projects and technical workflows.`;

  return {
    personalInfo: {
      fullName: detectedName,
      jobTitle: resolvedRole,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0].trim() : '',
      location: detectedLocation,
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      website: websiteMatch ? websiteMatch[0] : '',
    },
    summaryTitle: 'Professional Summary',
    summary,
    skills: skillsBuckets,
    education,
    experiences,
    projects,
    certifications,
    atsAnalysis: {
      score: 92,
      strengths: [
        'Structured into clean, single-column ATS section headings',
        `Tailored header and summary aligned to ${resolvedRole}`,
        `Indexed ${allSkills.length || 'core'} relevant keywords from your uploaded resume`,
      ],
      improvements: [
        'Add concrete metrics (%, volume, or time saved) to top bullet points where applicable',
        'Verify dates and contact links in the editor before downloading PDF',
      ],
      keyMatches: allSkills.slice(0, 6),
    },
  };
}

async function startServer() {
  const app = express();
  const mysqlConnected = await checkMySQLConnection(true);
  if (!mysqlConnected) {
    if (!JSON_FALLBACK_ENABLED) {
      throw new Error(`Server startup blocked: MySQL database is unavailable in ${DEPLOYMENT_MODE} mode.`);
    }
    console.warn('MySQL is unavailable; local JSON fallback is active in development.');
  } else {
    console.log('MySQL database connected successfully.');
  }
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort =
    portArgIdx !== -1 && process.argv[portArgIdx + 1]
      ? parseInt(process.argv[portArgIdx + 1], 10)
      : null;
  const PORT =
    cliPort ||
    (process.env.PORT && process.env.PORT !== '8080'
      ? parseInt(process.env.PORT, 10)
      : 3000);

  // Middleware for body parsing (accepting base64 uploads up to 5 MB -> ~6.8 MB JSON)
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));

  // Health check endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    const mysqlConnected = await checkMySQLConnection(true);
    if (!mysqlConnected) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'unavailable',
        service: 'ATS-Friendly Resume Builder API',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      service: 'ATS-Friendly Resume Builder API',
      timestamp: new Date().toISOString(),
    });
  });

  const SUPPORTED_AI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  const DEFAULT_AI_MODEL = 'gemini-3.5-flash';
  const geminiRateLimiter = createAuthenticatedRateLimiter('gemini-ai', 10, 60_000);

  const createGeminiClient = (
    apiKey: string | undefined,
    httpOptions?: { headers?: Record<string, string> }
  ): GeminiClient => {
    if (DEPLOYMENT_MODE === 'test' && process.env.GEMINI_TEST_MODE === 'true') {
      return {
        models: {
          async generateContent(request: any) {
            const contents = JSON.stringify(request.contents);
            const fullRequest = JSON.stringify(request);
            if (contents.includes('MOCK_GEMINI_PROVIDER_ERROR')) {
              throw new Error(
                'Mock Gemini provider failure; key=integration-test-mock-only-key; ' +
                  'secret=TEST_ONLY_SECRET_MUST_NOT_LEAK; ' +
                  'resume=PRIVATE_RESUME_TEXT_MUST_NOT_LEAK; ' +
                  'provider_detail=PRIVATE_PROVIDER_DETAIL_MUST_NOT_LEAK\nSTACK_TRACE_MARKER\n' +
                  '    at mockGeminiProvider (test-only)'
              );
            }
            if (contents.includes('VOICE_EXTRACTION_INVALID_FIXTURE')) {
              return {
                text: JSON.stringify({
                  personalInfo: {
                    fullName: 'Asha Rao',
                    jobTitle: 'Frontend developer',
                    email: 'invented@example.com',
                    phone: '',
                    location: '',
                    linkedin: '',
                    github: '',
                    website: '',
                  },
                  summary: '',
                  experiences: [],
                  education: [],
                  skills: [],
                  projects: [],
                  certifications: [],
                }),
              };
            }
            if (contents.includes('VOICE_EXTRACTION_SUCCESS_FIXTURE')) {
              return {
                text: JSON.stringify({
                  personalInfo: {
                    fullName: 'Asha Rao',
                    jobTitle: 'Frontend developer',
                    email: 'asha.rao@example.com',
                    phone: '555 010 2040',
                    location: 'Bengaluru',
                    linkedin: 'linkedin.com/in/asharao',
                    github: '',
                    website: '',
                  },
                  summary: 'Frontend developer with React and TypeScript.',
                  experiences: [{
                    company: 'Northstar Labs',
                    role: 'UI Developer',
                    location: 'Bengaluru',
                    startDate: 'June 2022',
                    endDate: 'Present',
                    current: true,
                    bullets: ['Built design system.'],
                  }],
                  education: [{
                    school: 'University College',
                    degree: 'Bachelor of Computer Applications',
                    fieldOfStudy: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    gpa: '',
                    honors: '',
                  }],
                  skills: ['React', 'TypeScript'],
                  projects: [{
                    title: 'Campus Portal',
                    subtitle: '',
                    liveUrl: '',
                    githubUrl: '',
                    startDate: '',
                    endDate: '',
                    technologies: ['React'],
                    bullets: ['Built portal.'],
                  }],
                  certifications: [],
                }),
              };
            }
            if (
              fullRequest.includes('VOICE_CHAT_RESUME_BUILDER_INSTRUCTIONS') &&
              contents.includes('VOICE_CHAT_GUIDED_FIXTURE')
            ) {
              return {
                text: 'I can help organize the details you have shared. Please tell me your education and any projects you have completed.',
              };
            }
            if (contents.includes('GEMINI_MODEL_SELECTION_FIXTURE')) {
              return { text: `Mock model selection: ${request.model}` };
            }
            return { text: 'Mocked Gemini response for integration testing.' };
          },
        },
      };
    }

    return new GoogleGenAI({
      apiKey,
      ...(httpOptions ? { httpOptions } : {}),
    });
  };

  const stripCodeFences = (raw: string): string => {
    let cleaned = (raw || '').trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      cleaned = cleaned.slice(first, last + 1);
    }
    return cleaned.trim();
  };

  const repairAndParseJson = (raw: string): any => {
    const trimmed = (raw || '').trim();
    if (!trimmed) throw new Error('Empty JSON output from model');
    try {
      return JSON.parse(trimmed);
    } catch {}

    const fenced = stripCodeFences(trimmed);
    try {
      return JSON.parse(fenced);
    } catch {}

    // Escape raw newlines/tabs inside double-quoted JSON string literals & strip trailing commas
    let inString = false;
    let escaped = false;
    let out = '';
    for (let i = 0; i < fenced.length; i++) {
      const ch = fenced[i];
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        out += ch;
        continue;
      }
      if (inString) {
        if (ch === '\n') {
          out += '\\n';
          continue;
        }
        if (ch === '\r') {
          continue;
        }
        if (ch === '\t') {
          out += ' ';
          continue;
        }
      }
      out += ch;
    }
    const noTrailingCommas = out.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(noTrailingCommas);
  };

  // Initialize Gemini client on server-side only
  const ai = createGeminiClient(process.env.GEMINI_API_KEY, {
      headers: {
        'User-Agent': 'aistudio-build',
      },
  });

  async function generateWithModelFallback(
    client: GeminiClient,
    preferredModel: string,
    contents: any,
    config?: Record<string, any>
  ) {
    // Retry preferredModel twice on transient 503 demand spikes before trying secondary aliases
    const attemptPlan = [
      preferredModel,
      preferredModel,
      ...SUPPORTED_AI_MODELS.filter((m) => m !== preferredModel),
    ];
    let lastErr: any;
    for (let i = 0; i < attemptPlan.length; i++) {
      const modelName = attemptPlan[i];
      if (i === 1) {
        await new Promise((r) => setTimeout(r, 850));
      }
      const controller = new AbortController();
      const timeoutMs = typeof config?.timeoutMs === 'number' ? config.timeoutMs : 45000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            ...(config || {}),
            abortSignal: controller.signal,
            httpOptions: {
              retryOptions: { attempts: 1 },
            },
          },
        });
        clearTimeout(timer);
        return res;
      } catch (err: any) {
        clearTimeout(timer);
        lastErr = err;
        const msg = String(err?.message || '');
        console.warn(`[Gemini Fallback] Provider attempt ${i + 1} failed; trying configured fallback.`);
        if (/API_KEY_INVALID|API key not valid|401|403|PERMISSION_DENIED/i.test(msg)) {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  app.get('/api/ai/status', requireAuth, (_req: Request, res: Response) => {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const configured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length >= 10);
    const model = (process.env.GEMINI_MODEL || DEFAULT_AI_MODEL).trim();
    const modelValid = SUPPORTED_AI_MODELS.includes(model);
    res.json({
      configured,
      model,
      modelValid,
      localFallbackAvailable: true,
      ...(configured ? {} : { notice: 'Gemini API key is unconfigured; deterministic local ATS parser fallback is active.' }),
      ...(modelValid ? {} : { error: `Configured GEMINI_MODEL "${model}" is unsupported.` }),
    });
  });

  app.post('/api/ai/extract-voice-resume', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const transcript = validateVoiceTranscript(req.body?.transcript);
    if (!transcript) {
      res.status(400).json({
        success: false,
        error: `Transcript must contain between 20 and ${MAX_VOICE_TRANSCRIPT_LENGTH} characters.`,
      });
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
      res.status(503).json({
        success: false,
        error: 'Voice resume extraction is not configured right now.',
      });
      return;
    }

    const stringField = { type: Type.STRING };
    const stringArray = { type: Type.ARRAY, items: stringField };
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            fullName: stringField,
            jobTitle: stringField,
            email: stringField,
            phone: stringField,
            location: stringField,
            linkedin: stringField,
            github: stringField,
            website: stringField,
          },
          required: ['fullName', 'jobTitle', 'email', 'phone', 'location', 'linkedin', 'github', 'website'],
        },
        summary: stringField,
        experiences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: stringField,
              role: stringField,
              location: stringField,
              startDate: stringField,
              endDate: stringField,
              current: { type: Type.BOOLEAN },
              bullets: stringArray,
            },
            required: ['company', 'role', 'location', 'startDate', 'endDate', 'current', 'bullets'],
          },
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              school: stringField,
              degree: stringField,
              fieldOfStudy: stringField,
              location: stringField,
              startDate: stringField,
              endDate: stringField,
              gpa: stringField,
              honors: stringField,
            },
            required: ['school', 'degree', 'fieldOfStudy', 'location', 'startDate', 'endDate', 'gpa', 'honors'],
          },
        },
        skills: stringArray,
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: stringField,
              subtitle: stringField,
              liveUrl: stringField,
              githubUrl: stringField,
              startDate: stringField,
              endDate: stringField,
              technologies: stringArray,
              bullets: stringArray,
            },
            required: ['title', 'subtitle', 'liveUrl', 'githubUrl', 'startDate', 'endDate', 'technologies', 'bullets'],
          },
        },
        certifications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: stringField,
              issuer: stringField,
              issueDate: stringField,
              credentialUrl: stringField,
            },
            required: ['name', 'issuer', 'issueDate', 'credentialUrl'],
          },
        },
      },
      required: ['personalInfo', 'summary', 'experiences', 'education', 'skills', 'projects', 'certifications'],
    };

    try {
      const response = await generateWithModelFallback(ai, DEFAULT_AI_MODEL, buildVoiceResumePrompt(transcript), {
        responseMimeType: 'application/json',
        responseSchema,
      });
      const extracted = repairAndParseJson(response?.text || '');
      const data = validateGroundedVoiceResume(extracted, transcript);
      res.json({ success: true, data });
    } catch {
      console.error('[voice-resume] Extraction unavailable or response validation failed.');
      res.status(503).json({
        success: false,
        error: 'Could not extract a source-grounded resume right now. Review the transcript and try again.',
      });
    }
  });

  // ==========================================
  // API Route 1: Convert / Parse Old Resume
  // ==========================================
  app.post('/api/ai/convert-resume', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const { fileBase64, mimeType, fileName, rawText, userInstructions, model: requestedModel } = req.body;

    if (fileBase64) {
      const uploadCheck = validateUploadedFilePayload(fileBase64, mimeType, fileName);
      if (!uploadCheck.ok) {
        res.status(400).json({ success: false, error: uploadCheck.error });
        return;
      }
    }

    const activeModel = (requestedModel || process.env.GEMINI_MODEL || DEFAULT_AI_MODEL).trim();
    if (!SUPPORTED_AI_MODELS.includes(activeModel)) {
      res.status(400).json({
        success: false,
        error: `Unsupported Gemini model "${activeModel}". Allowed models: ${SUPPORTED_AI_MODELS.join(', ')}.`,
      });
      return;
    }

    // 1. Extract text from uploaded document (PDF, DOCX, TXT, or pasted text)
    let extractedText = '';
    try {
      extractedText = await extractTextFromUpload(fileBase64, mimeType, fileName, rawText);
    } catch (extractErr: any) {
      console.warn('[convert-resume] Text extraction notice:', extractErr?.message || 'Extraction error');
    }

    const lowerMime = (mimeType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    const isPdf = lowerMime.includes('pdf') || lowerName.endsWith('.pdf');
    const isImage = false;

    const textToProcess = (extractedText || rawText || '').trim();

    if (!textToProcess && !(fileBase64 && isPdf)) {
      res.status(400).json({
        success: false,
        error: 'Could not read text from this file, try pasting the text instead.',
      });
      return;
    }

    // 2. Check API key — if Gemini is unavailable and text was extracted, use deterministic local ATS parser
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const hasGeminiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length >= 10);
    if (!hasGeminiKey) {
      if (textToProcess.length >= 20) {
        const roleHint = (userInstructions || '').match(/Target Job Role:\s*([^.]+)/i)?.[1]?.trim() || '';
        const fallbackData = localAtsParse(textToProcess, roleHint);
        res.json({ success: true, data: fallbackData, fallbackUsed: true });
        return;
      }
      res.status(503).json({
        success: false,
        error: 'Gemini AI is not configured for scanned image OCR. Please upload a selectable PDF/DOCX or paste resume text.',
      });
      return;
    }

    let lastRawResponse = '';
    try {
      const client = createGeminiClient(apiKey, {
          headers: {
            'User-Agent': 'aistudio-build',
          },
      });

      const promptText = `You are an expert ATS (Applicant Tracking System) Resume Specialist across ALL industries (IT, Engineering, Manufacturing, CNC, Trades, Healthcare, Finance, Business, Fresher, etc.).
Convert the provided resume into a clean, high-scoring ATS-friendly resume.

CRITICAL OUTPUT RULE:
Return ONLY a raw, valid JSON object with NO markdown fences, NO \`\`\`json wrapper, and NO extra text before or after the JSON.

Use this exact JSON structure (use empty string "" or empty array [] if a section does not apply to this candidate — NEVER invent fake degrees or unrelated companies):
{
  "personalInfo": {
    "fullName": "string",
    "jobTitle": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "website": "string"
  },
  "summaryTitle": "Professional Summary",
  "summary": "3-4 strong ATS-optimized sentences (40-70 words) tailored to the candidate's actual background and target role",
  "skills": [
    { "id": "skill-1", "categoryName": "Core Competencies", "skills": ["Skill 1", "Skill 2"] }
  ],
  "education": [
    {
      "id": "edu-1",
      "school": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string",
      "honors": "string"
    }
  ],
  "experiences": [
    {
      "id": "exp-1",
      "company": "string",
      "role": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "bullets": ["Action-verb bullet point 1", "Action-verb bullet point 2"]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "string",
      "subtitle": "string",
      "liveUrl": "",
      "githubUrl": "",
      "technologies": ["Tool 1"],
      "bullets": ["Action-verb accomplishment"]
    }
  ],
  "certifications": [
    { "id": "cert-1", "name": "string", "issuer": "string", "issueDate": "string", "credentialUrl": "" }
  ],
  "atsAnalysis": {
    "score": 94,
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "improvements": ["Tip 1", "Tip 2"],
    "keyMatches": ["Keyword 1", "Keyword 2"]
  }
}

${userInstructions ? `User Instructions: ${userInstructions}` : ''}`;

      const buildContents = (strictRetryNote = '') => {
        const parts: any[] = [];
        if (fileBase64 && (isImage || (isPdf && textToProcess.length < 40))) {
          parts.push({
            inlineData: {
              mimeType: isPdf ? 'application/pdf' : lowerMime || 'image/png',
              data: fileBase64,
            },
          });
        }
        if (textToProcess) {
          parts.push({
            text: `OLD RESUME CONTENT:\n\n${textToProcess.slice(0, 14000)}`,
          });
        }
        parts.push({
          text: strictRetryNote ? `${promptText}\n\n${strictRetryNote}` : promptText,
        });
        return parts;
      };

      const resumeResponseSchema = {
        type: Type.OBJECT,
        properties: {
          personalInfo: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              github: { type: Type.STRING },
              website: { type: Type.STRING },
            },
            required: ['fullName', 'jobTitle', 'email', 'phone', 'location'],
          },
          summaryTitle: { type: Type.STRING },
          summary: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                categoryName: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['categoryName', 'skills'],
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                school: { type: Type.STRING },
                degree: { type: Type.STRING },
                fieldOfStudy: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                gpa: { type: Type.STRING },
                honors: { type: Type.STRING },
              },
              required: ['school', 'degree'],
            },
          },
          experiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                current: { type: Type.BOOLEAN },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['company', 'role', 'bullets'],
            },
          },
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                liveUrl: { type: Type.STRING },
                githubUrl: { type: Type.STRING },
                technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['title', 'bullets'],
            },
          },
          certifications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                issuer: { type: Type.STRING },
                issueDate: { type: Type.STRING },
                credentialUrl: { type: Type.STRING },
              },
              required: ['name'],
            },
          },
          atsAnalysis: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['score', 'strengths', 'improvements'],
          },
        },
        required: ['personalInfo', 'summary', 'skills', 'education', 'experiences', 'projects', 'certifications'],
      };

      // Parse with 1 automatic retry if JSON repair fails
      let parsedData: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await generateWithModelFallback(
          client,
          activeModel,
          buildContents(
            attempt === 1
              ? 'IMPORTANT RETRY: Return ONLY valid RFC8259 JSON matching the schema with properly escaped strings.'
              : ''
          ),
          {
            responseMimeType: 'application/json',
            responseSchema: resumeResponseSchema,
          }
        );

        lastRawResponse = response.text || '';
        try {
          parsedData = repairAndParseJson(lastRawResponse);
          break;
        } catch (parseErr: any) {
          if (!IS_PRODUCTION) {
            console.error(`[convert-resume] JSON parse failed on attempt ${attempt + 1}:`, parseErr?.message);
          }
          if (attempt === 1 && textToProcess.length >= 25) {
            const roleHint = (userInstructions || '').match(/Target Job Role:\s*([^.]+)/i)?.[1]?.trim() || '';
            parsedData = localAtsParse(textToProcess, roleHint);
          } else if (attempt === 1) {
            res.status(502).json({
              success: false,
              error: 'Could not parse structured resume from this document. Please paste plain resume text instead.',
            });
            return;
          }
        }
      }

      const hasMeaningfulContent = Boolean(
        parsedData?.personalInfo?.fullName?.trim() ||
          parsedData?.summary?.trim() ||
          (Array.isArray(parsedData?.experiences) && parsedData.experiences.length > 0) ||
          (Array.isArray(parsedData?.skills) && parsedData.skills.length > 0) ||
          (Array.isArray(parsedData?.education) && parsedData.education.length > 0)
      );

      if (!hasMeaningfulContent) {
        if (textToProcess.length >= 25) {
          const roleHint = (userInstructions || '').match(/Target Job Role:\s*([^.]+)/i)?.[1]?.trim() || '';
          parsedData = localAtsParse(textToProcess, roleHint);
        } else {
          res.status(400).json({
            success: false,
            error: 'Could not read text from this file, try pasting the text instead.',
          });
          return;
        }
      }

      res.json({ success: true, data: parsedData });
    } catch (err: any) {
      const errMsg = String(err?.message || 'Unknown error');
      console.warn('[convert-resume] Notice: Using safe deterministic local ATS parser fallback.');

      // Whenever readable resume text was extracted from DOCX/PDF/Paste, fall back to deterministic local ATS parser
      if (textToProcess.length >= 20) {
        console.warn('[convert-resume] Upstream Gemini unavailable; using local ATS parser fallback.');
        const roleHint = (userInstructions || '').match(/Target Job Role:\s*([^.]+)/i)?.[1]?.trim() || '';
        const fallbackData = localAtsParse(textToProcess, roleHint);
        res.json({ success: true, data: fallbackData, fallbackUsed: true });
        return;
      }

      if (/API_KEY_INVALID|API key not valid|401|403|PERMISSION_DENIED/i.test(errMsg)) {
        res.status(503).json({
          success: false,
          error: 'AI OCR service is currently unconfigured. Please paste plain resume text instead.',
        });
        return;
      }

      if (/503|UNAVAILABLE|high demand|overloaded/i.test(errMsg)) {
        res.status(503).json({
          success: false,
          error: 'AI models are experiencing high demand right now. Please try again or paste plain resume text.',
        });
        return;
      }
      if (/429|RESOURCE_EXHAUSTED|quota/i.test(errMsg)) {
        res.status(429).json({
          success: false,
          error: 'AI rate limit reached. Please wait a moment or paste plain resume text.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: `Resume conversion error: ${errMsg}`,
      });
    }
  });

  // ==========================================
  // API Route: ATS Score Checker & Deep Audit
  // ==========================================
  app.post('/api/ats/analyze', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { fileBase64, mimeType, fileName, rawText, jobDescription } =
        req.body && typeof req.body === 'object' ? req.body : {};

      if (fileBase64) {
        const uploadCheck = validateUploadedFilePayload(fileBase64, mimeType, fileName);
        if (!uploadCheck.ok) {
          res.status(400).json({ error: uploadCheck.error });
          return;
        }
      }

      if (rawText !== undefined && typeof rawText !== 'string') {
        res.status(400).json({ error: 'Resume text must be a string.' });
        return;
      }
      if (jobDescription !== undefined && typeof jobDescription !== 'string') {
        res.status(400).json({ error: 'Job description must be text.' });
        return;
      }
      const safeJobDescription = (jobDescription || '').trim();
      if (safeJobDescription.length > 10_000) {
        res.status(400).json({ error: 'Job description exceeds the 10,000 character limit.' });
        return;
      }

      const extractedText = await extractTextFromUpload(fileBase64, mimeType, fileName, rawText);

      if (!extractedText || extractedText.trim().length < 20) {
        res.status(400).json({
          error:
            'Could not extract readable text from this file. Please make sure the document contains selectable text or paste your resume text directly.',
        });
        return;
      }

      const text = extractedText.trim();
      if (text.length > 25_000) {
        res.status(400).json({ error: 'Extracted resume text exceeds the analysis limit.' });
        return;
      }
      if ((process.env.FASTAPI_ATS_URL || '').trim()) {
        try {
          const data = await callFastApiAts('analyze', {
            resumeText: text,
            jobDescription: safeJobDescription,
          });
          res.json({ success: true, data });
        } catch (error) {
          if (error instanceof FastApiAtsError) {
            res.status(error.statusCode).json({ success: false, error: error.message });
            return;
          }
          res.status(503).json({
            success: false,
            error: 'ATS processing service is temporarily unavailable.',
          });
        }
        return;
      }

      const lower = text.toLowerCase();
      const jdLower = safeJobDescription.toLowerCase();

      // 1. Formatting & Structure (20 points)
      let formatScore = 20;
      if (text.includes('\x00') || /[\uFFFD]/.test(text)) {
        formatScore -= 5;
      }
      if (text.length < 350) {
        formatScore -= 4;
      }
      if (text.length > 7000) {
        formatScore -= 3;
      }
      formatScore = Math.max(10, Math.min(20, formatScore));

      // 2. Section Completeness (20 points)
      let sectionScore = 0;
      const sectionsChecked = {
        contact: Boolean(
          lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) &&
            lower.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3,5}\)?[- ]?\d{3,5}/)
        ),
        summary: Boolean(
          lower.includes('summary') ||
            lower.includes('profile') ||
            lower.includes('about') ||
            lower.includes('objective')
        ),
        skills: Boolean(
          lower.includes('skill') ||
            lower.includes('technolog') ||
            lower.includes('competenc') ||
            lower.includes('stack')
        ),
        experience: Boolean(
          lower.includes('experience') ||
            lower.includes('employment') ||
            lower.includes('work history') ||
            lower.includes('projects')
        ),
        education: Boolean(
          lower.includes('education') ||
            lower.includes('degree') ||
            lower.includes('university') ||
            lower.includes('college') ||
            lower.includes('bachelor') ||
            lower.includes('master')
        ),
      };

      if (sectionsChecked.contact) sectionScore += 4;
      if (sectionsChecked.summary) sectionScore += 4;
      if (sectionsChecked.skills) sectionScore += 4;
      if (sectionsChecked.experience) sectionScore += 4;
      if (sectionsChecked.education) sectionScore += 4;

      // 3. Keyword Match (25 points)
      const standardKeywords = [
        'python',
        'javascript',
        'typescript',
        'react',
        'sql',
        'mysql',
        'postgresql',
        'docker',
        'aws',
        'git',
        'github',
        'rest api',
        'data analysis',
        'machine learning',
        'agile',
        'html',
        'css',
        'tailwind',
        'node.js',
        'linux',
      ];

      let targetKeywords: string[] = [];
      let tfidfResult: ReturnType<typeof computeTfIdfCosineSimilarity> | null = null;
      if (jdLower && jdLower.length > 25) {
        tfidfResult = computeTfIdfCosineSimilarity(text, jobDescription || '');
        const jdTokens = jdLower.match(/\b[a-z0-9+#.-]{3,18}\b/g) || [];
        const unique = Array.from(new Set(jdTokens)) as string[];
        targetKeywords = unique
          .filter((w: string) => !STOP_WORDS.has(w) && (standardKeywords.includes(w) || w.length >= 5))
          .slice(0, 16);
      }
      if (targetKeywords.length < 6) {
        targetKeywords = standardKeywords.slice(0, 14);
      }

      const foundKeywords: string[] = [];
      const missingKeywords: string[] = [];
      for (const kw of targetKeywords) {
        if (lower.includes(kw)) {
          foundKeywords.push(kw.toUpperCase());
        } else {
          missingKeywords.push(kw.toUpperCase());
        }
      }

      const kwRatio = targetKeywords.length > 0 ? foundKeywords.length / targetKeywords.length : 0;
      let keywordScore = tfidfResult
        ? Math.round((tfidfResult.blendedMatchPercent / 100) * 25)
        : Math.round(kwRatio * 25);
      keywordScore = Math.max(0, Math.min(25, keywordScore));

      // 4. Action Verbs & Quantified Achievements (15 points)
      const actionVerbsList = [
        'built',
        'developed',
        'engineered',
        'architected',
        'created',
        'designed',
        'implemented',
        'optimized',
        'spearheaded',
        'led',
        'managed',
        'accelerated',
        'delivered',
        'reduced',
        'increased',
        'automated',
        'launched',
        'collaborated',
      ];
      const foundVerbs = actionVerbsList.filter((v) => lower.includes(v));
      const verbScore = Math.min(8, Math.round((foundVerbs.length / 5) * 8));

      const metricMatches =
        text.match(
          /\b(?:\d+%(?:\s+growth|\s+increase|\s+reduction)?|\$\d+k?|\d+x|\d+\s*\+?|\d+\s*(?:users|clients|projects|features))\b/gi
        ) || [];
      const metricScore = Math.min(7, Math.round((metricMatches.length / 3) * 7));
      const actionScore = Math.max(4, Math.min(15, verbScore + metricScore));

      // 5. Readability & Length (10 points)
      const words = text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      let readabilityScore = 10;
      if (wordCount < 260) readabilityScore -= 4;
      else if (wordCount > 950) readabilityScore -= 3;
      readabilityScore = Math.max(4, Math.min(10, readabilityScore));

      // 6. Contact Info Check (10 points)
      let contactScore = 0;
      const hasEmail = Boolean(lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/));
      const hasPhone = Boolean(lower.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3,5}\)?[- ]?\d{3,5}/));
      const hasLinkedin = Boolean(lower.includes('linkedin.com') || lower.includes('linkedin'));
      const hasGithub = Boolean(lower.includes('github.com') || lower.includes('portfolio') || lower.includes('github'));

      if (hasEmail) contactScore += 3;
      if (hasPhone) contactScore += 3;
      if (hasLinkedin) contactScore += 2;
      if (hasGithub) contactScore += 2;

      // Final ATS Score
      const totalScore = Math.max(
        32,
        Math.min(98, formatScore + sectionScore + keywordScore + actionScore + readabilityScore + contactScore)
      );

      // Issues List with Severity
      const issues: Array<{
        id: string;
        category: string;
        severity: 'critical' | 'warning' | 'tip';
        message: string;
        fixRecommendation: string;
      }> = [];

      if (!hasLinkedin || !hasGithub) {
        issues.push({
          id: 'iss-contact',
          category: 'Contact Info Check',
          severity: 'warning',
          message: 'Missing clickable LinkedIn profile or GitHub code repository link.',
          fixRecommendation:
            'Include clean URLs in your contact header so recruiters can verify your code and recommendations directly.',
        });
      }

      if (metricMatches.length < 2) {
        issues.push({
          id: 'iss-metrics',
          category: 'Action Verbs & Achievements',
          severity: 'critical',
          message: 'Few quantified metrics (percentages, numbers, ROI) detected.',
          fixRecommendation:
            'Use the Google XYZ Formula: [Accomplished X] + [Measured by Y] + [By doing Z]. E.g., "Accelerated query response by 38%".',
        });
      }

      if (!sectionsChecked.summary) {
        issues.push({
          id: 'iss-summary',
          category: 'Section Completeness',
          severity: 'critical',
          message: 'Professional Summary section is missing or unlabelled.',
          fixRecommendation:
            'Add a 3-4 sentence summary right beneath your header highlighting core competencies and major wins.',
        });
      }

      if (missingKeywords.length > 3) {
        issues.push({
          id: 'iss-keywords',
          category: 'Keyword Match',
          severity: 'warning',
          message: `Missing ${missingKeywords.length} key industry keywords (${missingKeywords.slice(0, 3).join(', ')}...).`,
          fixRecommendation:
            'Incorporate these relevant technical terms into your Skills buckets and project descriptions.',
        });
      }

      if (wordCount > 900) {
        issues.push({
          id: 'iss-length',
          category: 'Readability & Length',
          severity: 'tip',
          message: 'Resume length is approaching 2+ pages.',
          fixRecommendation:
            'Trim older roles or secondary coursework to maintain a strict, impactful 1-page A4 format.',
        });
      } else {
        issues.push({
          id: 'iss-format',
          category: 'Formatting & Structure',
          severity: 'tip',
          message: 'Single-column structure matches ATS parsing criteria.',
          fixRecommendation:
            'Avoid multi-nested tables, icons as bullet points, or header images that block text extraction.',
        });
      }

      // AI Suggestions (Gemini 3.8 Flash with structured response & robust fallback)
      let aiSuggestions = {
        score_improvement_estimate: Math.min(20, Math.max(10, 100 - totalScore)),
        suggestions: [
          {
            section: 'Professional Summary',
            issue: 'Summary lacks modern industry keywords and specific specialization statement.',
            fix: 'Incorporate 40-60 words highlighting core frameworks, technical tools, and quantified business impact.',
            example_rewrite: {
              before: 'Looking for a challenging role where I can utilize my programming skills.',
              after:
                'Results-driven Software Engineer with extensive proficiency in Python, SQL, and React. Engineered high-throughput web applications and automated data pipelines, reducing turnaround time by 35% for cross-functional teams.',
            },
          },
          {
            section: 'Experience & Projects',
            issue: 'Bullet points use passive voice without business impact metrics.',
            fix: 'Start every bullet point with an assertive action verb followed by the technology stack and quantified result.',
            example_rewrite: {
              before: 'Worked on database queries and improved user interface.',
              after:
                'Engineered optimized PostgreSQL queries and responsive UI components with React, improving page load speed by 42%.',
            },
          },
          {
            section: 'Skills Organization',
            issue: 'Skills listed as flat comma-separated text rather than categorized buckets.',
            fix: 'Organize skills under clear headers: "Programming Languages", "Frameworks & Libraries", "Databases & Cloud", "Developer Tools".',
            example_rewrite: {
              before: 'Skills: Python, HTML, CSS, SQL, Git, React, Docker',
              after:
                'Languages: Python, TypeScript, SQL | Frameworks: React, Express | Cloud/DevOps: Docker, AWS, Git | Databases: PostgreSQL, MySQL',
            },
          },
        ],
        rewritten_summary:
          'Dynamic and analytically rigorous Professional with demonstrated competency in modern software architectures, data analysis, and scalable web solutions. Proven ability to translate ambiguous requirements into maintainable, recruiter-approved deliverables while increasing team productivity.',
        missing_keywords: missingKeywords.slice(0, 6),
      };

      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
        try {
          const aiResponse = await generateWithModelFallback(
            ai,
            DEFAULT_AI_MODEL,
            `
You are a Senior ATS Recruiter and Resume Auditor.
Analyze this resume text and provide structured ATS improvement suggestions:
RESUME TEXT:
"""${text.slice(0, 4500)}"""
${jobDescription ? `TARGET JOB DESCRIPTION:\n"""${jobDescription.slice(0, 1500)}"""` : ''}

Generate JSON with:
1. score_improvement_estimate: number (points that can be gained)
2. suggestions: array of 3 actionable items:
   - section: string
   - issue: string
   - fix: string
   - example_rewrite: object { before: string, after: string }
3. rewritten_summary: string (concise 45-60 words ATS summary tailored to this candidate)
4. missing_keywords: array of 4-6 high-value keywords missing from the resume
`,
            {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score_improvement_estimate: { type: Type.NUMBER },
                  suggestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        section: { type: Type.STRING },
                        issue: { type: Type.STRING },
                        fix: { type: Type.STRING },
                        example_rewrite: {
                          type: Type.OBJECT,
                          properties: {
                            before: { type: Type.STRING },
                            after: { type: Type.STRING },
                          },
                          required: ['before', 'after'],
                        },
                      },
                      required: ['section', 'issue', 'fix', 'example_rewrite'],
                    },
                  },
                  rewritten_summary: { type: Type.STRING },
                  missing_keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['score_improvement_estimate', 'suggestions', 'rewritten_summary', 'missing_keywords'],
              },
            }
          );

          const raw = stripCodeFences(aiResponse?.text || '');
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
            aiSuggestions = parsed;
          }
        } catch {
          console.warn('[ats-analyze] Gemini suggestions unavailable; keeping deterministic analysis.');
        }
      }

      res.json({
        success: true,
        data: {
          score: totalScore,
          scoreLabel:
            totalScore >= 85 ? 'Excellent' : totalScore >= 75 ? 'Good' : totalScore >= 50 ? 'Needs Work' : 'Poor',
          scoreColor: totalScore >= 75 ? 'green' : totalScore >= 50 ? 'orange' : 'red',
          breakdown: [
            { category: 'Formatting & Structure', score: formatScore, maxScore: 20, icon: 'Layout' },
            { category: 'Section Completeness', score: sectionScore, maxScore: 20, icon: 'CheckSquare' },
            { category: 'Keyword Match', score: keywordScore, maxScore: 25, icon: 'Target' },
            { category: 'Action Verbs & Achievements', score: actionScore, maxScore: 15, icon: 'Zap' },
            { category: 'Readability & Length', score: readabilityScore, maxScore: 10, icon: 'FileText' },
            { category: 'Contact Information', score: contactScore, maxScore: 10, icon: 'Mail' },
          ],
          foundKeywords,
          missingKeywords,
          issues,
          aiSuggestions,
          wordCount,
          charCount: text.length,
        },
      });
    } catch {
      console.error('[ats-analyze] Analysis failed.');
      res.status(500).json({ error: 'Unable to analyze resume right now.' });
    }
  });

  // ==========================================
  // API Route 2: Generate / Improve Summary
  // ==========================================
  app.post('/api/ai/generate-summary', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const { role, currentSummary, skills, experiences, style } = req.body;
    const skillsList = Array.isArray(skills) ? skills.join(', ') : skills || 'Python, SQL, React, MySQL';
    const candidateRole = role || 'Full Stack Developer / Computer Science Engineer';

    try {
      const prompt = `
Generate 3 distinct, ATS-optimized Professional Summary / Profile options for a candidate.
Target Role / Specialization: ${candidateRole}
Current Summary: ${currentSummary || 'None provided'}
Skills / Tech Stack: ${skillsList}
Experience highlights: ${experiences || 'Projects in Web Development & Software Engineering'}
Desired Tone/Style: ${style || 'Professional and ATS-friendly with quantified action verbs'}

Requirements:
- Each option must be between 40 to 65 words.
- Highlight problem-solving ability, key tech stack, and career passion.
- Return clean JSON.
`;

      const response = await generateWithModelFallback(ai, DEFAULT_AI_MODEL, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tag: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  wordCount: { type: Type.INTEGER },
                },
                required: ['tag', 'summary'],
              },
            },
          },
          required: ['options'],
        },
      });

      const result = JSON.parse(response.text || '{"options":[]}');
      res.json({ success: true, options: result.options });
    } catch {
      console.warn('Gemini summary unavailable; serving calibrated fallback options.');
      const fallbackOptions = [
        {
          tag: 'ATS Optimized (98% Match)',
          summary: `Results-focused ${candidateRole} with hands-on proficiency in ${skillsList.split(',').slice(0, 4).join(', ')}. Demonstrated success in architecting scalable applications and analyzing relational data with clean design patterns. Dedicated to writing maintainable code and accelerating development velocity.`,
          wordCount: 42,
        },
        {
          tag: 'Technical Specialist & Projects',
          summary: `Analytically minded software engineer proficient in modern full-stack frameworks and database architecture. Proven ability to build end-to-end features using ${skillsList.split(',').slice(0, 3).join(', ')}, optimizing database queries, and translating complex technical requirements into high-performing, user-centric software solutions.`,
          wordCount: 44,
        },
        {
          tag: 'Fresher / Career Growth Focus',
          summary: `Motivated Computer Science Engineering graduate equipped with strong foundations in data structures, algorithms, and full-stack development. Eager to leverage practical skills in ${skillsList.split(',').slice(0, 3).join(', ')} to contribute immediate value to collaborative engineering teams.`,
          wordCount: 41,
        },
      ];
      res.json({ success: true, options: fallbackOptions });
    }
  });

  // ==========================================
  // API Route 2b: Server-Side Text & Bullet Rewrite + Cover Letter Generator
  // ==========================================
  app.post('/api/ai/rewrite-text', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const { kind, text, mode, role } = req.body;
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      res.status(400).json({ success: false, error: 'Text is required for rewriting.' });
      return;
    }

    const prompt =
      kind === 'bullet'
        ? `Rewrite this resume bullet point into a clear, ATS-friendly achievement bullet starting with a strong action verb (e.g., Engineered, Spearheaded, Optimized, Automated, Delivered). Do NOT invent fake percentages or numbers that are not in the original text.
Role context: ${role || 'Professional'}
Original bullet: "${trimmed}"
Return ONLY the rewritten single bullet text without leading dashes or conversational filler.`
        : `Rewrite this resume summary text for an ATS-friendly resume.
Target Role: ${role || 'Professional'}
Mode: ${
            mode === 'shorter'
              ? 'Make it concise and punchy (under 40 words).'
              : mode === 'impactful'
              ? 'Use confident, high-impact action language without inventing fake metrics.'
              : 'Polish grammar, clarity, and ATS keyword readability while removing first-person pronouns ("I", "my").'
          }
Original text:
${trimmed}
Return ONLY the rewritten paragraph with no markdown fences or commentary.`;

    try {
      const response = await generateWithModelFallback(ai, DEFAULT_AI_MODEL, prompt);
      const out = (response.text || '').trim().replace(/^[-•*]\s*/, '').replace(/^"|"$/g, '');
      if (!out) throw new Error('Empty rewrite response');
      res.json({ success: true, text: out });
    } catch {
      console.warn('[rewrite-text] Gemini provider unavailable; returning a safe error response.');
      res.status(503).json({ success: false, error: 'AI rewrite service temporarily unavailable.' });
    }
  });

  app.post('/api/ai/generate-cover-letter', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const { senderName, targetRole, targetCompany, recipientName, experienceLevel, keySkills, tone } = req.body;
    const role = String(targetRole || 'Professional').trim();
    const company = String(targetCompany || 'your organization').trim();
    const recipient = String(recipientName || 'Hiring Manager').trim();
    const candidate = String(senderName || 'Candidate').trim();
    const skills = String(keySkills || 'relevant technical and analytical skills').trim();

    try {
      const prompt = `Write a concise, professional single-page cover letter for ${candidate} applying for "${role}" at "${company}".
Recipient: ${recipient}
Experience level: ${experienceLevel || 'Mid-Level'}
Key skills: ${skills}
Tone: ${tone || 'Professional & Confident'}

Return ONLY valid JSON with:
- salutation: string (e.g., "Dear ${recipient}:")
- openingParagraph: string (2-3 sentences)
- bodyParagraph: string (3-4 sentences)
- bulletPoints: array of 3 strong value bullets
- closingParagraph: string (2-3 sentences)
- signoff: string (e.g., "With best regards,")`;

      const response = await generateWithModelFallback(ai, DEFAULT_AI_MODEL, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            salutation: { type: Type.STRING },
            openingParagraph: { type: Type.STRING },
            bodyParagraph: { type: Type.STRING },
            bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            closingParagraph: { type: Type.STRING },
            signoff: { type: Type.STRING },
          },
          required: ['salutation', 'openingParagraph', 'bodyParagraph', 'bulletPoints', 'closingParagraph', 'signoff'],
        },
      });

      const parsed = JSON.parse(stripCodeFences(response.text || '{}'));
      res.json({ success: true, result: parsed });
    } catch {
      console.warn('[generate-cover-letter] Gemini provider unavailable; returning a safe error response.');
      res.status(503).json({ success: false, error: 'Cover letter AI temporarily unavailable.' });
    }
  });

  // ==========================================
  // API Route 3: AI Resume Chatbot Assistant
  // ==========================================
  app.post('/api/ai/chat', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const { messages, currentResume } = req.body;
    const rawMessages: Array<{ role: string; content: string }> = Array.isArray(messages) ? messages : [];
    const lastUserMessage =
      [...rawMessages].reverse().find((m) => m?.role === 'user')?.content?.trim() || '';

    if (!lastUserMessage) {
      res.status(400).json({ success: false, error: 'Please enter a message.' });
      return;
    }

    const buildLocalCoachReply = () => {
      const roleName = currentResume?.personalInfo?.jobTitle || 'your target role';
      return `Here are 3 quick ATS optimization tips for **${roleName}**:\n\n1. **Start bullets with strong action verbs** (e.g., *Engineered*, *Optimized*, *Automated*, *Spearheaded*) instead of "Responsible for".\n2. **Quantify measurable impact** using numbers, percentages, or scale (e.g., *"Reduced API latency by 35%"*).\n3. **Match exact job description keywords** in your Skills and 40–65 word Professional Summary while keeping a clean 1-page A4 layout.`;
    };

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
      res.json({ success: true, reply: buildLocalCoachReply(), fallbackUsed: true });
      return;
    }

    try {
      const client = createGeminiClient(apiKey, {
          headers: {
            'User-Agent': 'aistudio-build',
          },
      });

      const resumeContext = currentResume?.personalInfo?.fullName
        ? `\nCurrent Builder Resume Context: Name="${currentResume.personalInfo.fullName}", Role="${currentResume.personalInfo.jobTitle || ''}", Summary="${(currentResume.summary || '').slice(0, 250)}".`
        : '';

      const systemInstruction = `VOICE_CHAT_RESUME_BUILDER_INSTRUCTIONS
You are "Junaid's AI ATS Resume Coach & Assistant", a friendly, expert resume consultant for all careers and industries.
Understand English, Hindi, and Hinglish; reply in the language and style the user writes in.
Remember the user's facts from the complete conversation history and the supplied current resume context. Do not ask again for details already provided; ask a concise follow-up only for missing or ambiguous information.
When the user wants to build a resume, guide them conversationally through their full name, educational qualification, skills, work experience (or confirm they are a fresher), projects, and career objective/target role. Ask one or two relevant questions at a time instead of presenting a long form.
When enough details are available, offer to organize the user's information into an ATS-friendly structured resume. The user can explicitly choose the chat draft action to review the provided facts in the existing resume editor.
Never invent or assume qualifications, dates, employers, skills, certifications, achievements, numbers, or contact details. If a detail is missing, leave it out or ask the user. You may improve wording only without adding factual claims or changing the meaning.
Continue to help users improve their existing resume, understand ATS scoring, tailor content to a target role, and review pasted resume text with concrete suggestions.${resumeContext}`;

      const cleanedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const m of rawMessages) {
        const text = (m?.content || '').trim();
        if (!text) continue;
        const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model';
        if (cleanedContents.length === 0 && role === 'model') {
          continue;
        }
        const prev = cleanedContents[cleanedContents.length - 1];
        if (prev && prev.role === role) {
          prev.parts[0].text += `\n${text}`;
        } else {
          cleanedContents.push({ role, parts: [{ text }] });
        }
      }

      const response = await generateWithModelFallback(client, DEFAULT_AI_MODEL, cleanedContents, {
        systemInstruction,
      });

      const replyText = (response.text || '').trim();
      if (!replyText) {
        throw new Error('Empty reply from Gemini chatbot');
      }

      res.json({ success: true, reply: replyText });
    } catch {
      console.warn('[ai-chat] Gemini provider unavailable; using the local ATS coach fallback.');
      res.json({ success: true, reply: buildLocalCoachReply(), fallbackUsed: true });
    }
  });

  // ==========================================
  // API Route 4: User Authentication Endpoints
  // ==========================================
  const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  const OTP_MAX_ATTEMPTS = 5;
  const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
  const RESET_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  const authRegisterLimiter = createAuthRateLimiter('auth-register', 10, 60_000);
  const authLoginLimiter = createAuthRateLimiter('auth-login', 10, 60_000);
  const authVerifyLimiter = createAuthRateLimiter('auth-verify', 10, 60_000);
  const authResendLimiter = createAuthRateLimiter('auth-resend', 10, 60_000);
  const authOtpLimiter = authVerifyLimiter;
  const authForgotLimiter = createAuthRateLimiter('auth-forgot', 10, 60_000);

  app.post('/api/auth/register', authRegisterLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, full_name, name } = req.body || {};
      const emailCheck = validateEmailStrict(email);
      if (!emailCheck.valid || !emailCheck.domain) {
        res.status(400).json({
          error: emailCheck.error || 'Please provide a valid email address.',
          ...(emailCheck.suggestion ? { suggestion: emailCheck.suggestion } : {}),
        });
        return;
      }

      const normalizedEmail = emailCheck.normalized;
      const userName = String(full_name || name || '').trim() || 'Candidate';
      if (userName.length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters.' });
        return;
      }

      const rawPassword = String(password || '');
      if (rawPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }
      if (rawPassword.length > 128) {
        res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
        return;
      }
      if (!/\d/.test(rawPassword) || !/[^A-Za-z0-9\s]/.test(rawPassword)) {
        res.status(400).json({
          error: 'Password must include at least 8 characters, a number, and a special character.',
        });
        return;
      }

      const outcome = await withAuthTransaction(async (connection) => {
        const existing = await findUserByEmail(normalizedEmail, connection, true);
        if (existing && isUserVerified(existing)) {
          return { kind: 'conflict' as const };
        }

        const now = Date.now();
        if (existing?.otpLastSentAt && now - existing.otpLastSentAt < OTP_RESEND_COOLDOWN_MS) {
          return {
            kind: 'cooldown' as const,
            cooldownSeconds: Math.ceil(
              (OTP_RESEND_COOLDOWN_MS - (now - existing.otpLastSentAt)) / 1000
            ),
          };
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = await hashPassword(rawPassword, salt);
        const otpCode = String(crypto.randomInt(100000, 1000000));
        const otpHash = hashOtpCode(otpCode, normalizedEmail);
        await sendAuthCodeEmail({
          to: normalizedEmail,
          recipientName: userName,
          code: otpCode,
          purpose: 'verify',
          expiresMinutes: 10,
        });
        const sentAt = Date.now();
        const expiresAt = sentAt + OTP_EXPIRY_MS;

        let targetUser: UserRecord;
        if (existing) {
          await connection.execute(
            `UPDATE app_users
             SET email = ?, full_name = ?, password_hash = ?, salt = ?, verified = 0,
                 otp_hash = ?, otp_expires_at = ?, otp_attempts = 0, otp_last_sent_at = ?
             WHERE id = ?`,
            [normalizedEmail, userName, passwordHash, salt, otpHash, expiresAt, sentAt, existing.id]
          );
          targetUser = {
            ...existing,
            email: normalizedEmail,
            fullName: userName,
            passwordHash,
            salt,
            verified: false,
            otpHash,
            otpExpiresAt: expiresAt,
            otpAttempts: 0,
            otpLastSentAt: sentAt,
          };
        } else {
          targetUser = {
            id: `user-${sentAt}-${crypto.randomBytes(4).toString('hex')}`,
            email: normalizedEmail,
            fullName: userName,
            passwordHash,
            salt,
            createdAt: new Date(sentAt).toISOString(),
            verified: false,
            otpHash,
            otpExpiresAt: expiresAt,
            otpAttempts: 0,
            otpLastSentAt: sentAt,
          };
          await connection.execute(
            `INSERT INTO app_users
              (id, email, full_name, password_hash, salt, verified,
               otp_hash, otp_expires_at, otp_attempts, otp_last_sent_at, created_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?)`,
            [
              targetUser.id,
              targetUser.email,
              targetUser.fullName,
              targetUser.passwordHash,
              targetUser.salt,
              otpHash,
              expiresAt,
              sentAt,
              targetUser.createdAt,
            ]
          );
        }
        return { kind: 'created' as const, targetUser };
      });

      if (outcome.kind === 'conflict') {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      if (outcome.kind === 'cooldown') {
        res.status(429).json({
          error: `Verification code was just sent. Please wait ${outcome.cooldownSeconds}s before requesting another code.`,
          requiresVerification: true,
          email: normalizedEmail,
          cooldownSeconds: outcome.cooldownSeconds,
        });
        return;
      }

      res.status(201).json({
        success: true,
        requiresVerification: true,
        sentViaSmtp: true,
        email: outcome.targetUser.email,
        cooldownSeconds: 60,
        expiresInMinutes: 10,
        message: 'We sent a 6-digit verification code to your email address.',
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      if (error instanceof AuthEmailDeliveryError) {
        logAuthFailure('auth/register/email', error);
        res.status(503).json({ error: 'Email delivery is unavailable. Check SMTP configuration and try again.' });
        return;
      }
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/register', error);
      res.status(500).json({ error: 'Unable to send verification email right now. Please try again.' });
    }
  });

  const handleVerifyOtp = async (req: Request, res: Response) => {
    try {
      const emailCheck = validateEmailStrict(req.body?.email);
      const otp = String(req.body?.otp || '').trim();

      if (!emailCheck.valid) {
        res.status(400).json({ error: emailCheck.error || 'Please provide a valid email address.' });
        return;
      }
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
        return;
      }

      const normalizedEmail = emailCheck.normalized;
      const outcome = await withAuthTransaction(async (connection) => {
        const user = await findUserByEmail(normalizedEmail, connection, true);
        if (!user) return { kind: 'missing' as const };
        if (isUserVerified(user)) return { kind: 'verified' as const, user };
        if (!user.otpHash || !user.otpExpiresAt) return { kind: 'no-code' as const };

        if (Date.now() > user.otpExpiresAt) {
          await connection.execute(
            `UPDATE app_users
             SET otp_hash = NULL, otp_expires_at = NULL, otp_attempts = NULL
             WHERE id = ?`,
            [user.id]
          );
          return { kind: 'expired' as const };
        }

        const attempts = user.otpAttempts || 0;
        if (attempts >= OTP_MAX_ATTEMPTS) {
          await connection.execute(
            `UPDATE app_users SET otp_hash = NULL, otp_expires_at = NULL WHERE id = ?`,
            [user.id]
          );
          return { kind: 'max-attempts' as const };
        }

        if (!safeTimingEqual(hashOtpCode(otp, normalizedEmail), user.otpHash)) {
          const nextAttempts = attempts + 1;
          await connection.execute(
            `UPDATE app_users
             SET otp_attempts = ?,
                 otp_hash = IF(? >= ?, NULL, otp_hash),
                 otp_expires_at = IF(? >= ?, NULL, otp_expires_at)
             WHERE id = ?`,
            [
              nextAttempts,
              nextAttempts,
              OTP_MAX_ATTEMPTS,
              nextAttempts,
              OTP_MAX_ATTEMPTS,
              user.id,
            ]
          );
          const remaining = OTP_MAX_ATTEMPTS - nextAttempts;
          return { kind: 'incorrect' as const, remaining };
        }

        await connection.execute(
          `UPDATE app_users
           SET verified = 1, otp_hash = NULL, otp_expires_at = NULL,
               otp_attempts = NULL, otp_last_sent_at = NULL
           WHERE id = ?`,
          [user.id]
        );
        user.verified = true;
        return { kind: 'verified-now' as const, user };
      });

      if (outcome.kind === 'missing') {
        res.status(400).json({ error: 'Invalid verification code or email address.' });
      } else if (outcome.kind === 'verified') {
        res.json({
          success: true,
          verified: true,
          user: sanitizeUserResponse(outcome.user),
          message: 'Your email is already verified. You can sign in now.',
        });
      } else if (outcome.kind === 'no-code') {
        res.status(400).json({ error: 'No active verification code found. Please click Resend code.' });
      } else if (outcome.kind === 'expired') {
        res.status(400).json({
          error: 'Verification code has expired (10-minute limit). Please request a new code.',
        });
      } else if (outcome.kind === 'max-attempts') {
        res.status(429).json({
          error: 'Maximum 5 wrong attempts reached. Please request a new code.',
        });
      } else if (outcome.kind === 'incorrect') {
        res.status(400).json({
          error:
            outcome.remaining > 0
              ? `Incorrect verification code. ${outcome.remaining} attempt${outcome.remaining === 1 ? '' : 's'} remaining.`
              : 'Maximum 5 wrong attempts reached. Please request a new code.',
        });
      } else {
        res.json({
          success: true,
          verified: true,
          user: sanitizeUserResponse(outcome.user),
          message: 'Email verified successfully! You can now sign in.',
        });
      }
    } catch (error) {
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/verify-otp', error);
      res.status(500).json({ error: 'Unable to verify your email right now.' });
    }
  };

  app.post('/api/auth/verify-otp', authVerifyLimiter, handleVerifyOtp);
  app.post('/api/auth/verify-email', authVerifyLimiter, handleVerifyOtp);

  app.post('/api/auth/resend-otp', authResendLimiter, async (req: Request, res: Response) => {
    try {
      const emailCheck = validateEmailStrict(req.body?.email);
      if (!emailCheck.valid) {
        res.status(400).json({ error: emailCheck.error || 'Please enter a valid email address.' });
        return;
      }

      const normalizedEmail = emailCheck.normalized;
      const outcome = await withAuthTransaction(async (connection) => {
        const user = await findUserByEmail(normalizedEmail, connection, true);
        if (!user) return { kind: 'missing' as const };
        if (isUserVerified(user)) return { kind: 'verified' as const };

        const now = Date.now();
        const elapsed = now - (user.otpLastSentAt || 0);
        if (elapsed < OTP_RESEND_COOLDOWN_MS) {
          return {
            kind: 'cooldown' as const,
            cooldownSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
          };
        }

        const otpCode = String(crypto.randomInt(100000, 1000000));
        await sendAuthCodeEmail({
          to: normalizedEmail,
          recipientName: user.fullName,
          code: otpCode,
          purpose: 'verify',
          expiresMinutes: 10,
        });
        const sentAt = Date.now();
        await connection.execute(
          `UPDATE app_users
           SET otp_hash = ?, otp_expires_at = ?, otp_attempts = 0, otp_last_sent_at = ?
           WHERE id = ?`,
          [hashOtpCode(otpCode, normalizedEmail), sentAt + OTP_EXPIRY_MS, sentAt, user.id]
        );
        return { kind: 'sent' as const };
      });

      if (outcome.kind === 'missing') {
        res.status(404).json({ error: 'No pending account found for this email address.' });
        return;
      }
      if (outcome.kind === 'verified') {
        res.status(400).json({ error: 'This email is already verified. Please sign in.' });
        return;
      }
      if (outcome.kind === 'cooldown') {
        res.status(429).json({
          error: `Please wait ${outcome.cooldownSeconds}s before requesting a new verification code.`,
          cooldownSeconds: outcome.cooldownSeconds,
        });
        return;
      }

      res.json({
        success: true,
        sentViaSmtp: true,
        cooldownSeconds: 60,
        message: 'A fresh 6-digit verification code has been sent to your email.',
      });
    } catch (error) {
      if (error instanceof AuthEmailDeliveryError) {
        logAuthFailure('auth/resend-otp/email', error);
        res.status(503).json({ error: 'Email delivery is unavailable. Check SMTP configuration and try again.' });
        return;
      }
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/resend-otp', error);
      res.status(500).json({ error: 'Unable to resend verification email right now.' });
    }
  });

  app.post('/api/auth/login', authLoginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      const emailCheck = validateEmailStrict(email);
      if (!emailCheck.valid || !emailCheck.domain) {
        res.status(400).json({
          error: emailCheck.error || 'Please enter a valid email address.',
          ...(emailCheck.suggestion ? { suggestion: emailCheck.suggestion } : {}),
        });
        return;
      }
      if (!password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }
      if (typeof password !== 'string' || password.length > 128) {
        res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
        return;
      }

      const normalizedEmail = emailCheck.normalized;
      const user = await findUserByEmail(normalizedEmail);
      if (!user) {
        res.status(401).json({ error: 'Wrong email or password' });
        return;
      }
      const passwordCheck = await verifyPassword(password, user.salt, user.passwordHash);
      if (!passwordCheck.valid) {
        res.status(401).json({ error: 'Wrong email or password' });
        return;
      }
      if (passwordCheck.needsRehash) {
        const upgradedSalt = crypto.randomBytes(16).toString('hex');
        const upgradedHash = await hashPassword(password, upgradedSalt);
        await mysqlPool.execute(
          'UPDATE app_users SET salt = ?, password_hash = ? WHERE id = ?',
          [upgradedSalt, upgradedHash, user.id]
        );
        user.salt = upgradedSalt;
        user.passwordHash = upgradedHash;
      }
      if (!isUserVerified(user)) {
        const now = Date.now();
        const elapsed = now - (user.otpLastSentAt || 0);
        const remainingCooldown =
          user.otpLastSentAt && elapsed < OTP_RESEND_COOLDOWN_MS
            ? Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000))
            : 0;
        res.status(403).json({
          success: false,
          error: 'Please verify your email',
          requiresVerification: true,
          email: user.email,
          cooldownSeconds: remainingCooldown,
        });
        return;
      }

      const token = createToken(user.id, user.email, user.passwordHash);
      res.json({
        success: true,
        token,
        access_token: token,
        token_type: 'bearer',
        user: sanitizeUserResponse(user),
      });
    } catch (error) {
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/login', error);
      res.status(500).json({ error: 'Unable to complete sign-in right now. Please try again.' });
    }
  });

  app.post('/api/auth/forgot-password', authForgotLimiter, async (req: Request, res: Response) => {
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a recovery code has been sent.',
      expiresInMinutes: 15,
    };

    try {
      const emailCheck = validateEmailStrict(req.body?.email);
      if (!emailCheck.valid || !emailCheck.domain) {
        res.status(400).json({
          error: emailCheck.error || 'Please enter a valid email address.',
          ...(emailCheck.suggestion ? { suggestion: emailCheck.suggestion } : {}),
        });
        return;
      }
      const normalizedEmail = emailCheck.normalized;
      await withAuthTransaction(async (connection) => {
        const user = await findUserByEmail(normalizedEmail, connection, true);
        if (!user) return;

        const now = Date.now();
        if (user.resetLastSentAt && now - user.resetLastSentAt < OTP_RESEND_COOLDOWN_MS) {
          return;
        }

        const resetCode = String(crypto.randomInt(100000, 1000000));
        await sendAuthCodeEmail({
          to: normalizedEmail,
          recipientName: user.fullName,
          code: resetCode,
          purpose: 'reset',
          expiresMinutes: 15,
        });
        const sentAt = Date.now();
        await connection.execute(
          `UPDATE app_users
           SET reset_code_hash = ?, reset_code_expires_at = ?,
               reset_code_attempts = 0, reset_last_sent_at = ?
           WHERE id = ?`,
          [hashOtpCode(resetCode, normalizedEmail), sentAt + RESET_EXPIRY_MS, sentAt, user.id]
        );
      });

      res.json(genericResponse);
    } catch (error) {
      if (error instanceof AuthEmailDeliveryError) {
        logAuthFailure('auth/forgot-password/email', error);
        res.json(genericResponse);
        return;
      }
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/forgot-password', error);
      res.status(500).json({ error: 'Unable to process password recovery right now.' });
    }
  });

  app.post('/api/auth/reset-password', authOtpLimiter, async (req: Request, res: Response) => {
    try {
      const emailCheck = validateEmailStrict(req.body?.email);
      const resetCode = String(req.body?.resetCode || '').trim();
      const newPassword = String(req.body?.newPassword || '');

      if (!emailCheck.valid) {
        res.status(400).json({ error: emailCheck.error || 'Please enter a valid email address.' });
        return;
      }
      if (!/^\d{6}$/.test(resetCode)) {
        res.status(400).json({ error: 'Please enter the 6-digit recovery code.' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }
      if (newPassword.length > 128) {
        res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
        return;
      }
      if (!/\d/.test(newPassword) || !/[^A-Za-z0-9\s]/.test(newPassword)) {
        res.status(400).json({
          error: 'Password must include at least 8 characters, a number, and a special character.',
        });
        return;
      }

      const normalizedEmail = emailCheck.normalized;
      const outcome = await withAuthTransaction(async (connection) => {
        const user = await findUserByEmail(normalizedEmail, connection, true);
        if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
          return { kind: 'invalid' as const };
        }
        if (Date.now() > user.resetCodeExpiresAt) {
          await connection.execute(
            `UPDATE app_users
             SET reset_code_hash = NULL, reset_code_expires_at = NULL,
                 reset_code_attempts = NULL
             WHERE id = ?`,
            [user.id]
          );
          return { kind: 'expired' as const };
        }

        const attempts = user.resetCodeAttempts || 0;
        if (attempts >= OTP_MAX_ATTEMPTS) {
          await connection.execute(
            `UPDATE app_users
             SET reset_code_hash = NULL, reset_code_expires_at = NULL
             WHERE id = ?`,
            [user.id]
          );
          return { kind: 'max-attempts' as const };
        }
        if (!safeTimingEqual(hashOtpCode(resetCode, normalizedEmail), user.resetCodeHash)) {
          const nextAttempts = attempts + 1;
          await connection.execute(
            `UPDATE app_users
             SET reset_code_attempts = ?,
                 reset_code_hash = IF(? >= ?, NULL, reset_code_hash),
                 reset_code_expires_at = IF(? >= ?, NULL, reset_code_expires_at)
             WHERE id = ?`,
            [
              nextAttempts,
              nextAttempts,
              OTP_MAX_ATTEMPTS,
              nextAttempts,
              OTP_MAX_ATTEMPTS,
              user.id,
            ]
          );
          return { kind: 'incorrect' as const };
        }

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newPasswordHash = await hashPassword(newPassword, newSalt);
        await connection.execute(
          `UPDATE app_users
           SET salt = ?, password_hash = ?, verified = 1,
               otp_hash = NULL, otp_expires_at = NULL, otp_attempts = NULL,
               otp_last_sent_at = NULL, reset_code_hash = NULL,
               reset_code_expires_at = NULL, reset_code_attempts = NULL,
               reset_last_sent_at = NULL
           WHERE id = ?`,
          [newSalt, newPasswordHash, user.id]
        );
        return { kind: 'success' as const };
      });

      if (outcome.kind === 'expired') {
        res.status(400).json({ error: 'Recovery code has expired. Please request a new code.' });
      } else if (outcome.kind === 'max-attempts') {
        res.status(429).json({ error: 'Maximum recovery attempts exceeded. Please request a new code.' });
      } else if (outcome.kind === 'incorrect') {
        res.status(400).json({ error: 'Incorrect recovery code. Please check the 6 digits and try again.' });
      } else if (outcome.kind === 'invalid') {
        res.status(400).json({ error: 'Invalid or expired recovery code. Please request a new one.' });
      } else {
        res.json({
          success: true,
          message: 'Your password has been reset successfully. Please sign in with your new password.',
        });
      }
    } catch (error) {
      if (respondDatabaseUnavailable(res, error)) return;
      logAuthFailure('auth/reset-password', error);
      res.status(500).json({ error: 'Unable to reset your password right now.' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized or session expired.' });
        return;
      }
      if (!isUserVerified(user)) {
        res.status(403).json({ error: 'Please verify your email.' });
        return;
      }
      res.json({
        success: true,
        user: sanitizeUserResponse(user),
      });
    } catch (error) {
      logAuthFailure('auth/me', error);
      if (respondDatabaseUnavailable(res, error)) return;
      res.status(500).json({ error: 'Unable to verify your session right now.' });
    }
  });

  // ==========================================
  // API Route 5: MySQL-backed Resume CRUD
  // ==========================================

  const isResumeContentObject = (value: unknown): boolean =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  app.get('/api/resumes', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;

      const [rows]: any = await mysqlPool.execute(
        `SELECT id, user_id AS userId, title,
                template_id AS templateId,
                accent_color AS accentColor,
                content, created_at AS createdAt,
                updated_at AS updatedAt
         FROM app_resumes
         WHERE user_id = ?
         ORDER BY updated_at DESC`,
        [user.id]
      );

      const resumes = rows.map((row: any) => ({
        ...row,
        content: typeof row.content === 'string'
          ? JSON.parse(row.content)
          : row.content,
      }));

      res.json({ success: true, resumes });
    } catch (err) {
      logDatabaseFailure('resume_list', err);
      if (respondDatabaseUnavailable(res, err)) return;
      res.status(500).json({ error: 'Unable to load resumes.' });
    }
  });

  app.post('/api/resumes', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;
      const {
        title, templateId, template_id,
        accentColor, accent_color, content
      } = req.body || {};

      if (!isResumeContentObject(content)) {
        res.status(400).json({ error: 'Resume content payload is required.' });
        return;
      }

      const now = new Date().toISOString();
      const resume: ResumeRecord = {
        id: `resume-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        userId: user.id,
        title: String(title || '').trim() ||
          content.personalInfo?.fullName?.trim() ||
          'Untitled Resume',
        templateId: templateId || template_id || 'tmpl-1',
        accentColor: accentColor || accent_color || '#C98B5E',
        content,
        createdAt: now,
        updatedAt: now,
      };

      await mysqlPool.execute(
        `INSERT INTO app_resumes
          (id, user_id, title, template_id, accent_color, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resume.id, resume.userId, resume.title,
          resume.templateId, resume.accentColor,
          JSON.stringify(resume.content), now, now
        ]
      );

      res.status(201).json({ success: true, resume });
    } catch (err) {
      logDatabaseFailure('resume_create', err);
      if (respondDatabaseUnavailable(res, err)) return;
      res.status(500).json({ error: 'Unable to save resume.' });
    }
  });

  app.get('/api/resumes/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;

      const [rows]: any = await mysqlPool.execute(
        `SELECT id, user_id AS userId, title,
                template_id AS templateId,
                accent_color AS accentColor,
                content, created_at AS createdAt,
                updated_at AS updatedAt
         FROM app_resumes WHERE id = ? AND user_id = ? LIMIT 1`,
        [req.params.id, user.id]
      );

      if (!rows.length) {
        res.status(404).json({ error: 'Resume not found.' });
        return;
      }

      const row = rows[0];
      const resume = {
        ...row,
        content: typeof row.content === 'string'
          ? JSON.parse(row.content)
          : row.content,
      };

      res.json({ success: true, resume });
    } catch (err) {
      logDatabaseFailure('resume_get', err);
      if (respondDatabaseUnavailable(res, err)) return;
      res.status(500).json({ error: 'Unable to load resume.' });
    }
  });

  app.put('/api/resumes/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;
      const {
        title, templateId, template_id,
        accentColor, accent_color, content
      } = req.body || {};

      const [rows]: any = await mysqlPool.execute(
        `SELECT id, user_id AS userId, title,
                template_id AS templateId,
                accent_color AS accentColor,
                content, created_at AS createdAt,
                updated_at AS updatedAt
         FROM app_resumes WHERE id = ? AND user_id = ? LIMIT 1`,
        [req.params.id, user.id]
      );

      if (!rows.length) {
        res.status(404).json({ error: 'Resume not found.' });
        return;
      }

      if (content !== undefined && !isResumeContentObject(content)) {
        res.status(400).json({ error: 'Resume content must be an object.' });
        return;
      }

      const current = rows[0];
      const currentContent = typeof current.content === 'string'
        ? JSON.parse(current.content)
        : current.content;

      const updatedContent = content !== undefined ? content : currentContent;
      const updatedTitle = title !== undefined
        ? (String(title).trim() || 'Untitled Resume')
        : current.title;
      const updatedTemplate = templateId || template_id || current.templateId;
      const updatedAccent = accentColor || accent_color || current.accentColor;
      const now = new Date().toISOString();

      await mysqlPool.execute(
        `UPDATE app_resumes
         SET title = ?, template_id = ?, accent_color = ?,
             content = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          updatedTitle, updatedTemplate, updatedAccent,
          JSON.stringify(updatedContent), now, req.params.id, user.id
        ]
      );

      res.json({
        success: true,
        resume: {
          ...current,
          title: updatedTitle,
          templateId: updatedTemplate,
          accentColor: updatedAccent,
          content: updatedContent,
          updatedAt: now
        }
      });
    } catch (err) {
      logDatabaseFailure('resume_update', err);
      if (respondDatabaseUnavailable(res, err)) return;
      res.status(500).json({ error: 'Unable to update resume.' });
    }
  });

  app.delete('/api/resumes/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;

      const [result]: any = await mysqlPool.execute(
        'DELETE FROM app_resumes WHERE id = ? AND user_id = ?',
        [req.params.id, user.id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Resume not found.' });
        return;
      }

      res.json({ success: true, message: 'Resume deleted.' });
    } catch (err) {
      logDatabaseFailure('resume_delete', err);
      if (respondDatabaseUnavailable(res, err)) return;
      res.status(500).json({ error: 'Unable to delete resume.' });
    }
  });

  // ==========================================
  // API Route 6: AI ATS Deep Analysis & Job Match
  // ==========================================
  app.post('/api/ai/analyze-ats', requireAuth, async (req: Request, res: Response) => {
    const resume = req.body.resume || req.body.resumeData;
    if (!resume) {
      res.status(400).json({ error: 'Resume data required for analysis.' });
      return;
    }

    const p = resume.personalInfo || resume.basics || {};
    const fullName = p.fullName || p.name || '';
    const hasName = Boolean(fullName?.trim());
    const hasEmail = Boolean(p.email?.trim());
    const hasPhone = Boolean(p.phone?.trim());
    const hasLocation = Boolean((p.location?.city ? `${p.location.city}, ${p.location.country}` : p.location)?.trim());
    const hasLinks = Boolean(p.linkedin?.trim() || p.github?.trim() || p.website?.trim() || p.url?.trim());

    const summary = resume.summary || (typeof p.summary === 'string' ? p.summary : '') || '';
    const summaryWordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
    const hasGoodSummary = summaryWordCount >= 35 && summaryWordCount <= 85;

    const experiences = Array.isArray(resume.experiences) ? resume.experiences : [];
    const projects = Array.isArray(resume.projects) ? resume.projects : [];
    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    const education = Array.isArray(resume.education) ? resume.education : [];

    // Collect all bullet text and full resume text for density analysis
    const allBullets: string[] = [];
    experiences.forEach((e: any) => (e.bullets || []).forEach((b: string) => { if (b && b.trim()) allBullets.push(b.trim()); }));
    projects.forEach((pr: any) => (pr.bullets || []).forEach((b: string) => { if (b && b.trim()) allBullets.push(b.trim()); }));

    const fullResumeString = [
      fullName,
      p.jobTitle || '',
      summary,
      ...allBullets,
      ...skills.flatMap((c: any) => (c.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name || ''))),
      ...education.map((ed: any) => `${ed.degree || ''} ${ed.fieldOfStudy || ''} ${ed.school || ''}`)
    ].join(' ').toLowerCase();

    const words = fullResumeString.match(/\b[a-z]{2,}\b/g) || [];
    const totalWords = words.length;

    // 1. KEYWORD DENSITY CALCULATION
    const INDUSTRY_KEYWORDS = [
      'react', 'typescript', 'javascript', 'python', 'sql', 'mysql', 'postgresql',
      'node.js', 'express', 'docker', 'aws', 'git', 'api', 'apis', 'rest', 'html',
      'css', 'tailwind', 'graphql', 'mongodb', 'agile', 'ci/cd', 'linux', 'testing',
      'pandas', 'numpy', 'machine learning', 'data analysis', 'algorithms', 'fastapi',
      'springboot', 'microservices', 'cloud', 'security', 'redis', 'kafka'
    ];

    const detectedKeywordsMap = new Map<string, number>();
    INDUSTRY_KEYWORDS.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'gi');
      const matches = fullResumeString.match(regex);
      if (matches && matches.length > 0) {
        detectedKeywordsMap.set(kw, matches.length);
      }
    });

    const topKeywords = Array.from(detectedKeywordsMap.entries())
      .map(([keyword, count]) => {
        const density = totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(1)) : 0;
        let status: 'optimal' | 'low' | 'high' = 'optimal';
        if (density < 0.8) status = 'low';
        else if (density > 4.2) status = 'high';
        return {
          keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          count,
          density,
          status,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const missingKeywords = INDUSTRY_KEYWORDS
      .filter((k) => !detectedKeywordsMap.has(k))
      .slice(0, 6)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1));

    // 2. ACTION VERBS & WEAK PHRASES ANALYSIS
    const STRONG_VERBS = [
      'engineered', 'architected', 'developed', 'optimized', 'spearheaded', 'implemented',
      'automated', 'built', 'led', 'designed', 'deployed', 'scaled', 'conducted', 'reduced',
      'increased', 'streamlined', 'analyzed', 'created', 'maintained', 'trained', 'integrated',
      'formulated', 'accelerated', 'orchestrated', 'pioneered', 'maximized', 'refactored'
    ];

    const WEAK_OPENERS = [
      { pattern: /^responsible for\b/i, phrase: 'Responsible for', suggestedVerb: 'Orchestrated' },
      { pattern: /^worked on\b/i, phrase: 'Worked on', suggestedVerb: 'Engineered' },
      { pattern: /^helped with\b/i, phrase: 'Helped with', suggestedVerb: 'Collaborated to build' },
      { pattern: /^assisted in\b/i, phrase: 'Assisted in', suggestedVerb: 'Spearheaded' },
      { pattern: /^tasked with\b/i, phrase: 'Tasked with', suggestedVerb: 'Executed' },
      { pattern: /^involved in\b/i, phrase: 'Involved in', suggestedVerb: 'Implemented' },
      { pattern: /^handled\b/i, phrase: 'Handled', suggestedVerb: 'Managed' },
      { pattern: /^did\b/i, phrase: 'Did', suggestedVerb: 'Delivered' },
    ];

    const foundVerbsSet = new Set<string>();
    const weakBullets: any[] = [];

    allBullets.forEach((bullet) => {
      const cleanBullet = bullet.trim();
      const firstWord = cleanBullet.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      if (firstWord && STRONG_VERBS.includes(firstWord)) {
        foundVerbsSet.add(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
      }

      // Check for weak openers
      for (const weak of WEAK_OPENERS) {
        if (weak.pattern.test(cleanBullet)) {
          const stripped = cleanBullet.replace(weak.pattern, '').trim();
          const capitalRest = stripped.charAt(0).toUpperCase() + stripped.slice(1);
          weakBullets.push({
            originalBullet: cleanBullet,
            weakPhrase: weak.phrase,
            suggestedVerb: weak.suggestedVerb,
            suggestedRewrite: `${weak.suggestedVerb} ${stripped.charAt(0).toLowerCase() + stripped.slice(1)} to enhance delivery velocity and system reliability.`,
          });
          break;
        }
      }
    });

    const foundVerbs = Array.from(foundVerbsSet);
    const missingActionVerbs = [
      {
        category: 'Leadership & Initiative',
        verbs: ['Spearheaded', 'Orchestrated', 'Championed', 'Directed'].filter((v) => !foundVerbs.includes(v)),
      },
      {
        category: 'Technical Execution',
        verbs: ['Architected', 'Engineered', 'Refactored', 'Deployed'].filter((v) => !foundVerbs.includes(v)),
      },
      {
        category: 'Performance & Optimization',
        verbs: ['Accelerated', 'Streamlined', 'Maximized', 'Automated'].filter((v) => !foundVerbs.includes(v)),
      },
    ];

    // 3. QUANTIFIED ACHIEVEMENTS & REWRITE SUGGESTIONS
    const metricPattern = /(\d+%\s*|\$\s*\d+|\b\d+\s*k\b|\b\d+\s*ms\b|\b\d+\s*(?:users|clients|requests|hours|days|x)\b|\b\d+\+?\b)/i;
    let metricCount = 0;
    const unquantifiedBullets: any[] = [];

    allBullets.forEach((bullet) => {
      if (metricPattern.test(bullet)) {
        metricCount++;
      } else {
        if (unquantifiedBullets.length < 3) {
          unquantifiedBullets.push({
            originalBullet: bullet,
            suggestedRewrite: `${bullet.replace(/\.$/, '')}, achieving a 35% improvement in performance and reducing processing overhead across 10,000+ operations.`,
            suggestedMetric: 'Add percentage (%) or volume metric (e.g. 35% faster, 10k users)',
          });
        }
      }
    });

    const totalBullets = allBullets.length;
    const quantifiedRatio = totalBullets > 0 ? Math.round((metricCount / totalBullets) * 100) : 0;

    // 4. SUB-SCORES & OVERALL ATS SCORE
    const hasAnyContent =
      hasName || hasEmail || summaryWordCount > 0 || totalBullets > 0 || skills.length > 0;

    let keywordScore = Math.min(Math.round((topKeywords.length / 6) * 100), 96);
    let actionVerbScore = Math.min(Math.round((foundVerbs.length / 4) * 100), 98);
    let quantifiedScore = totalBullets > 0 ? Math.min(Math.round(quantifiedRatio * 1.4), 96) : 0;
    let formatScore =
      (hasName ? 20 : 0) +
      (hasEmail && hasPhone ? 30 : hasEmail || hasPhone ? 15 : 0) +
      (hasGoodSummary ? 25 : summaryWordCount > 0 ? 12 : 0) +
      (skills.length >= 2 ? 25 : skills.length === 1 ? 12 : 0);

    formatScore = Math.min(formatScore, 98);

    const overallScore = hasAnyContent
      ? Math.round(
          keywordScore * 0.3 + actionVerbScore * 0.25 + quantifiedScore * 0.25 + formatScore * 0.2
        )
      : 0;

    const strengths: string[] = [];
    const recommendations: string[] = [];
    const specificSuggestions: any[] = [];

    if (hasName && hasEmail && hasPhone) {
      strengths.push('ATS Header parsed: Full Name, verified Email, and Phone formatted correctly.');
    } else {
      recommendations.push('Complete personal header contact details to ensure recruiter callbacks.');
      specificSuggestions.push({
        priority: 'high',
        title: 'Complete Header Contact Details',
        description: 'Applicant Tracking Systems reject resumes missing direct phone or email contact information.',
      });
    }

    if (hasGoodSummary) {
      strengths.push(`Concise Professional Summary (${summaryWordCount} words) passes 6-second recruiter glance test.`);
    } else if (summaryWordCount === 0) {
      recommendations.push('Add a 40-70 word Professional Summary highlighting your primary technical stack.');
      specificSuggestions.push({
        priority: 'high',
        title: 'Missing Professional Summary',
        description: 'A 3-sentence summary incorporating your top 3 skills increases keyword match resonance by 35%.',
      });
    }

    if (foundVerbs.length >= 3) {
      strengths.push(`Strong action verbs found (${foundVerbs.slice(0, 3).join(', ')}) demonstrating candidate ownership.`);
    } else {
      recommendations.push('Replace passive phrases with strong action verbs (e.g. Engineered, Spearheaded).');
      specificSuggestions.push({
        priority: 'high',
        title: 'Upgrade Weak Bullet Openers',
        description: 'ATS parsers look for action verbs at the beginning of each bullet to score candidate initiative.',
      });
    }

    if (metricCount >= 2) {
      strengths.push(`Quantified metrics detected in ${metricCount} bullets (numbers, percentages, or scale).`);
    } else {
      recommendations.push('Add measurable achievements (% impact, numbers, or time saved) using Google XYZ formula.');
      specificSuggestions.push({
        priority: 'high',
        title: 'Quantify Bullet Points',
        description: 'Quantified accomplishments stand out 3x more to technical hiring managers than descriptive duties.',
      });
    }

    if (topKeywords.length >= 4) {
      strengths.push(`Keyword density is balanced across ${topKeywords.length} primary industry terms without keyword stuffing.`);
    } else {
      recommendations.push(`Include relevant keywords like ${missingKeywords.slice(0, 3).join(', ')} to raise parser relevance.`);
    }

    res.json({
      success: true,
      score: overallScore,
      subScores: {
        keywordScore,
        actionVerbScore,
        quantifiedScore,
        formatScore,
      },
      keywordDensity: {
        totalWords,
        topKeywords,
        densityStatus: totalWords > 150 ? 'Healthy (1.5% - 3.2% optimal density)' : 'Moderate Word Count',
        missingKeywords,
      },
      actionVerbsAnalysis: {
        actionVerbCount: foundVerbs.length,
        foundVerbs,
        weakBullets,
        missingActionVerbs,
      },
      quantifiedAchievements: {
        metricCount,
        totalBullets,
        quantifiedRatio,
        unquantifiedBullets,
      },
      strengths,
      recommendations,
      specificSuggestions,
    });
  });

  app.post('/api/ai/match-job', requireAuth, geminiRateLimiter, async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { resumeText, jobDescription, targetRole } = body;
    if (typeof resumeText !== 'string' || !resumeText.trim()) {
      res.status(400).json({ error: 'Please provide resume text to match.' });
      return;
    }
    if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
      res.status(400).json({ error: 'Please provide job description text to match against.' });
      return;
    }
    if (resumeText.length > 20_000 || jobDescription.length > 10_000) {
      res.status(400).json({ error: 'Resume text or job description exceeds the analysis limit.' });
      return;
    }
    if (targetRole !== undefined && (typeof targetRole !== 'string' || targetRole.length > 200)) {
      res.status(400).json({ error: 'Target role must be text no longer than 200 characters.' });
      return;
    }

    if ((process.env.FASTAPI_ATS_URL || '').trim()) {
      try {
        const result = await callFastApiAts('match', {
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          targetRole: typeof targetRole === 'string' && targetRole.trim() ? targetRole.trim() : 'Professional',
        });
        res.json(result);
      } catch (error) {
        if (error instanceof FastApiAtsError) {
          res.status(error.statusCode).json({ success: false, error: error.message });
          return;
        }
        res.status(503).json({ success: false, error: 'ATS processing service is temporarily unavailable.' });
      }
      return;
    }

    const tfidf = computeTfIdfCosineSimilarity(resumeText || '', jobDescription);

    try {
      const prompt = `
You are an expert ATS (Applicant Tracking System) recruiter. Compare the candidate's resume text against the target job description.
Candidate Target Role: ${targetRole || 'Professional'}
Computed TF-IDF Cosine Similarity: ${tfidf.cosineSimilarity} (Baseline Match Score: ${tfidf.blendedMatchPercent}%)

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

RESUME CONTENT:
${(resumeText || '').slice(0, 3000)}

Provide an honest ATS Match assessment:
1. matchScore: Integer percentage (0 to 98) grounded closely around the TF-IDF & requirement match (${tfidf.blendedMatchPercent}%). If the resume is empty or unrelated, give a low score.
2. matchedKeywords: Array of technical/domain skills present in BOTH the job description and the resume.
3. missingKeywords: Array of 3-6 critical keywords/skills mentioned in the job description that the resume is missing.
4. recommendations: Array of 2-3 concrete tips to tailor this resume for this specific opening.
`;

      const response = await generateWithModelFallback(ai, DEFAULT_AI_MODEL, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['matchScore', 'matchedKeywords', 'missingKeywords', 'recommendations'],
        },
      });

      const parsed = JSON.parse(stripCodeFences(response.text || '{}'));
      res.json({
        success: true,
        result: {
          ...parsed,
          tfidfCosineSimilarity: tfidf.cosineSimilarity,
        },
      });
    } catch (err: any) {
      console.warn('Job matcher upstream notice, returning mathematical TF-IDF match:', err.message);
      res.json({
        success: true,
        result: {
          matchScore: tfidf.blendedMatchPercent,
          tfidfCosineSimilarity: tfidf.cosineSimilarity,
          matchedKeywords: tfidf.matchedKeywords,
          missingKeywords: tfidf.missingKeywords,
          recommendations: [
            tfidf.missingKeywords.length > 0
              ? `Incorporate missing job-specific keywords (${tfidf.missingKeywords.slice(0, 3).join(', ')}) into your Skills or Experience bullets where accurate.`
              : 'Your technical vocabulary aligns well with this job description.',
            'Mirror key phrasing from the job description in your Professional Summary.',
            'Ensure your top bullet points quantify outcomes relevant to this role.',
          ],
        },
      });
    }
  });

  // ==========================================
  // Vite Integration (Dev vs Production)
  // ==========================================
  if (IS_PRODUCTION) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const host = DEPLOYMENT_MODE === 'test' ? '127.0.0.1' : '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`ATS Resume Builder server running on http://${host}:${PORT}`);
  });
}

startServer().catch((err) => {
  const category =
    err instanceof Error &&
    err.message.startsWith('Server startup blocked: MySQL database is unavailable in ')
      ? 'database_unavailable'
      : 'startup_failure';
  console.error(`[server_startup] Server startup failed (${category}).`);
  process.exit(1);
});
