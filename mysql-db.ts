import 'dotenv/config';
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type DeploymentMode = 'development' | 'test' | 'production';

function resolveDeploymentMode(): DeploymentMode {
  const configuredMode = process.env.NODE_ENV?.trim().toLowerCase();
  const mode = configuredMode || (
    process.env.npm_lifecycle_event === 'dev' ? 'development' : ''
  );
  if (mode === 'development' || mode === 'test' || mode === 'production') {
    return mode;
  }
  throw new Error(
    'NODE_ENV must be set to development, test, or production. The npm dev script selects development mode.'
  );
}

export const DEPLOYMENT_MODE = resolveDeploymentMode();
export const JSON_FALLBACK_ENABLED =
  DEPLOYMENT_MODE === 'development' && process.env.npm_lifecycle_event === 'dev';
const ALLOW_JSON_FALLBACK = JSON_FALLBACK_ENABLED;
const MYSQL_CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'EPIPE',
  'ER_SERVER_GONE_ERROR',
  'ER_SERVER_SHUTDOWN',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'PROTOCOL_ENQUEUE_AFTER_QUIT',
]);
const LEGACY_FALLBACK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
]);

export class DatabaseUnavailableError extends Error {
  readonly code = 'DATABASE_UNAVAILABLE';

  constructor() {
    super('Database unavailable. Please try again later.');
    this.name = 'DatabaseUnavailableError';
  }
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    MYSQL_CONNECTION_ERROR_CODES.has(error.code)
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data_storage');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure local fallback storage exists
function initLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          resumes: Array.isArray(parsed.resumes) ? parsed.resumes : [],
        };
      }
    }
  } catch (err) {
    console.warn('[mysql-fallback] Reading local db.json:', err);
  }
  const initial = { users: [], resumes: [] };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch {}
  return initial;
}

let localDbCache = ALLOW_JSON_FALLBACK
  ? initLocalDb()
  : { users: [] as any[], resumes: [] as any[] };

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[mysql-fallback] Error saving local db.json:', err);
  }
}

function toUserRow(u: any) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.fullName || u.full_name || '',
    password_hash: u.passwordHash || u.password_hash || '',
    salt: u.salt || '',
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    verified: u.verified === false ? 0 : 1,
    otp_hash: u.otpHash ?? u.otp_hash ?? null,
    otp_expires_at: u.otpExpiresAt ?? u.otp_expires_at ?? null,
    otp_attempts: u.otpAttempts ?? u.otp_attempts ?? null,
    otp_last_sent_at: u.otpLastSentAt ?? u.otp_last_sent_at ?? null,
    reset_code_hash: u.resetCodeHash ?? u.reset_code_hash ?? null,
    reset_code_expires_at: u.resetCodeExpiresAt ?? u.reset_code_expires_at ?? null,
    reset_code_attempts: u.resetCodeAttempts ?? u.reset_code_attempts ?? null,
    reset_last_sent_at: u.resetLastSentAt ?? u.reset_last_sent_at ?? null,
  };
}

function toResumeRow(r: any) {
  return {
    id: r.id,
    userId: r.userId || r.user_id,
    user_id: r.userId || r.user_id,
    title: r.title || 'Untitled Resume',
    templateId: r.templateId || r.template_id || 'tmpl-1',
    template_id: r.templateId || r.template_id || 'tmpl-1',
    accentColor: r.accentColor || r.accent_color || '#C98B5E',
    accent_color: r.accentColor || r.accent_color || '#C98B5E',
    content: typeof r.content === 'object' ? JSON.stringify(r.content) : (r.content || '{}'),
    createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    created_at: r.createdAt || r.created_at || new Date().toISOString(),
    updatedAt: r.updatedAt || r.updated_at || new Date().toISOString(),
    updated_at: r.updatedAt || r.updated_at || new Date().toISOString(),
  };
}

