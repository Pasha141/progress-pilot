/**
 * @file src/utils/geminiAi.ts
 * Client-side API bridge for server-side Gemini AI resume assistance endpoints.
 * All Gemini SDK calls execute strictly on the backend (/api/ai/*) with clean fallbacks if offline.
 */

import { authFetch } from './authSession';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface SummaryGenParams {
  jobTitle: string;
  experienceYears: string;
  skills: string[];
  tone: 'Professional' | 'Confident' | 'Friendly';
}

export interface SummaryOption {
  tag: string;
  summary: string;
  wordCount: number;
}

/**
 * Deterministic ATS fallback summary generator when server is unreachable
 */
function generateFallbackSummaries(params: SummaryGenParams): SummaryOption[] {
  const role = params.jobTitle.trim() || 'Software & Analytics Professional';
  const exp = params.experienceYears.trim() || 'Experienced';
  const skillsList =
    params.skills.length > 0 ? params.skills.slice(0, 4).join(', ') : 'Python, SQL, modern web architectures';

  const expPrefix =
    exp.toLowerCase().includes('fresher') || exp.toLowerCase().includes('0')
      ? 'Motivated, detail-oriented graduate'
      : `Results-driven ${role} with ${exp} of hands-on experience`;

  return [
    {
      tag: 'ATS Optimized',
      summary: `${expPrefix} specializing in ${skillsList}. Proven track record designing scalable solutions, optimizing workflows, and translating business requirements into reliable deliverables. Dedicated to clean architecture and measurable team outcomes.`,
      wordCount: 35,
    },
    {
      tag: 'Impact & Collaboration',
      summary: `Proactive and analytically rigorous ${role} equipped with practical proficiency in ${skillsList}. Collaborates effectively across cross-functional teams to deliver maintainable, data-informed systems on schedule.`,
      wordCount: 30,
    },
    {
      tag: 'Technical Specialist',
      summary: `Technically grounded ${role} with hands-on expertise across ${skillsList}. Experienced in structured problem-solving, thorough testing, and building user-focused features from concept to release.`,
      wordCount: 28,
    },
  ];
}

/**
 * Generate 3 ATS Professional Summary options via backend proxy
 */
export async function generateSummaryOptions(params: SummaryGenParams): Promise<SummaryOption[]> {
  try {
    const res = await authFetch(`${API_BASE}/api/ai/generate-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: params.jobTitle,
        skills: params.skills,
        experiences: `${params.experienceYears} experience`,
        style: params.tone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.options && Array.isArray(data.options) && data.options.length > 0) {
        return data.options;
      }
    }
  } catch (err) {
    console.warn('Summary API unavailable, using deterministic fallback:', err);
  }

  return generateFallbackSummaries(params);
}

/**
 * Improve existing summary text via server-side Gemini endpoint: 'improve' | 'shorter' | 'impactful'
 */
export async function improveSummaryText(
  currentText: string,
  mode: 'improve' | 'shorter' | 'impactful',
  role: string = 'Professional'
): Promise<string> {
  const trimmed = currentText.trim();
  if (!trimmed) {
    return `Accomplished ${role} with proven expertise in driving technical and operational outcomes. Dedicated to building reliable systems and delivering project milestones efficiently.`;
  }

  try {
    const res = await authFetch(`${API_BASE}/api/ai/rewrite-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'summary',
        text: trimmed,
        mode,
        role,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.text === 'string' && data.text.trim()) {
        return data.text.trim();
      }
    }
  } catch (err) {
    console.warn('Rewrite API unavailable, applying local text cleanup:', err);
  }

  if (mode === 'shorter') {
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    return sentences.slice(0, 2).join(' ');
  }

  return trimmed.replace(/\bI am\b/gi, '').replace(/\s{2,}/g, ' ').trim() || trimmed;
}

/**
 * Transform a rough experience sentence into an achievement bullet via server-side Gemini endpoint
 */
export async function improveExperienceBullet(
  rawBullet: string,
  roleContext: string = 'Professional'
): Promise<string> {
  const trimmed = rawBullet.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const res = await authFetch(`${API_BASE}/api/ai/rewrite-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'bullet',
        text: trimmed,
        role: roleContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.text === 'string' && data.text.trim()) {
        return data.text.trim().replace(/^[-•*]\s*/, '');
      }
    }
  } catch (err) {
    console.warn('Bullet rewrite API unavailable, applying clean verb opener:', err);
  }

  const cleaned = trimmed.replace(/^(responsible for|worked on|helped with|assisted in)\s+/i, '');
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return capitalized.endsWith('.') ? capitalized : `${capitalized}.`;
}

export interface CoverLetterAIOptions {
  senderName: string;
  senderTitle?: string;
  targetRole: string;
  targetCompany: string;
  recipientName?: string;
  experienceLevel?: string;
  keySkills?: string;
  tone?: string;
}

export interface GeneratedCoverLetterResult {
  salutation: string;
  openingParagraph: string;
  bodyParagraph: string;
  bulletPoints: string[];
  closingParagraph: string;
  signoff: string;
}

/**
 * Generate full tailored Cover Letter via server-side Gemini endpoint with local fallback
 */
export async function generateCoverLetterAI(
  options: CoverLetterAIOptions
): Promise<GeneratedCoverLetterResult> {
  const role = options.targetRole.trim() || 'Software & Analytics Professional';
  const company = options.targetCompany.trim() || 'your organization';
  const recipient = options.recipientName?.trim() || 'Hiring Manager';
  const candidate = options.senderName?.trim() || 'Candidate';
  const skills =
    options.keySkills?.trim() || 'modern technical architectures, analytical problem-solving, and cross-functional collaboration';
  const exp = options.experienceLevel || 'Mid-Level';

  try {
    const res = await authFetch(`${API_BASE}/api/ai/generate-cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: candidate,
        targetRole: role,
        targetCompany: company,
        recipientName: recipient,
        experienceLevel: exp,
        keySkills: skills,
        tone: options.tone || 'Professional & Confident',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.result?.openingParagraph && data.result?.bodyParagraph) {
        return {
          salutation: data.result.salutation || `Dear ${recipient}:`,
          openingParagraph: data.result.openingParagraph,
          bodyParagraph: data.result.bodyParagraph,
          bulletPoints: Array.isArray(data.result.bulletPoints) ? data.result.bulletPoints : [],
          closingParagraph: data.result.closingParagraph || '',
          signoff: data.result.signoff || 'With best regards,',
        };
      }
    }
  } catch (err) {
    console.warn('Cover letter API unavailable, using structured template fallback:', err);
  }

  return {
    salutation: `Dear ${recipient}:`,
    openingParagraph: `I am writing to express my strong interest in the ${role} position at ${company}. With hands-on experience in ${skills}, I am excited to contribute to your team's goals and engineering standards.`,
    bodyParagraph: `Throughout my background, I have focused on solving practical technical and operational challenges by building maintainable, user-focused solutions. At ${company}, I look forward to applying my proficiency in ${skills} to support reliable delivery and clear team collaboration.`,
    bulletPoints: [
      `Built and maintained structured software workflows aligned with project requirements and quality standards.`,
      `Collaborated across technical and product stakeholders to resolve bottlenecks and ship dependable updates.`,
      `Applied analytical troubleshooting, clean documentation, and version control best practices.`,
    ],
    closingParagraph: `Thank you for your time and consideration. I would welcome the opportunity to discuss how my skills and background align with ${company}'s upcoming initiatives.`,
    signoff: 'With best regards,',
  };
}
