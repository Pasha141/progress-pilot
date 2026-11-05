export interface AtsMatchResult {
  matchScore: number;
  tfidfCosineSimilarity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export interface AtsBreakdownItem {
  category: string;
  score: number;
  maxScore: number;
  icon: string;
}

export interface AtsIssue {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'tip';
  message: string;
  fixRecommendation: string;
}

export interface AtsSuggestion {
  section: string;
  issue: string;
  fix: string;
  example_rewrite: {
    before: string;
    after: string;
  };
}

export interface AtsAnalysisResult {
  score: number;
  scoreLabel: 'Poor' | 'Needs Work' | 'Good' | 'Excellent';
  scoreColor: 'red' | 'orange' | 'green';
  breakdown: AtsBreakdownItem[];
  foundKeywords: string[];
  missingKeywords: string[];
  issues: AtsIssue[];
  aiSuggestions: {
    score_improvement_estimate: number;
    suggestions: AtsSuggestion[];
    rewritten_summary: string;
    missing_keywords: string[];
  };
  wordCount: number;
  charCount: number;
}

interface FastApiAtsConfig {
  baseUrl: URL;
  token: string;
}

export class FastApiAtsError extends Error {
  constructor(
    message: string,
    readonly statusCode: 502 | 503 | 504
  ) {
    super(message);
    this.name = 'FastApiAtsError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isStringArray(value: unknown, maxLength: number): value is string[] {
  return Array.isArray(value) &&
    value.length <= maxLength &&
    value.every((item) => typeof item === 'string' && item.length <= 1000);
}

function readConfig(): FastApiAtsConfig | null {
  const rawUrl = (process.env.FASTAPI_ATS_URL || '').trim();
  const token = (process.env.FASTAPI_ATS_TOKEN || '').trim();
  if (!rawUrl && !token) return null;
  if (!rawUrl || token.length < 32 || /^(replace_with_|change_this_|your_)/i.test(token)) {
    throw new Error('FASTAPI_ATS_URL and a non-placeholder FASTAPI_ATS_TOKEN of at least 32 characters are required together.');
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    throw new Error('FASTAPI_ATS_URL must be a valid internal HTTP(S) URL.');
  }

  const isLoopback =
    baseUrl.hostname === 'localhost' ||
    baseUrl.hostname === '127.0.0.1' ||
    baseUrl.hostname === '[::1]';
  if (
    !['http:', 'https:'].includes(baseUrl.protocol) ||
    (!isLoopback && baseUrl.protocol !== 'https:') ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash ||
    (baseUrl.pathname !== '/' && baseUrl.pathname !== '')
  ) {
    throw new Error('FASTAPI_ATS_URL must be an HTTPS service URL or a loopback HTTP URL without credentials or a path.');
  }

  return { baseUrl, token };
}

export function validateFastApiAtsConfiguration(): void {
  readConfig();
}

function endpointUrl(baseUrl: URL, endpoint: 'match' | 'analyze'): URL {
  return new URL(`/internal/ats/${endpoint}`, baseUrl);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const maxResponseBytes = 256 * 1024;
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxResponseBytes) {
    await response.body?.cancel();
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxResponseBytes) {
        await reader.cancel();
        throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof FastApiAtsError) throw error;
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new FastApiAtsError('ATS processing service timed out.', 504);
    }
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }
}

function isMatchResponse(value: unknown): value is { success: true; result: AtsMatchResult } {
  if (!isRecord(value) || value.success !== true || !isRecord(value.result)) return false;
  const result = value.result;
  return (
    Number.isInteger(result.matchScore) &&
    Number(result.matchScore) >= 0 &&
    Number(result.matchScore) <= 98 &&
    typeof result.tfidfCosineSimilarity === 'number' &&
    result.tfidfCosineSimilarity >= 0 &&
    result.tfidfCosineSimilarity <= 1 &&
    isStringArray(result.matchedKeywords, 10) &&
    isStringArray(result.missingKeywords, 8) &&
    isStringArray(result.recommendations, 3) &&
    result.recommendations.length > 0
  );
}