// Fallback executor for when MySQL server is unavailable (ECONNREFUSED)
function executeFallbackQuery(sql: string, params: any[] = []): [any, any] {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT 1 (health check)
  if (/^SELECT\s+1/i.test(normalizedSql)) {
    return [[{ '1': 1 }], []];
  }

  // 2. SELECT FROM app_users WHERE email = ?
  if (/FROM\s+app_users\s+WHERE\s+email\s*=/i.test(normalizedSql)) {
    const targetEmail = String(params[0] || '').trim().toLowerCase();
    const user = localDbCache.users.find(
      (u: any) => String(u.email || '').trim().toLowerCase() === targetEmail
    );
    return [user ? [toUserRow(user)] : [], []];
  }

  // 3. SELECT FROM app_users WHERE id = ?
  if (/FROM\s+app_users\s+WHERE\s+id\s*=/i.test(normalizedSql)) {
    const targetId = String(params[0] || '').trim();
    const user = localDbCache.users.find((u: any) => u.id === targetId);
    return [user ? [toUserRow(user)] : [], []];
  }

  // 4. INSERT INTO app_users
  if (/INSERT\s+INTO\s+app_users/i.test(normalizedSql)) {
    const newUser: any = {
      id: params[0],
      email: params[1],
      fullName: params[2],
      passwordHash: params[3],
      salt: params[4],
      verified: false,
      otpHash: params[5],
      otpExpiresAt: params[6],
      otpAttempts: 0,
      otpLastSentAt: params[7],
      createdAt: params[8] || new Date().toISOString(),
    };
    const existingIdx = localDbCache.users.findIndex(
      (u: any) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()
    );
    if (existingIdx >= 0) {
      localDbCache.users[existingIdx] = { ...localDbCache.users[existingIdx], ...newUser };
    } else {
      localDbCache.users.push(newUser);
    }
    saveLocalDb();
    return [{ affectedRows: 1, insertId: 0 }, []];
  }

  // 5. UPDATE app_users
  if (/UPDATE\s+app_users/i.test(normalizedSql)) {
    const userId = params[params.length - 1];
    const user = localDbCache.users.find((u: any) => u.id === userId);
    if (user) {
      if (/verified\s*=\s*1/i.test(normalizedSql)) {
        user.verified = true;
        user.otpHash = null;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
      }
      if (/otp_attempts\s*=\s*otp_attempts\s*\+\s*1/i.test(normalizedSql)) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
      }
      if (/reset_code_attempts\s*=\s*reset_code_attempts\s*\+\s*1/i.test(normalizedSql)) {
        user.resetCodeAttempts = (user.resetCodeAttempts || 0) + 1;
      }
      if (/password_hash\s*=\s*\?\s*,\s*salt\s*=\s*\?/i.test(normalizedSql) && /reset_code_hash\s*=\s*NULL/i.test(normalizedSql)) {
        user.passwordHash = params[0];
        user.salt = params[1];
        user.resetCodeHash = null;
        user.resetCodeExpiresAt = null;
        user.resetCodeAttempts = 0;
      } else if (/SET\s+email\s*=\s*\?/i.test(normalizedSql)) {
        user.email = params[0];
        user.fullName = params[1];
        user.passwordHash = params[2];
        user.salt = params[3];
        user.verified = false;
        user.otpHash = params[4];
        user.otpExpiresAt = params[5];
        user.otpAttempts = 0;
        user.otpLastSentAt = params[6];
      } else if (/salt\s*=\s*\?\s*,\s*password_hash\s*=\s*\?/i.test(normalizedSql)) {
        user.salt = params[0];
        user.passwordHash = params[1];
      } else if (/reset_code_hash\s*=\s*\?/i.test(normalizedSql)) {
        user.resetCodeHash = params[0];
        user.resetCodeExpiresAt = params[1];
        user.resetCodeAttempts = params[2];
        user.resetLastSentAt = params[3];
      }
      saveLocalDb();
    }
    return [{ affectedRows: user ? 1 : 0 }, []];
  }

  // 6. SELECT FROM app_resumes WHERE user_id = ? ORDER BY updated_at DESC
  if (/FROM\s+app_resumes\s+WHERE\s+user_id\s*=\s*\?/i.test(normalizedSql) && !/WHERE\s+id\s*=/i.test(normalizedSql)) {
    const targetUserId = params[0];
    const list = localDbCache.resumes.filter(
      (r: any) => (r.userId || r.user_id) === targetUserId
    );
    list.sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return [list.map(toResumeRow), []];
  }

  // 7. SELECT FROM app_resumes WHERE id = ? AND user_id = ?
  if (/FROM\s+app_resumes\s+WHERE\s+id\s*=\s*\?\s*AND\s+user_id\s*=\s*\?/i.test(normalizedSql)) {
    const resumeId = params[0];
    const targetUserId = params[1];
    const found = localDbCache.resumes.find(
      (r: any) => r.id === resumeId && (r.userId || r.user_id) === targetUserId
    );
    return [found ? [toResumeRow(found)] : [], []];
  }

  // 8. INSERT INTO app_resumes
  if (/INSERT\s+INTO\s+app_resumes/i.test(normalizedSql)) {
    const newResume: any = {
      id: params[0],
      userId: params[1],
      title: params[2],
      templateId: params[3],
      accentColor: params[4],
      content: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
      createdAt: params[6] || new Date().toISOString(),
      updatedAt: params[7] || new Date().toISOString(),
    };
    localDbCache.resumes.push(newResume);
    saveLocalDb();
    return [{ affectedRows: 1, insertId: 0 }, []];
  }

  // 9. UPDATE app_resumes
  if (/UPDATE\s+app_resumes/i.test(normalizedSql)) {
    const resumeId = params[5];
    const targetUserId = params[6];
    const r = localDbCache.resumes.find(
      (x: any) => x.id === resumeId && (x.userId || x.user_id) === targetUserId
    );
    if (r) {
      r.title = params[0];
      r.templateId = params[1];
      r.accentColor = params[2];
      r.content = typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3];
      r.updatedAt = params[4] || new Date().toISOString();
      saveLocalDb();
    }
    return [{ affectedRows: r ? 1 : 0 }, []];
  }

  // 10. DELETE FROM app_resumes WHERE id = ? AND user_id = ?
  if (/DELETE\s+FROM\s+app_resumes/i.test(normalizedSql)) {
    const resumeId = params[0];
    const targetUserId = params[1];
    const initialLen = localDbCache.resumes.length;
    localDbCache.resumes = localDbCache.resumes.filter(
      (x: any) => !(x.id === resumeId && (x.userId || x.user_id) === targetUserId)
    );
    const affected = initialLen - localDbCache.resumes.length;
    saveLocalDb();
    return [{ affectedRows: affected }, []];
  }

  return [[], []];
}

