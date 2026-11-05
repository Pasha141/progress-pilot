/**
 * @file src/pages/AtsCheckerPage.tsx
 * Comprehensive ATS Score Checker & Resume Auditor for "Resume Builder by Junaid".
 * Adheres strictly to the site's warm cream, cocoa, and terracotta visual identity:
 * - Hero: Dark chocolate-brown gradient with serif headline and italic terracotta accent
 * - Upload: Drag & drop PDF/DOCX (max 5 MB) + optional job description
 * - Animated Progress: Reading file → Checking format → Matching keywords → Generating suggestions
 * - Results: Circular score gauge (0-100), 6 progress breakdown categories, found/missing keywords,
 *   critical/warning/tip issues list, and actionable ATS suggestions with copyable examples.
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  Target,
  Zap,
  CheckSquare,
  Layout,
  Mail,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { authFetch } from '../utils/authSession';

interface BreakdownCategory {
  category: string;
  score: number;
  maxScore: number;
  icon: string;
}

interface AtsIssue {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'tip';
  message: string;
  fixRecommendation: string;
}

interface AiSuggestionItem {
  section: string;
  issue: string;
  fix: string;
  example_rewrite: {
    before: string;
    after: string;
  };
}

interface AtsAnalysisResult {
  score: number;
  scoreLabel: 'Poor' | 'Needs Work' | 'Good' | 'Excellent';
  scoreColor: 'red' | 'orange' | 'green';
  breakdown: BreakdownCategory[];
  foundKeywords: string[];
  missingKeywords: string[];
  issues: AtsIssue[];
  aiSuggestions: {
    score_improvement_estimate: number;
    suggestions: AiSuggestionItem[];
    rewritten_summary: string;
    missing_keywords: string[];
  };
  wordCount: number;
  charCount: number;
}

interface AtsCheckerPageProps {
  onNavigateToBuilder: () => void;
}

export const AtsCheckerPage: React.FC<AtsCheckerPageProps> = ({ onNavigateToBuilder }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Analysis Lifecycle States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<AtsAnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showHighScorerAi, setShowHighScorerAi] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const LOADING_STEPS = [
    'Reading file & extracting text layers...',
    'Checking layout format, single-column & typography...',
    'Matching technical keywords & analyzing density...',
    'Auditing action verbs, quantified metrics & preparing ATS suggestions...',
  ];

  // File Handling
  const handleFileSelect = (selectedFile: File) => {
    setValidationError('');

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setValidationError('Unsupported file type. Please upload a .pdf, .docx, or .txt file only.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setValidationError('File size exceeds 5 MB. Please choose a smaller resume file.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1] || dataUrl;
      setFileBase64(base64);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileBase64('');
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run ATS Analysis
  const handleAnalyzeResume = async () => {
    if (!file || !fileBase64) {
      setValidationError('Please select or drop a resume file to analyze.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setValidationError('');
      setLoadingStep(0);

      const t1 = setTimeout(() => setLoadingStep(1), 1100);
      const t2 = setTimeout(() => setLoadingStep(2), 2300);
      const t3 = setTimeout(() => setLoadingStep(3), 3600);

      const payload = {
        fileBase64,
        mimeType: file.type || (file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf'),
        fileName: file.name,
        jobDescription: jobDescription.trim(),
      };

      const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const res = await authFetch(`${apiBase}/api/ats/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.status === 401) {
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze resume.');
      }

      const response = await res.json();
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      } else {
        throw new Error(response.error || 'Failed to analyze resume format.');
      }
    } catch (err: any) {
      console.error('[AtsChecker] Analysis error:', err);
      setValidationError(
        err.message || 'Error scanning resume. Please check the document format or try another file.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleReset = () => {
    setFile(null);
    setFileBase64('');
    setJobDescription('');
    setAnalysisResult(null);
    setValidationError('');
    setShowHighScorerAi(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Icon selector helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layout':
        return <Layout className="w-4 h-4 text-[#C98B5E]" />;
      case 'CheckSquare':
        return <CheckSquare className="w-4 h-4 text-[#C98B5E]" />;
      case 'Target':
        return <Target className="w-4 h-4 text-[#C98B5E]" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-[#C98B5E]" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-[#C98B5E]" />;
      case 'Mail':
        return <Mail className="w-4 h-4 text-[#C98B5E]" />;
      default:
        return <FileCheck className="w-4 h-4 text-[#C98B5E]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5EC] text-[#291C0E] flex flex-col font-sans transition-colors">
      {/* 1. Hero Section with Dark Chocolate Gradient */}
      <section className="bg-gradient-to-br from-[#1a120b] via-[#291C0E] to-[#120a05] text-[#FBF5EC] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#3d2716] relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C98B5E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C98B5E]/20 border border-[#C98B5E]/40 text-[#F4E6D2] text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#C98B5E]" />
            <span>Free ATS Resume Scanner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C98B5E] animate-pulse" />
          </div>

          {/* Heading with bold serif & italic terracotta accent */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight text-white">
            Check your resume&apos;s <span className="text-[#C98B5E] italic">ATS score</span> in seconds
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-[#BEB5A9] max-w-2xl mx-auto leading-relaxed font-normal">
            Upload your resume in PDF or Word (.docx) format to get an instant ATS compatibility report, keyword analysis, and actionable recommendations.
          </p>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {!analysisResult && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E1D4C2] space-y-8 animate-in fade-in duration-300">
            {/* Upload Area */}
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#C98B5E] bg-[#F4E6D2]/60 scale-[1.01]'
                    : file
                    ? 'border-[#4D8B6A] bg-[#F1F5F9]/40 cursor-default'
                    : 'border-[#BEB5A9] hover:border-[#C98B5E] bg-[#FBF5EC]/60 hover:bg-[#F4E6D2]/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F4E6D2] text-[#C98B5E] flex items-center justify-center shadow-inner">
                      <Upload className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-[#291C0E]">
                        Drag & drop your resume here, or{' '}
                        <span className="text-[#C98B5E] underline underline-offset-4 font-extrabold hover:text-[#B5774A]">
                          Browse file
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm text-[#6E473B] mt-1 font-medium">
                        Supports PDF, Word (.docx), and Plain Text (.txt) &bull; Maximum file size: 5 MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E1D4C2] shadow-sm">
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-12 h-12 rounded-xl bg-[#4D8B6A]/10 text-[#4D8B6A] flex items-center justify-center shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-bold text-[#291C0E] break-all">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#6E473B] font-medium">
                          {(file.size / 1024).toFixed(1)} KB &bull; Ready for ATS analysis
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#B5483A] hover:bg-[#B5483A]/10 rounded-full transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-[#B5483A]/10 border border-[#B5483A]/30 text-[#B5483A] text-xs sm:text-sm flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Optional Job Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-[#291C0E] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#C98B5E]" />
                  <span>Paste job description (optional) for a better keyword match</span>
                </label>
                <span className="text-[11px] text-[#A78D78] font-medium">Optional</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements here to calculate precision keyword match % and uncover missing competencies..."
                rows={4}
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:bg-white focus:outline-none transition resize-none placeholder:text-[#A78D78]"
              />
            </div>

            {/* CTA Button & Privacy Note */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E1D4C2]">
              <div className="flex items-center gap-2 text-xs text-[#6E473B] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#4D8B6A]" />
                <span>Your resume is not stored. Analysis happens in real time and is 100% private.</span>
              </div>

              <button
                type="button"
                disabled={!file || isAnalyzing}
                onClick={handleAnalyzeResume}
                className={`w-full sm:w-auto px-8 py-4 text-sm sm:text-base font-bold rounded-full shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer font-sans ${
                  !file || isAnalyzing
                    ? 'bg-[#E1D4C2] text-[#A78D78] cursor-not-allowed shadow-none'
                    : 'bg-[#C0825A] hover:bg-[#B5774A] active:scale-95 text-white shadow-[#C0825A]/30'
                }`}
              >
                <span>Analyze My Resume</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Loading State with Step by Step Animation */}
        {isAnalyzing && (
          <div className="bg-[#FFFFFF] rounded-3xl p-8 sm:p-12 shadow-xl border border-[#E1D4C2] text-center space-y-8 animate-in fade-in duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#F4E6D2] text-[#C98B5E] flex items-center justify-center relative">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C98B5E] animate-ping" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#291C0E]">
                Auditing Your Resume for ATS Compatibility...
              </h3>
              <p className="text-xs sm:text-sm text-[#6E473B] font-medium max-w-md mx-auto">
                Comparing against 2026 recruiter tracking systems (Workday, Greenhouse, Lever, Taleo).
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="max-w-xl mx-auto space-y-3 text-left">
              {LOADING_STEPS.map((stepText, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                    idx < loadingStep
                      ? 'bg-[#4D8B6A]/10 border-[#4D8B6A]/30 text-[#4D8B6A]'
                      : idx === loadingStep
                      ? 'bg-[#F4E6D2] border-[#C98B5E] text-[#291C0E] font-bold shadow-xs'
                      : 'bg-[#FBF5EC]/50 border-transparent text-[#A78D78]'
                  }`}
                >
                  <div className="shrink-0">
                    {idx < loadingStep ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4D8B6A]" />
                    ) : idx === loadingStep ? (
                      <span className="w-4 h-4 rounded-full border-2 border-[#C98B5E] border-t-transparent animate-spin block" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#E1D4C2] flex items-center justify-center text-[10px] text-[#6E473B]">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Results Screen */}
        {analysisResult && !isAnalyzing && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Score Banner & Circular Gauge */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E1D4C2] flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left Column: Big Circular Score Gauge */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#E1D4C2"
                      strokeWidth="9"
                    />
                    {/* Progress stroke */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke={
                        analysisResult.scoreColor === 'green'
                          ? '#4D8B6A'
                          : analysisResult.scoreColor === 'orange'
                          ? '#D9A441'
                          : '#B5483A'
                      }
                      strokeWidth="9"
                      strokeDasharray={`${(analysisResult.score / 100) * 264} 264`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-black font-serif text-[#291C0E] tracking-tight">
                      {analysisResult.score}
                    </span>
                    <span className="text-[11px] font-bold text-[#6E473B] uppercase tracking-wider -mt-1">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
                    style={{
                      backgroundColor:
                        analysisResult.scoreColor === 'green'
                          ? '#4D8B6A20'
                          : analysisResult.scoreColor === 'orange'
                          ? '#D9A44120'
                          : '#B5483A20',
                      color:
                        analysisResult.scoreColor === 'green'
                          ? '#4D8B6A'
                          : analysisResult.scoreColor === 'orange'
                          ? '#D9A441'
                          : '#B5483A',
                      border: `1px solid ${
                        analysisResult.scoreColor === 'green'
                          ? '#4D8B6A50'
                          : analysisResult.scoreColor === 'orange'
                          ? '#D9A44150'
                          : '#B5483A50'
                      }`,
                    }}
                  >
                    <span>Rating: {analysisResult.scoreLabel}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#291C0E]">
                    {analysisResult.score >= 85
                      ? 'Exceptional ATS Compliance!'
                      : analysisResult.score >= 75
                      ? 'Good ATS Compatibility'
                      : analysisResult.score >= 50
                      ? 'Needs Critical Improvements'
                      : 'High Rejection Risk by ATS'}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#6E473B] font-medium max-w-md">
                    {analysisResult.score >= 75
                      ? 'Your resume possesses clear section headers, readable font hierarchy, and recognized action keywords. A few targeted enhancements can push it to 95+.'
                      : 'Automated recruitment scanners may struggle to extract your technical competencies, contact coordinates, or quantified business impact.'}
                  </p>
                </div>
              </div>

              {/* Right Column: CTAs */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={onNavigateToBuilder}
                  className="px-6 py-3.5 text-xs sm:text-sm font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] active:scale-95 rounded-full shadow-lg shadow-[#C98B5E]/30 transition flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Sparkles className="w-4 h-4 text-[#291C0E]" />
                  <span>Fix It with Resume Builder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 text-xs sm:text-sm font-semibold text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-full transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-upload & Check Again</span>
                </button>
              </div>
            </div>

            {/* Score Breakdown Cards (6 Categories) */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#291C0E] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#C98B5E]" />
                <span>Score Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResult.breakdown.map((item, idx) => {
                  const pct = Math.round((item.score / item.maxScore) * 100);
                  const isHigh = pct >= 75;
                  const isMid = pct >= 50 && pct < 75;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-[#E1D4C2] shadow-sm hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#F4E6D2] flex items-center justify-center">
                            {getCategoryIcon(item.icon)}
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-[#291C0E] line-clamp-1">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-[#291C0E]">
                          {item.score}/{item.maxScore}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#FBF5EC] rounded-full h-2.5 overflow-hidden border border-[#E1D4C2]/60">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isHigh ? '#4D8B6A' : isMid ? '#D9A441' : '#B5483A',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#6E473B] font-medium">
                        <span>{pct}% Optimal</span>
                        <span>
                          {isHigh ? '✓ Passed' : isMid ? '⚠ Needs Review' : '✕ Action Needed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Found vs Missing Keywords */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E1D4C2] shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-[#E1D4C2] pb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#C98B5E]" />
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#291C0E]">
                    Keyword Analysis & Match Engine
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#6E473B]">
                  {analysisResult.foundKeywords.length} Found &bull; {analysisResult.missingKeywords.length} Missing
                </span>
              </div>

              {/* Found Keywords (Green Chips) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4D8B6A] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Found in Your Resume ({analysisResult.foundKeywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.foundKeywords.length > 0 ? (
                    analysisResult.foundKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#4D8B6A]/10 text-[#4D8B6A] border border-[#4D8B6A]/30 flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{kw}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6E473B] italic">No common keywords detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Keywords (Red Chips) */}
              <div className="space-y-2 pt-2 border-t border-[#E1D4C2]/60">
                <span className="text-xs font-bold text-[#B5483A] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Missing High-Impact Keywords ({analysisResult.missingKeywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.missingKeywords.length > 0 ? (
                    analysisResult.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#B5483A]/10 text-[#B5483A] border border-[#B5483A]/30 flex items-center gap-1 shadow-2xs"
                      >
                        <span>+ {kw}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#4D8B6A] font-semibold">
                      Excellent! All core role keywords matched.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Issues List with Severity Icons */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E1D4C2] shadow-md space-y-4">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#291C0E] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D9A441]" />
                <span>Detected Issues & Optimization Opportunities</span>
              </h3>

              <div className="space-y-3">
                {analysisResult.issues.map((issue) => {
                  const isCrit = issue.severity === 'critical';
                  const isWarn = issue.severity === 'warning';

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start gap-3.5 transition ${
                        isCrit
                          ? 'bg-[#B5483A]/5 border-[#B5483A]/30'
                          : isWarn
                          ? 'bg-[#D9A441]/5 border-[#D9A441]/30'
                          : 'bg-[#C98B5E]/5 border-[#C98B5E]/20'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCrit ? (
                          <div className="w-7 h-7 rounded-lg bg-[#B5483A]/20 text-[#B5483A] flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : isWarn ? (
                          <div className="w-7 h-7 rounded-lg bg-[#D9A441]/20 text-[#D9A441] flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[#C98B5E]/20 text-[#C98B5E] flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCrit
                                ? 'bg-[#B5483A] text-white'
                                : isWarn
                                ? 'bg-[#D9A441] text-[#291C0E]'
                                : 'bg-[#C98B5E] text-[#291C0E]'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-bold text-[#291C0E]">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#291C0E]">
                          {issue.message}
                        </p>
                        <p className="text-xs text-[#6E473B] leading-relaxed">
                          <strong>Fix:</strong> {issue.fixRecommendation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ATS Suggestions to Boost Your Score (shown when score < 75 or toggleable for >= 75) */}
            {(analysisResult.score < 75 || showHighScorerAi) && (
              <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 border border-[#C98B5E]/40 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1D4C2] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#C98B5E] text-[#291C0E] flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif font-black text-[#291C0E]">
                        ATS Suggestions to Boost Your Score
                      </h3>
                      <p className="text-xs text-[#6E473B] font-medium">
                        Personalized action plan generated by Gemini ATS engine
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4D8B6A]/10 border border-[#4D8B6A]/30 text-[#4D8B6A] text-xs font-bold">
                    <span>
                      Potential Score after fixes:{' '}
                      <strong className="text-sm">
                        {Math.min(98, analysisResult.score + (analysisResult.aiSuggestions?.score_improvement_estimate || 15))}
                        /100
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Rewritten Summary Preview */}
                {analysisResult.aiSuggestions?.rewritten_summary && (
                  <div className="p-5 rounded-2xl bg-[#FBF5EC] border border-[#E1D4C2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C98B5E] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Suggested 1-Page Summary Rewrite</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySummary(analysisResult.aiSuggestions.rewritten_summary)}
                        className="px-2.5 py-1 text-xs font-bold text-[#6E473B] hover:text-[#291C0E] bg-white border border-[#E1D4C2] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#4D8B6A]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-[#291C0E] leading-relaxed italic">
                      &quot;{analysisResult.aiSuggestions.rewritten_summary}&quot;
                    </p>
                  </div>
                )}

                {/* Suggestion Cards */}
                <div className="space-y-4">
                  {analysisResult.aiSuggestions?.suggestions?.map((sug, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FBF5EC]/60 rounded-2xl p-5 border border-[#E1D4C2] space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1D4C2] text-[#291C0E]">
                          {sug.section}
                        </span>
                        <span className="text-xs text-[#C98B5E] font-bold">Fix #{idx + 1}</span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-[#291C0E]">
                          <span className="text-[#B5483A]">Flaw:</span> {sug.issue}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-[#6E473B]">
                          <span className="text-[#4D8B6A] font-bold">Fix:</span> {sug.fix}
                        </p>
                      </div>

                      {/* Before -> After Box */}
                      {sug.example_rewrite && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-[#B5483A]/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B5483A]">
                              Before
                            </span>
                            <p className="text-[#6E473B] italic line-through decoration-[#B5483A]/40">
                              {sug.example_rewrite.before}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-[#4D8B6A]/10 border border-[#4D8B6A]/30 space-y-1 relative group">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D8B6A]">
                                Recommended After (ATS 98%)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyRewrite(sug.example_rewrite.after, idx)}
                                className="px-2 py-0.5 rounded bg-white text-[11px] font-bold text-[#291C0E] border border-[#4D8B6A]/40 shadow-2xs hover:bg-[#F4E6D2] transition flex items-center gap-1 cursor-pointer"
                                title="Copy rewrite to clipboard"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#4D8B6A]" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-[#C98B5E]" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[#291C0E] font-medium leading-relaxed">
                              {sug.example_rewrite.after}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action CTAs */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E1D4C2]">
                  <p className="text-xs text-[#6E473B] font-medium text-center sm:text-left">
                    Apply these rewrites automatically using our 100 ATS-friendly templates.
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onNavigateToBuilder}
                      className="flex-1 sm:flex-none px-6 py-3 text-xs sm:text-sm font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] rounded-full shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <span>Fix It with Resume Builder</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* High Scorer Toggle Button if score >= 75 */}
            {analysisResult.score >= 75 && !showHighScorerAi && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowHighScorerAi(true)}
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-[#6E473B] hover:text-[#291C0E] bg-white border border-[#E1D4C2] hover:border-[#C98B5E] rounded-full shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#C98B5E]" />
                  <span>View ATS Suggestions to Improve Your Score</span>
                  <ChevronDown className="w-4 h-4 text-[#A78D78]" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
