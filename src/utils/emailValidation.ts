/**
 * Strict Email Validation, Disposable Domain Blocklist & Common Provider Typo Detector
 * Shared between the React frontend and Express backend (server.ts).
 */

import { DISPOSABLE_EMAIL_DOMAINS } from './disposableDomains';

export { DISPOSABLE_EMAIL_DOMAINS };

const COMMON_PROVIDER_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmailc.om': 'gmail.com',
  'gmil.com': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  // Outlook typos
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'oultook.com': 'outlook.com',
  'otlook.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.cm': 'outlook.com',
  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'homtail.com': 'hotmail.com',
  'htomail.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
};

const MAJOR_PROVIDERS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'] as const;

// Legitimate regional domains that are 1 edit away from a major .com provider — never flag these as typos.
const LEGIT_NEAR_DOMAINS = new Set([
  'ymail.com',
  'gmail.de',
  'yahoo.in',
  'yahoo.ca',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.jp',
  'yahoo.co.uk',
  'yahoo.co.in',
  'outlook.in',
  'outlook.de',
  'outlook.fr',
  'outlook.es',
  'outlook.it',
  'outlook.co.uk',
  'hotmail.in',
  'hotmail.de',
  'hotmail.fr',
  'hotmail.es',
  'hotmail.it',
  'hotmail.co.uk',
]);

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

export function normalizeEmail(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export interface EmailValidationResult {
  valid: boolean;
  normalized: string;
  domain?: string;
  error?: string;
  suggestion?: string;
}

export function validateEmailStrict(raw: string): EmailValidationResult {
  const trimmed = String(raw || '').trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized) {
    return { valid: false, normalized, error: 'Email address is required.' };
  }

  if (/\s/.test(trimmed)) {
    return { valid: false, normalized, error: 'Email address must not contain spaces.' };
  }

  if (normalized.length > 254) {
    return { valid: false, normalized, error: 'Email address must be 254 characters or fewer.' };
  }

  const atParts = normalized.split('@');
  if (atParts.length !== 2) {
    return { valid: false, normalized, error: 'Please enter a valid email address with a single @ symbol.' };
  }

  const [local, domain] = atParts;

  if (!local || local.length > 64) {
    return { valid: false, normalized, error: 'Please enter a valid email username before @.' };
  }

  // Local part checks: allowed standard characters, no leading/trailing/consecutive dots
  if (
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)
  ) {
    return { valid: false, normalized, error: 'Please enter a valid email address.' };
  }

  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { valid: false, normalized, error: 'Please enter a valid email domain (e.g. name@example.com).' };
  }

  const labels = domain.split('.');
  for (const label of labels) {
    if (!label || label.length > 63 || label.startsWith('-') || label.endsWith('-') || !/^[a-z0-9-]+$/.test(label)) {
      return { valid: false, normalized, error: 'Please enter a valid email domain.' };
    }
  }

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) {
    return { valid: false, normalized, error: 'Email domain must end with a valid top-level domain (at least 2 letters).' };
  }

  // Check disposable domains (exact match or subdomain of disposable domain)
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
  if (isDisposable) {
    return {
      valid: false,
      normalized,
      domain,
      error: 'Temporary or disposable email addresses are not allowed. Please enter a real email address.',
    };
  }

  // Check common provider typos (exact dictionary + distance-1 check)
  if (!LEGIT_NEAR_DOMAINS.has(domain) && !(MAJOR_PROVIDERS as readonly string[]).includes(domain)) {
    let targetProvider: string | undefined = COMMON_PROVIDER_TYPOS[domain];
    if (!targetProvider) {
      for (const provider of MAJOR_PROVIDERS) {
        if (levenshteinDistance(domain, provider) === 1) {
          targetProvider = provider;
          break;
        }
      }
    }
    if (targetProvider) {
      const suggestion = `${local}@${targetProvider}`;
      return {
        valid: false,
        normalized,
        domain,
        suggestion,
        error: `Did you mean ${suggestion}?`,
      };
    }
  }

  return { valid: true, normalized, domain };
}