// Create underlying MySQL pool
const rawPool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'resume_app',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'resume_ats',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4',
});

let mysqlOnline: boolean | null = null;
let lastCheckTime = 0;

export async function checkMySQLConnection(forceRefresh = false): Promise<boolean> {
  const now = Date.now();
  if (!forceRefresh && mysqlOnline !== null && now - lastCheckTime < 15000) {
    return mysqlOnline;
  }
  try {
    const conn = await rawPool.getConnection();
    try {
      await conn.query('SELECT 1');
      mysqlOnline = true;
      lastCheckTime = now;
      return true;
    } finally {
      conn.release();
    }
  } catch (err) {
    mysqlOnline = false;
    lastCheckTime = now;
    return false;
  }
}

// Fallback mock connection for transaction support
function createFallbackConnection(): any {
  return {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
      return executeFallbackQuery(sql, params) as unknown as [T, any];
    },
    async query<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
      return executeFallbackQuery(sql, params) as unknown as [T, any];
    },
  };
}

// Resilient pool proxy that seamlessly uses MySQL when online and fallback storage when offline
const resilientPool = {
  async execute<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
    const isOnline = await checkMySQLConnection();
    if (isOnline) {
      try {
        return (await rawPool.execute<any>(sql, params)) as unknown as [T, any];
      } catch (err: any) {
        if (isDatabaseUnavailableError(err)) {
          mysqlOnline = false;
          if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
          if (LEGACY_FALLBACK_ERROR_CODES.has(err.code)) {
            return executeFallbackQuery(sql, params) as unknown as [T, any];
          }
        }
        throw err;
      }
    }
    if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
    return executeFallbackQuery(sql, params) as unknown as [T, any];
  },

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
    const isOnline = await checkMySQLConnection();
    if (isOnline) {
      try {
        return (await rawPool.query<any>(sql, params)) as unknown as [T, any];
      } catch (err: any) {
        if (isDatabaseUnavailableError(err)) {
          mysqlOnline = false;
          if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
          if (LEGACY_FALLBACK_ERROR_CODES.has(err.code)) {
            return executeFallbackQuery(sql, params) as unknown as [T, any];
          }
        }
        throw err;
      }
    }
    if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
    return executeFallbackQuery(sql, params) as unknown as [T, any];
  },

  async getConnection(): Promise<any> {
    const isOnline = await checkMySQLConnection();
    if (isOnline) {
      try {
        return await rawPool.getConnection();
      } catch (err: any) {
        if (isDatabaseUnavailableError(err)) {
          mysqlOnline = false;
          if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
          if (LEGACY_FALLBACK_ERROR_CODES.has(err.code)) {
            return createFallbackConnection();
          }
        }
        throw err;
      }
    }
    if (!ALLOW_JSON_FALLBACK) throw new DatabaseUnavailableError();
    return createFallbackConnection();
  },
};

export default resilientPool as unknown as Pool;