function isAnalysisResponse(value: unknown): value is AtsAnalysisResult {
  if (!isRecord(value)) return false;
  if (
    !Number.isInteger(value.score) ||
    Number(value.score) < 0 ||
    Number(value.score) > 100 ||
    !['Poor', 'Needs Work', 'Good', 'Excellent'].includes(String(value.scoreLabel)) ||
    !['red', 'orange', 'green'].includes(String(value.scoreColor)) ||
    !Number.isInteger(value.wordCount) ||
    !Number.isInteger(value.charCount) ||
    !isStringArray(value.foundKeywords, 20) ||
    !isStringArray(value.missingKeywords, 20) ||
    !Array.isArray(value.breakdown) ||
    value.breakdown.length < 1 ||
    value.breakdown.length > 8 ||
    !Array.isArray(value.issues) ||
    value.issues.length > 20 ||
    !isRecord(value.aiSuggestions)
  ) return false;

  const suggestions = value.aiSuggestions;
  if (
    !Number.isInteger(suggestions.score_improvement_estimate) ||
    Number(suggestions.score_improvement_estimate) < 0 ||
    Number(suggestions.score_improvement_estimate) > 100 ||
    !isStringArray(suggestions.missing_keywords, 6) ||
    !Array.isArray(suggestions.suggestions) ||
    suggestions.suggestions.length > 5 ||
    typeof suggestions.rewritten_summary !== 'string' ||
    suggestions.rewritten_summary.length > 4000 ||
    Number(value.wordCount) < 0 ||
    Number(value.wordCount) > 25_000 ||
    Number(value.charCount) < 0 ||
    Number(value.charCount) > 25_000
  ) return false;

  const validBreakdown = value.breakdown.every((item) =>
    isRecord(item) &&
    typeof item.category === 'string' &&
    item.category.length <= 100 &&
    Number.isInteger(item.score) &&
    Number.isInteger(item.maxScore) &&
    Number(item.maxScore) <= 100 &&
    typeof item.icon === 'string' &&
    item.icon.length <= 100 &&
    Number(item.score) >= 0 &&
    Number(item.score) <= Number(item.maxScore)
  );
  const validIssues = value.issues.every((item) =>
    isRecord(item) &&
    typeof item.id === 'string' &&
    item.id.length <= 100 &&
    typeof item.category === 'string' &&
    item.category.length <= 100 &&
    ['critical', 'warning', 'tip'].includes(String(item.severity)) &&
    typeof item.message === 'string' &&
    item.message.length <= 1000 &&
    typeof item.fixRecommendation === 'string' &&
    item.fixRecommendation.length <= 1000
  );
  const validSuggestions = suggestions.suggestions.every((item) =>
    isRecord(item) &&
    typeof item.section === 'string' &&
    item.section.length <= 100 &&
    typeof item.issue === 'string' &&
    item.issue.length <= 1000 &&
    typeof item.fix === 'string' &&
    item.fix.length <= 1000 &&
    isRecord(item.example_rewrite) &&
    typeof item.example_rewrite.before === 'string' &&
    item.example_rewrite.before.length <= 2000 &&
    typeof item.example_rewrite.after === 'string' &&
    item.example_rewrite.after.length <= 2000
  );
  return validBreakdown && validIssues && validSuggestions;
}

export async function callFastApiAts(
  endpoint: 'match',
  payload: { resumeText: string; jobDescription: string; targetRole?: string }
): Promise<{ success: true; result: AtsMatchResult }>;
export async function callFastApiAts(
  endpoint: 'analyze',
  payload: { resumeText: string; jobDescription?: string }
): Promise<AtsAnalysisResult>;
export async function callFastApiAts(
  endpoint: 'match' | 'analyze',
  payload:
    | { resumeText: string; jobDescription: string; targetRole?: string }
    | { resumeText: string; jobDescription?: string }
): Promise<{ success: true; result: AtsMatchResult } | AtsAnalysisResult> {
  const config = readConfig();
  if (!config) {
    throw new FastApiAtsError('ATS processing service is not configured.', 503);
  }

  let response: Response;
  try {
    response = await fetch(endpointUrl(config.baseUrl, endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Internal-ATS-Token': config.token,
      },
      body: JSON.stringify(payload),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new FastApiAtsError('ATS processing service timed out.', 504);
    }
    throw new FastApiAtsError('ATS processing service is temporarily unavailable.', 503);
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new FastApiAtsError('ATS processing service is temporarily unavailable.', 503);
  }

  let data: unknown;
  try {
    data = await readJsonResponse(response);
  } catch (error) {
    if (error instanceof FastApiAtsError) throw error;
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }

  if (endpoint === 'match') {
    if (!isMatchResponse(data)) {
      throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
    }
    return data;
  }
  if (!isAnalysisResponse(data)) {
    throw new FastApiAtsError('ATS processing service returned an invalid response.', 502);
  }
  return data;
}
