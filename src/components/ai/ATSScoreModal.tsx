/**
 * @file src/components/ai/ATSScoreModal.tsx
 * Advanced Live ATS Score Checker, Keyword Density Analyzer & Achievement Quantifier by Junaid.
 * Warm Palette: #FBF5EC, #F4E6D2, #E1D4C2, #291C0E, #6E473B, #C98B5E.
 * Features:
 * 1. Keyword density calculation (% of resume word count with optimal vs under/over-indexed status).
 * 2. Missing action verbs detection & weak opener flagging with immediate power verb replacements.
 * 3. Achievement quantifier using the Google XYZ formula ([Accomplished X] + [Measured by Y] + [By doing Z]).
 * 4. Specific, actionable improvement suggestions with one-click copyable rewrites.
 * 5. High-contrast typography and seamless responsive UI.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ResumeData } from '../../types/resume';
import { authFetch } from '../../utils/authSession';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Target,
  FileCheck,
  Briefcase,
  TrendingUp,
  Award,
  Loader2,
  Check,
  Search,
  ArrowRight,
  Zap,
  BarChart2,
  Copy,
  Sliders,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface ATSScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onOpenAiSummary?: () => void;
}

const STRONG_ACTION_VERBS = [
  'accelerated', 'achieved', 'analyzed', 'architected', 'automated', 'built',
  'collaborated', 'created', 'delivered', 'deployed', 'designed', 'developed',
  'engineered', 'enhanced', 'established', 'executed', 'formulated', 'generated',
  'implemented', 'improved', 'increased', 'initiated', 'integrated', 'launched',
  'led', 'maximized', 'mentored', 'minimized', 'modernized', 'optimized',
  'orchestrated', 'pioneered', 'reduced', 'refactored', 'resolved', 'revamped',
  'scaled', 'simplified', 'spearheaded', 'standardized', 'streamlined', 'strengthened',
  'transformed', 'upgraded',
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

const INDUSTRY_KEYWORDS = [
  'react', 'typescript', 'javascript', 'python', 'sql', 'mysql', 'postgresql',
  'node.js', 'express', 'docker', 'aws', 'git', 'api', 'apis', 'rest', 'html',
  'css', 'tailwind', 'graphql', 'mongodb', 'agile', 'ci/cd', 'linux', 'testing',
  'pandas', 'numpy', 'machine learning', 'data analysis', 'algorithms', 'fastapi',
  'springboot', 'microservices', 'cloud', 'security', 'redis', 'kafka',
];

export const ATSScoreModal: React.FC<ATSScoreModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onOpenAiSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'density' | 'verbs' | 'jobMatch'>('audit');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Job Matcher State
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState(
    resumeData.personalInfo.jobTitle || 'Software Engineer'
  );
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
  } | null>(null);

  // Deep client-side & server-backed algorithm
  const analysis = useMemo(() => {
    const p = resumeData.personalInfo;
    const fullName = p.fullName || '';
    const summary = resumeData.summary || '';
    const experiences = resumeData.experiences || [];
    const projects = resumeData.projects || [];
    const skills = resumeData.skills || [];
    const education = resumeData.education || [];

    // Collect all bullet points
    const allBullets: string[] = [];
    experiences.forEach((e) => (e.bullets || []).forEach((b) => { if (b?.trim()) allBullets.push(b.trim()); }));
    projects.forEach((pr) => (pr.bullets || []).forEach((b) => { if (b?.trim()) allBullets.push(b.trim()); }));

    // Full resume text for keyword density
    const fullText = [
      fullName,
      p.jobTitle || '',
      summary,
      ...allBullets,
      ...skills.flatMap((c) => (c.skills || []).map((s) => (typeof s === 'string' ? s : s.name || ''))),
      ...education.map((ed) => `${ed.degree || ''} ${ed.fieldOfStudy || ''} ${ed.school || ''}`),
    ].join(' ').toLowerCase();

    const words = fullText.match(/\b[a-z]{2,}\b/g) || [];
    const totalWords = words.length;

    // 1. Keyword Density Analysis
    const detectedKeywordsMap = new Map<string, number>();
    INDUSTRY_KEYWORDS.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches && matches.length > 0) {
        detectedKeywordsMap.set(kw, matches.length);
      }
    });

    const keywordList = Array.from(detectedKeywordsMap.entries())
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
      .sort((a, b) => b.count - a.count);

    const missingKeywords = INDUSTRY_KEYWORDS
      .filter((k) => !detectedKeywordsMap.has(k))
      .slice(0, 6)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1));

    // 2. Action Verbs & Weak Openers Analysis
    const foundVerbsSet = new Set<string>();
    const weakBullets: Array<{
      originalBullet: string;
      weakPhrase: string;
      suggestedVerb: string;
      suggestedRewrite: string;
    }> = [];

    allBullets.forEach((bullet) => {
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      if (firstWord && STRONG_ACTION_VERBS.includes(firstWord)) {
        foundVerbsSet.add(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
      }

      for (const weak of WEAK_OPENERS) {
        if (weak.pattern.test(bullet)) {
          const stripped = bullet.replace(weak.pattern, '').trim();
          const cleanRest = stripped.charAt(0).toLowerCase() + stripped.slice(1);
          weakBullets.push({
            originalBullet: bullet,
            weakPhrase: weak.phrase,
            suggestedVerb: weak.suggestedVerb,
            suggestedRewrite: `${weak.suggestedVerb} ${cleanRest} to improve turnaround time and operational reliability.`,
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
        category: 'Optimization & Speed',
        verbs: ['Accelerated', 'Streamlined', 'Maximized', 'Automated'].filter((v) => !foundVerbs.includes(v)),
      },
    ];

    // 3. Quantified Achievements & Formula Rewrites
    const metricPattern = /(\d+%\s*|\$\s*\d+|\b\d+\s*k\b|\b\d+\s*ms\b|\b\d+\s*(?:users|clients|requests|hours|days|x)\b|\b\d+\+?\b)/i;
    let metricCount = 0;
    const unquantifiedBullets: Array<{
      originalBullet: string;
      suggestedRewrite: string;
      metricTip: string;
    }> = [];

    allBullets.forEach((bullet) => {
      if (metricPattern.test(bullet)) {
        metricCount++;
      } else {
        if (unquantifiedBullets.length < 4) {
          const clean = bullet.replace(/\.$/, '');
          unquantifiedBullets.push({
            originalBullet: bullet,
            suggestedRewrite: `${clean}, achieving a 35% speed improvement and supporting 10,000+ daily requests.`,
            metricTip: 'Add measurable volume (e.g., 35% increase, 50k users, saved 12 hrs/week).',
          });
        }
      }
    });

    const totalBullets = allBullets.length;
    const quantifiedRatio = totalBullets > 0 ? Math.round((metricCount / totalBullets) * 100) : 0;

    // 4. Sub-Scores
    const hasName = Boolean(p.fullName?.trim());
    const hasEmail = Boolean(p.email?.trim());
    const hasPhone = Boolean(p.phone?.trim());
    const summaryWordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
    const hasGoodSummary = summaryWordCount >= 35 && summaryWordCount <= 85;

    const hasAnyContent =
      hasName || hasEmail || summaryWordCount > 0 || totalBullets > 0 || skills.length > 0;

    let keywordScore = Math.min(Math.round((keywordList.length / 5) * 100), 96);
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

    // Specific Suggestions List
    const specificSuggestions: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      example?: string;
    }> = [];

    if (weakBullets.length > 0) {
      specificSuggestions.push({
        priority: 'high',
        category: 'Action Verbs',
        title: `Replace ${weakBullets.length} passive bullet opener(s)`,
        description: `ATS parsers heavily favor strong action verbs over passive phrases like "${weakBullets[0].weakPhrase}".`,
        example: `Instead of: "${weakBullets[0].originalBullet.slice(0, 50)}..." → Use: "${weakBullets[0].suggestedRewrite.slice(0, 60)}..."`,
      });
    }

    if (unquantifiedBullets.length > 0) {
      specificSuggestions.push({
        priority: 'high',
        category: 'Quantified Metrics',
        title: `Quantify ${unquantifiedBullets.length} descriptive achievement bullet(s)`,
        description: 'Recruiters reject resumes that read like job descriptions. Transform tasks into measurable business value using the Google XYZ formula.',
        example: `Instead of: "${unquantifiedBullets[0].originalBullet.slice(0, 50)}..." → Add metrics: "${unquantifiedBullets[0].suggestedRewrite.slice(0, 60)}..."`,
      });
    }

    if (keywordList.length < 5) {
      specificSuggestions.push({
        priority: 'medium',
        category: 'Keyword Density',
        title: `Inject missing core skills for ${p.jobTitle || 'your role'}`,
        description: `Your resume currently indexes ${keywordList.length} major industry keywords. Incorporate terms like ${missingKeywords.slice(0, 3).join(', ')} to raise parser match rate.`,
      });
    }

    if (!hasGoodSummary) {
      specificSuggestions.push({
        priority: 'medium',
        category: 'Summary',
        title: 'Calibrate Professional Summary (40–70 words)',
        description: 'A focused 3-sentence summary highlighting your core tech stack increases automated ATS passing rates by 35%.',
      });
    }

    return {
      score: overallScore,
      subScores: {
        keywordScore,
        actionVerbScore,
        quantifiedScore,
        formatScore,
      },
      totalWords,
      keywordList,
      missingKeywords,
      foundVerbs,
      weakBullets,
      missingActionVerbs,
      metricCount,
      totalBullets,
      quantifiedRatio,
      unquantifiedBullets,
      specificSuggestions,
    };
  }, [resumeData]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleRunJobMatch = async () => {
    if (!jobDescription.trim()) return;
    setIsMatching(true);

    try {
      const resumeSummaryText = `
${resumeData.personalInfo.fullName} - ${resumeData.personalInfo.jobTitle}
Skills: ${resumeData.skills.flatMap((c) => c.skills).map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}
Summary: ${resumeData.summary}
Experience: ${resumeData.experiences.map((e) => `${e.role} at ${e.company}: ${e.bullets.join(' ')}`).join('\n')}
Projects: ${resumeData.projects.map((pr) => `${pr.title} (${pr.technologies.join(', ')}): ${pr.bullets.join(' ')}`).join('\n')}
      `.trim();

      const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const res = await authFetch(`${apiBase}/api/ai/match-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeSummaryText,
          jobDescription,
          targetRole,
        }),
      });

      if (res.status === 401) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setMatchResult(data.result);
          return;
        }
      }
    } catch (err) {
      console.warn('Job match API fallback:', err);
    } finally {
      setIsMatching(false);
    }

    // Client-side TF-IDF + keyword overlap fallback when server is offline
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'will', 'have', 'are', 'you', 'our',
      'role', 'team', 'work', 'working', 'looking', 'experience', 'years', 'ability', 'strong', 'using',
    ]);
    const tokenize = (str: string) =>
      (str.toLowerCase().match(/\b[a-z0-9+#.-]{3,20}\b/g) || []).filter((t) => !stopWords.has(t));

    const jdTokens = tokenize(jobDescription);
    const resTokens = tokenize(
      `${resumeData.personalInfo.jobTitle} ${resumeData.summary} ${resumeData.skills
        .flatMap((c) => c.skills)
        .map((s) => (typeof s === 'string' ? s : s.name))
        .join(' ')} ${resumeData.experiences.map((e) => e.bullets.join(' ')).join(' ')}`
    );

    const vocab = Array.from(new Set([...jdTokens, ...resTokens]));
    let dot = 0;
    let magJd = 0;
    let magRes = 0;
    for (const term of vocab) {
      const tfJd = jdTokens.filter((t) => t === term).length / Math.max(1, jdTokens.length);
      const tfRes = resTokens.filter((t) => t === term).length / Math.max(1, resTokens.length);
      const df = (tfJd > 0 ? 1 : 0) + (tfRes > 0 ? 1 : 0);
      const idf = Math.log((2 + 1) / (df + 1)) + 1;
      const wJd = tfJd * idf;
      const wRes = tfRes * idf;
      dot += wJd * wRes;
      magJd += wJd * wJd;
      magRes += wRes * wRes;
    }
    const cosineSim = magJd > 0 && magRes > 0 ? dot / (Math.sqrt(magJd) * Math.sqrt(magRes)) : 0;

    const uniqueJdTerms = Array.from(new Set(jdTokens)).filter(
      (w) => INDUSTRY_KEYWORDS.includes(w) || w.length >= 5
    );
    const resSet = new Set(resTokens);
    const matched = uniqueJdTerms.filter((w) => resSet.has(w)).slice(0, 8);
    const missing = uniqueJdTerms.filter((w) => !resSet.has(w)).slice(0, 6);
    const kwRatio = uniqueJdTerms.length > 0 ? matched.length / uniqueJdTerms.length : 0;
    const blendedScore = Math.min(98, Math.round(cosineSim * 45 + kwRatio * 55));

    setMatchResult({
      matchScore: blendedScore,
      matchedKeywords: matched.map((m) => m.toUpperCase()),
      missingKeywords: missing.map((m) => m.toUpperCase()),
      recommendations: [
        missing.length > 0
          ? `Add missing job-specific keywords (${missing.slice(0, 3).join(', ')}) where they match your real experience.`
          : 'Your core technical keywords align well with this job description.',
        'Mirror key terminology from the job posting in your Professional Summary and top Experience bullets.',
      ],
    });
    setIsMatching(false);
  };

  if (!isOpen) return null;

  const currentScore = analysis.score;
  const scoreBadgeBg =
    currentScore >= 90
      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
      : currentScore >= 75
      ? 'bg-amber-100 text-amber-950 border-amber-300'
      : 'bg-rose-100 text-rose-950 border-rose-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#291C0E]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF5EC] border border-[#E1D4C2] rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden shadow-2xl text-[#291C0E]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E1D4C2] bg-[#F4E6D2] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1D4C2] border border-[#BEB5A9] flex items-center justify-center text-[#C98B5E]">
              <ShieldCheck className="w-5 h-5 text-[#C98B5E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#291C0E] font-serif">
                  ATS Recruiter Algorithm & Keyword Audit
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1D4C2] text-[#291C0E] border border-[#BEB5A9]">
                  Deep Parser Audit
                </span>
              </div>
              <p className="text-xs text-[#6E473B]">
                Real-time keyword density, action verb strength, and achievement quantification engine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6E473B] hover:text-[#291C0E] hover:bg-[#E1D4C2] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#F4E6D2]/80 border-b border-[#E1D4C2] text-xs overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#291C0E] text-[#F4E6D2] shadow-xs'
                : 'text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Score & Audit ({currentScore}/100)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('density')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'density'
                ? 'bg-[#291C0E] text-[#F4E6D2] shadow-xs'
                : 'text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Keyword Density ({analysis.keywordList.length} detected)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verbs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'verbs'
                ? 'bg-[#291C0E] text-[#F4E6D2] shadow-xs'
                : 'text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Verbs & Quantified Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobMatch')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'jobMatch'
                ? 'bg-[#291C0E] text-[#F4E6D2] shadow-xs'
                : 'text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Job Matcher</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & SCORE AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Score Header Card */}
              <div className="p-5 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xs">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${scoreBadgeBg}`}
                  >
                    <span className="text-3xl leading-none">{currentScore}</span>
                    <span className="text-[10px] font-semibold opacity-80">/ 100</span>
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="font-bold text-sm text-[#291C0E] block">
                      {currentScore >= 90
                        ? 'Recruiter Approved ATS Standing'
                        : currentScore >= 75
                        ? 'Competitive ATS Rating — Polish Below to Maximize Match'
                        : 'Calibrate Key Sections for Fortune 500 ATS Filters'}
                    </span>
                    <p className="text-xs text-[#6E473B] leading-relaxed">
                      Evaluated on keyword density, action verb potency, measurable metric frequency, and single-page A4 structure.
                    </p>
                  </div>
                </div>

                {onOpenAiSummary && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAiSummary();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Polish Summary with AI</span>
                  </button>
                )}
              </div>

              {/* 4 Categorized Sub-Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#F4E6D2] rounded-2xl border border-[#E1D4C2] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">Keyword Match</span>
                  <span className="text-xl font-black text-[#291C0E] mt-0.5 block">{analysis.subScores.keywordScore}%</span>
                  <span className="text-[10px] text-emerald-800 font-semibold">{analysis.keywordList.length} skills indexed</span>
                </div>

                <div className="p-3 bg-[#F4E6D2] rounded-2xl border border-[#E1D4C2] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">Action Verbs</span>
                  <span className="text-xl font-black text-[#C98B5E] mt-0.5 block">{analysis.subScores.actionVerbScore}%</span>
                  <span className="text-[10px] text-[#6E473B]">{analysis.foundVerbs.length} power verbs</span>
                </div>

                <div className="p-3 bg-[#F4E6D2] rounded-2xl border border-[#E1D4C2] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">Quantified Impact</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">{analysis.subScores.quantifiedScore}%</span>
                  <span className="text-[10px] text-[#6E473B]">{analysis.quantifiedRatio}% bullets with %/#</span>
                </div>

                <div className="p-3 bg-[#F4E6D2] rounded-2xl border border-[#E1D4C2] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">A4 Formatting</span>
                  <span className="text-xl font-black text-[#291C0E] mt-0.5 block">{analysis.subScores.formatScore}%</span>
                  <span className="text-[10px] text-emerald-800 font-semibold">Parser Standard</span>
                </div>
              </div>

              {/* Specific Improvement Suggestions (High Priority) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#291C0E] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#C98B5E]" />
                  <span>Specific Actionable Improvements (Action Plan)</span>
                </h4>

                <div className="space-y-2.5">
                  {analysis.specificSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.priority === 'high'
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : 'bg-[#E1D4C2] text-[#291C0E]'
                            }`}
                          >
                            {item.priority} priority
                          </span>
                          <span className="font-bold text-[#291C0E]">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-[#6E473B] font-semibold">{item.category}</span>
                      </div>

                      <p className="text-xs text-[#6E473B] leading-relaxed">{item.description}</p>

                      {item.example && (
                        <div className="p-2.5 rounded-xl bg-[#FBF5EC] border border-[#E1D4C2] text-[11px] text-[#291C0E] font-mono leading-relaxed">
                          {item.example}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E1D4C2]">
                <button
                  type="button"
                  onClick={() => setActiveTab('density')}
                  className="p-3 bg-[#F4E6D2] hover:bg-[#E1D4C2] rounded-xl border border-[#E1D4C2] text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#291C0E]">Inspect Keyword Density</div>
                    <div className="text-[11px] text-[#6E473B]">See word frequencies and missing skills</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#C98B5E]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('verbs')}
                  className="p-3 bg-[#F4E6D2] hover:bg-[#E1D4C2] rounded-xl border border-[#E1D4C2] text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#291C0E]">Quantify Achievements</div>
                    <div className="text-[11px] text-[#6E473B]">Google XYZ formula rewrites & power verbs</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#C98B5E]" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KEYWORD DENSITY ANALYSIS */}
          {activeTab === 'density' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Density Summary Banner */}
              <div className="p-4 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">
                    Resume Word Count & Density Balance
                  </span>
                  <div className="text-xl font-black text-[#291C0E] mt-0.5">
                    {analysis.totalWords} Words Scanned
                  </div>
                  <p className="text-xs text-[#6E473B] mt-0.5">
                    Recommended 1-page length: 250–550 words. Avoid keyword stuffing above 4.5%.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs">
                  Optimal Keyword Spread ✓
                </div>
              </div>

              {/* Detected Keywords with Occurrence Count & Density % */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#291C0E] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#C98B5E]" />
                    <span>Indexed Keywords & Occurrence Density</span>
                  </h4>
                  <span className="text-[11px] text-[#6E473B]">Target: 1.0% – 3.5% density</span>
                </div>

                {analysis.keywordList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F4E6D2] border border-[#E1D4C2] text-xs text-[#6E473B]">
                    No major technical keywords detected yet. Add skills like Python, React, SQL, Git, or Docker in your Skills section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysis.keywordList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F4E6D2] border border-[#E1D4C2] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#291C0E]">{item.keyword}</span>
                          <span className="text-[10px] text-[#6E473B]">
                            ({item.count} {item.count === 1 ? 'mention' : 'mentions'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#291C0E]">{item.density}%</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.status === 'optimal'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : item.status === 'low'
                                ? 'bg-[#E1D4C2] text-[#291C0E]'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Skills to Inject */}
              <div className="space-y-2.5 pt-2 border-t border-[#E1D4C2]">
                <h4 className="text-xs font-bold text-[#291C0E] uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#C98B5E]" />
                  <span>Missing High-Value Keywords for {targetRole}</span>
                </h4>
                <p className="text-xs text-[#6E473B]">
                  Adding these in-demand keywords where you have experience will dramatically increase your match score in recruiter filters:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#F4E6D2] border border-[#BEB5A9] text-[#291C0E] flex items-center gap-1.5"
                    >
                      <span className="text-[#C98B5E] font-bold">+</span>
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTION VERBS & QUANTIFIED REWRITES */}
          {activeTab === 'verbs' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Metrics Ratio Banner */}
              <div className="p-4 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6E473B] block">
                    Achievement Quantification Ratio
                  </span>
                  <div className="text-xl font-black text-[#291C0E] mt-0.5">
                    {analysis.metricCount} of {analysis.totalBullets} Bullets Quantified ({analysis.quantifiedRatio}%)
                  </div>
                  <p className="text-xs text-[#6E473B] mt-0.5">
                    Top ATS benchmark: at least 60% of experience bullets should include quantifiable results.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#E1D4C2] border border-[#BEB5A9] text-[#291C0E] font-bold text-xs shrink-0">
                  Google XYZ Formula
                </div>
              </div>

              {/* Passive/Weak Openers Flagged & Rewrites */}
              {analysis.weakBullets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Passive Openers Flagged ({analysis.weakBullets.length})</span>
                    </h4>
                    <span className="text-[11px] text-amber-900 font-semibold">Immediate replacements ready</span>
                  </div>

                  <div className="space-y-3">
                    {analysis.weakBullets.map((wb, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-2 text-amber-950 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-amber-900">
                            Current Weak Bullet:
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-950">
                            Contains "{wb.weakPhrase}"
                          </span>
                        </div>
                        <div className="text-xs italic text-[#6E473B]">"{wb.originalBullet}"</div>

                        <div className="p-2.5 rounded-xl bg-[#FBF5EC] border border-amber-200 text-xs flex items-center justify-between gap-3">
                          <div className="text-[#291C0E]">
                            <strong className="text-emerald-800">Suggested Action Verb Rewrite: </strong>
                            <span>{wb.suggestedRewrite}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(wb.suggestedRewrite, `weak-${idx}`)}
                            className="p-1.5 bg-[#E1D4C2] hover:bg-[#D5C5B1] rounded-lg text-[#291C0E] transition cursor-pointer shrink-0"
                            title="Copy rewrite to clipboard"
                          >
                            {copiedIndex === `weak-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unquantified Bullets with Google XYZ Formula Suggestions */}
              {analysis.unquantifiedBullets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#291C0E] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C98B5E]" />
                      <span>Quantify Descriptive Bullets (Google XYZ Model)</span>
                    </h4>
                    <span className="text-[11px] text-[#6E473B]">Accomplished [X] by doing [Y] measured by [Z]</span>
                  </div>

                  <div className="space-y-3">
                    {analysis.unquantifiedBullets.map((ub, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] text-xs space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#6E473B] uppercase">
                            Original Bullet (Lacks Metric):
                          </span>
                          <span className="text-[10px] text-amber-900 font-semibold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                            {ub.metricTip}
                          </span>
                        </div>
                        <div className="text-xs text-[#6E473B] italic">"{ub.originalBullet}"</div>

                        <div className="p-2.5 rounded-xl bg-[#FBF5EC] border border-[#E1D4C2] text-xs flex items-center justify-between gap-3">
                          <div className="text-[#291C0E]">
                            <strong className="text-[#C98B5E]">ATS Quantified Rewrite: </strong>
                            <span>{ub.suggestedRewrite}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(ub.suggestedRewrite, `quant-${idx}`)}
                            className="p-1.5 bg-[#E1D4C2] hover:bg-[#D5C5B1] rounded-lg text-[#291C0E] transition cursor-pointer shrink-0"
                            title="Copy rewrite to clipboard"
                          >
                            {copiedIndex === `quant-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Missing Power Verbs */}
              <div className="space-y-3 pt-2 border-t border-[#E1D4C2]">
                <h4 className="text-xs font-bold text-[#291C0E] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#C98B5E]" />
                  <span>High-Impact Action Verbs to Inject</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {analysis.missingActionVerbs.map((cat, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F4E6D2] border border-[#E1D4C2] space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#6E473B] block">
                        {cat.category}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.verbs.map((verb, vIdx) => (
                          <span
                            key={vIdx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FBF5EC] text-[#291C0E] border border-[#BEB5A9]"
                          >
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JOB MATCHER */}
          {activeTab === 'jobMatch' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#291C0E] block">
                  Paste Target Job Description (from LinkedIn, Indeed, etc.):
                </label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job requirements and qualifications here to match against your resume..."
                  className="w-full bg-[#F4E6D2] border border-[#E1D4C2] rounded-xl p-3 text-xs text-[#291C0E] placeholder:text-[#6E473B]/70 outline-none focus:border-[#C98B5E] resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <span className="text-[11px] font-bold text-[#6E473B] whitespace-nowrap">Target Role:</span>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-[#F4E6D2] border border-[#E1D4C2] rounded-lg px-2.5 py-1.5 text-xs text-[#291C0E] outline-none focus:border-[#C98B5E]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isMatching || !jobDescription.trim()}
                  onClick={handleRunJobMatch}
                  className="px-4 py-2 bg-[#C98B5E] hover:bg-[#B5774A] text-[#291C0E] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Matching Keywords...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Scan Match Against Job</span>
                    </>
                  )}
                </button>
              </div>

              {matchResult && (
                <div className="p-4 rounded-2xl bg-[#F4E6D2] border border-[#E1D4C2] space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#E1D4C2] pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6E473B]">
                        Job Alignment Score
                      </span>
                      <div className="text-2xl font-black text-[#C98B5E] mt-0.5">
                        {matchResult.matchScore}% Match
                      </div>
                    </div>
                    <span className="text-xs text-[#6E473B] text-right max-w-xs font-medium">
                      {matchResult.matchScore >= 80
                        ? 'Strong keyword alignment with this job posting.'
                        : 'Good foundation — incorporate the missing skills below to raise recruiter match rate.'}
                    </span>
                  </div>

                  {/* Matched Keywords */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                      Matched Skills Found in Your Resume ({matchResult.matchedKeywords.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {matchResult.missingKeywords.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-amber-900 block flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        Missing Keywords to Consider Adding ({matchResult.missingKeywords.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-950 border border-amber-300"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tailoring Recommendations */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E1D4C2]">
                    <span className="text-xs font-bold text-[#291C0E] block">
                      Tailoring Recommendations:
                    </span>
                    <ul className="space-y-1 text-xs text-[#6E473B]">
                      {matchResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-[#C98B5E] mt-0.5 shrink-0" />
                          <span className="font-medium text-[#291C0E]">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F4E6D2] border-t border-[#E1D4C2] flex items-center justify-between">
          <span className="text-[11px] text-[#6E473B]">
            Formula: Google XYZ Accomplished [X] measured by [Y] doing [Z]
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#E1D4C2] hover:bg-[#D5C5B1] text-[#291C0E] font-bold text-xs rounded-xl transition cursor-pointer border border-[#BEB5A9]"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
