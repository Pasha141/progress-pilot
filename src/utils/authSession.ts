/**
 * @file src/utils/authSession.ts
 * Centralized authentication token storage, 7-day Remember Me expiry handling,
 * per-user browser draft scoping, legacy unscoped key cleanup, and 401-aware fetch wrapper.
 */

const SESSION_TOKEN_KEY = 'auth_token';
const REMEMBER_TOKEN_KEY = 'auth_token_remember';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const LEGACY_UNSCOPED_KEYS = [
  'auth_token',
  'resume_v3',
  'resume_template_v3',
  'resume_accent_v3',
  'saved_resumes_list_v2',
  'cover_letter_v2',
];

const USER_DRAFT_PREFIXES = [
  'resume_v3:',
  'resume_template_v3:',
  'resume_accent_v3:',
  'active_resume_id_v3:',
  'active_resume_title_v3:',
  'cover_letter_v3:',
];

interface RememberedTokenPayload {
  token: string;
  expiresAt: number;
}

/**
 * Purges legacy global unscoped localStorage keys so old pre-filled/cached resumes never reappear.
 */
export function purgeLegacyUnscopedDrafts(): void {
  try {
    for (const key of LEGACY_UNSCOPED_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Reads the active JWT from sessionStorage (default) or unexpired 7-day Remember Me in localStorage.
 */
export function getAuthToken(): string | null {
  try {
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) {
      return sessionToken;
    }

    const rememberedRaw = localStorage.getItem(REMEMBER_TOKEN_KEY);
    if (rememberedRaw) {
      const parsed: RememberedTokenPayload = JSON.parse(rememberedRaw);
      if (parsed?.token && typeof parsed.expiresAt === 'number') {
        if (Date.now() <= parsed.expiresAt) {
          // Hydrate into sessionStorage for the current tab session
          sessionStorage.setItem(SESSION_TOKEN_KEY, parsed.token);
          return parsed.token;
        }
      }
      localStorage.removeItem(REMEMBER_TOKEN_KEY);
    }
  } catch {
    try {
      localStorage.removeItem(REMEMBER_TOKEN_KEY);
    } catch {}
  }
  return null;
}

/**
 * Stores the JWT in sessionStorage by default, or in localStorage with a 7-day expiry if rememberMe is true.
 */
export function saveAuthToken(token: string, rememberMe: boolean): void {
  try {
    localStorage.removeItem('auth_token');
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);

    if (rememberMe) {
      const payload: RememberedTokenPayload = {
        token,
        expiresAt: Date.now() + SEVEN_DAYS_MS,
      };
      localStorage.setItem(REMEMBER_TOKEN_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(REMEMBER_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Returns per-user namespaced browser storage keys so accounts never share drafts.
 */
export function getUserDraftKeys(userId: string) {
  return {
    resume: `resume_v3:${userId}`,
    template: `resume_template_v3:${userId}`,
    accent: `resume_accent_v3:${userId}`,
    activeResumeId: `active_resume_id_v3:${userId}`,
    activeResumeTitle: `active_resume_title_v3:${userId}`,
    coverLetter: `cover_letter_v3:${userId}`,
  };
}

/**
 * Clears JWT tokens and all browser-stored resume/cover-letter drafts on logout or session expiry.
 */
export function clearSessionAndDrafts(userId?: string): void {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_TOKEN_KEY);
    purgeLegacyUnscopedDrafts();

    const clearMatchingFrom = (storage: Storage) => {
      const keysToDelete: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (userId && k.endsWith(`:${userId}`)) {
          keysToDelete.push(k);
        } else if (USER_DRAFT_PREFIXES.some((prefix) => k.startsWith(prefix))) {
          keysToDelete.push(k);
        }
      }
      for (const k of keysToDelete) {
        storage.removeItem(k);
      }
    };

    clearMatchingFrom(localStorage);
    clearMatchingFrom(sessionStorage);
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Broadcasts session expiry so App.tsx clears state and redirects to /login with a friendly notice.
 */
export function notifySessionExpired(
  message = 'Your session expired. Please sign in again.'
): void {
  clearSessionAndDrafts();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { message },
      })
    );
  }
}

/**
 * Authenticated fetch wrapper: attaches Bearer JWT and handles HTTP 401 by expiring the session cleanly.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    notifySessionExpired('Your session expired. Please sign in again.');
  }

  return response;
}
