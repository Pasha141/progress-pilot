/**
 * @file src/pages/CoverLetterPage.tsx
 * Dedicated Cover Letter Builder & Live A4 Preview.
 * Warm Brown & Cream Editorial Theme: #291C0E, #6E473B, #E1D4C2, #F4E6D2, #C98B5E.
 * Features:
 * - 6 Curated Cover Letter Templates: Medical Modern (Girlie Reyes MD), Executive Serif,
 *   Tech Minimal, Editorial Monogram, Compact Corporate, and Creative Sidebar.
 * - AI Cover Letter Generator powered by Gemini 3.8 Flash & intelligent ATS fallback.
 * - Direct PDF File Download using jsPDF & html2canvas (saves actual .pdf file).
 * - Live unclipped A4 preview on warm sand (#E1D4C2) desk with pure white (#FFFFFF) sheet.
 * - Custom accent colors (Classic Cocoa, Warm Copper, Cobalt, Emerald, Burgundy, Slate).
 */

import React, { useState, useEffect, useRef } from 'react';
import { CoverLetterData, CoverLetterTemplateId, ResumeData } from '../types/resume';
import { exportElementToPdf } from '../utils/printHelper';
import { generateCoverLetterAI, CoverLetterAIOptions } from '../utils/geminiAi';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Palette,
  ArrowLeft,
  Copy,
  LayoutGrid,
  Loader2,
  Wand2,
  X,
  Check,
  Import,
} from 'lucide-react';

import { getUserDraftKeys } from '../utils/authSession';

const SAMPLE_COVER_LETTER: CoverLetterData = {
  senderName: 'Girlie Reyes, MD',
  senderTitle: 'Attending Physician & Clinical Specialist',
  senderEmail: 'hello@reallygreatsite.com',
  senderPhone: '0123-456-7890',
  senderAddress: '123 Anywhere St., Any City',
  senderWebsite: 'www.reallygreatsite.com',
  date: 'July 27, 2030',
  recipientName: 'Lucky Macapagal',
  recipientTitle: 'Recruitment Consultant',
  companyName: 'Metropolitan Healthcare Partners',
  companyAddress: '123 Anywhere St., Any City, ST 1234',
  salutation: 'Dear Mr. Macapagal:',
  openingParagraph:
    "A cover letter is a three- or four-paragraph document to an employer explaining your interest in a specific job. It's a one-page letter that is usually attached to your resume. This letter should also highlight your fitness for the advertised role.",
  bodyParagraph:
    "Writing a cover letter as a mid-career professional is a bit different. But first, start with how you found out about the career opening and why you're interested in the job position. Be specific: use the correct names and titles.\n\nAs you write this letter, use clear and readable words. You want to come across as professional and approachable, but not overly formal.\n\nNext, provide examples of why you're the right person for the job.",
  bulletPoints: [
    "Don't hesitate to use bullet points and include numbers that showcase your achievements.",
    "Rather than simply describe what you've done in previous jobs, show the recruiter or hiring manager what you can bring to the role.",
    "Express your passion and excitement to be part of the company and the team.",
  ],
  closingParagraph:
    'Finally, provide your contact information and how you prefer to be reached. Offer to meet with the reader at their earliest convenience. Thank them for their time and attention, and let them know that you look forward to hearing from them soon.\n\nBefore you send your cover letter, read your draft out loud to quickly spot errors and wordy sentences. You can also ask a friend to review your cover letter. Good luck on your job search.',
  signoff: 'With best regards,',
  accentColor: '#6E473B',
  fontFamily: 'sans',
  templateId: 'medical_modern',
};

const EMPTY_COVER_LETTER: CoverLetterData = {
  senderName: '',
  senderTitle: '',
  senderEmail: '',
  senderPhone: '',
  senderAddress: '',
  senderWebsite: '',
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  recipientName: '',
  recipientTitle: '',
  companyName: '',
  companyAddress: '',
  salutation: 'Dear Hiring Manager:',
  openingParagraph: '',
  bodyParagraph: '',
  bulletPoints: [],
  closingParagraph: '',
  signoff: 'With best regards,',
  accentColor: '#6E473B',
  fontFamily: 'sans',
  templateId: 'medical_modern',
};

const COVER_TEMPLATES: { id: CoverLetterTemplateId; name: string; tag: string }[] = [
  { id: 'medical_modern', name: 'Girlie Reyes MD Format', tag: 'Reference Format' },
  { id: 'executive_serif', name: 'Executive Harvard Serif', tag: 'Editorial Classic' },
  { id: 'tech_minimal', name: 'Tech & Engineering Minimal', tag: 'Modern Clean' },
  { id: 'editorial_monogram', name: 'Warm Cocoa Monogram', tag: 'Aesthetic Seal' },
  { id: 'compact_corporate', name: 'Compact Corporate Pro', tag: 'High Density' },
  { id: 'creative_sidebar', name: 'Creative Accent Band', tag: 'Designer' },
];

interface CoverLetterPageProps {
  onBackToResume: () => void;
  resumeData?: ResumeData;
  userId?: string;
}

export const CoverLetterPage: React.FC<CoverLetterPageProps> = ({
  onBackToResume,
  resumeData,
  userId,
}) => {
  const storageKey = userId ? getUserDraftKeys(userId).coverLetter : null;

  const [data, setData] = useState<CoverLetterData>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return EMPTY_COVER_LETTER;
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [zoom, setZoom] = useState<number>(0.85);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [confirmLoadSample, setConfirmLoadSample] = useState<boolean>(false);

  // AI Prompt Form State
  const [aiForm, setAiForm] = useState<CoverLetterAIOptions>({
    senderName: data.senderName || '',
    senderTitle: data.senderTitle || '',
    targetRole: 'Data Analyst',
    targetCompany: 'Acme Corporation',
    recipientName: 'Hiring Manager',
    experienceLevel: 'Mid-Level (3-5 years)',
    keySkills: 'Python, SQL, Tableau, data visualization and cross-functional reporting',
    tone: 'Professional & Confident',
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Auto-save to per-user storage only
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }, [data, storageKey]);

  // Compute container zoom
  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 48;
        const sheetWidthPx = 794;
        if (containerWidth > 0) {
          const autoZoom = Math.min(Math.max(containerWidth / sheetWidthPx, 0.45), 1.15);
          setZoom(autoZoom);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Direct PDF Export using jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    const candidateName = data.senderName?.trim() || 'Candidate';
    const filename = `${candidateName.replace(/\s+/g, '_')}_Cover_Letter.pdf`;

    try {
      showToast('Generating high-resolution PDF...');
      await exportElementToPdf('printable-cover-letter', filename);
      showToast('PDF downloaded successfully ✓');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF export failed. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyText = () => {
    const fullText = `
${data.senderName}
${data.senderTitle}
${data.senderAddress} | ${data.senderPhone} | ${data.senderEmail}

${data.date}

${data.recipientName}
${data.recipientTitle}
${data.companyName}
${data.companyAddress}

${data.salutation}

${data.openingParagraph}

${data.bodyParagraph}

${data.bulletPoints.map((b) => `• ${b}`).join('\n')}

${data.closingParagraph}

${data.signoff}
${data.senderName}
    `.trim();

    navigator.clipboard.writeText(fullText);
    showToast('Cover letter text copied to clipboard ✓');
  };

  const handleAddBullet = () => {
    setData((prev) => ({
      ...prev,
      bulletPoints: [...prev.bulletPoints, 'Highlight a notable achievement or relevant technical skill'],
    }));
  };

  const handleRemoveBullet = (index: number) => {
    setData((prev) => ({
      ...prev,
      bulletPoints: prev.bulletPoints.filter((_, i) => i !== index),
    }));
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleBulletChange = (index: number, val: string) => {
    setData((prev) => {
      const copy = [...prev.bulletPoints];
      copy[index] = val;
      return { ...prev, bulletPoints: copy };
    });
  };

  const handleImportFromResume = () => {
    if (!resumeData || !resumeData.personalInfo.fullName.trim()) {
      showToast('No active resume data found to import');
      return;
    }
    const p = resumeData.personalInfo;
    const skillsList = resumeData.skills
      .flatMap((c) => c.skills)
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean)
      .slice(0, 5)
      .join(', ');

    setData((prev) => ({
      ...prev,
      senderName: p.fullName || prev.senderName,
      senderTitle: p.jobTitle || prev.senderTitle,
      senderEmail: p.email || prev.senderEmail,
      senderPhone: p.phone || prev.senderPhone,
      senderAddress: p.location || prev.senderAddress,
      senderWebsite: p.website || prev.senderWebsite,
    }));

    setAiForm((prev) => ({
      ...prev,
      senderName: p.fullName || prev.senderName,
      senderTitle: p.jobTitle || prev.senderTitle,
      keySkills: skillsList || prev.keySkills,
    }));

    showToast('Imported profile & contact details from your resume ✓');
  };

  // Trigger AI Cover Letter Generation
  const handleRunAiGeneration = async () => {
    setIsGeneratingAi(true);
    try {
      const result = await generateCoverLetterAI({
        ...aiForm,
        senderName: data.senderName || aiForm.senderName || 'Candidate',
        senderTitle: data.senderTitle || aiForm.senderTitle || '',
      });

      setData((prev) => ({
        ...prev,
        salutation: result.salutation,
        openingParagraph: result.openingParagraph,
        bodyParagraph: result.bodyParagraph,
        bulletPoints: result.bulletPoints,
        closingParagraph: result.closingParagraph,
        signoff: result.signoff,
        companyName: aiForm.targetCompany || prev.companyName,
        recipientName: aiForm.recipientName || prev.recipientName,
        senderTitle: aiForm.targetRole || prev.senderTitle,
      }));

      setIsAiModalOpen(false);
      showToast('AI Cover Letter generated successfully! ✓');
    } catch (err) {
      console.error('AI generation error:', err);
      showToast('Could not generate cover letter. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const accentColors = [
    { label: 'Classic Cocoa', hex: '#6E473B' },
    { label: 'Warm Copper', hex: '#C98B5E' },
    { label: 'Cobalt Navy', hex: '#1d4ed8' },
    { label: 'Forest Emerald', hex: '#047857' },
    { label: 'Crimson Burgundy', hex: '#991b1b' },
    { label: 'Deep Slate', hex: '#0f172a' },
  ];

  const currentAccent = data.accentColor || '#6E473B';
  const activeTemplateId = data.templateId || 'medical_modern';

  return (
    <div className="flex-1 flex flex-col bg-[#FBF5EC] text-[#291C0E] min-h-0">
      {/* Cover Letter Top Sub-header */}
      <div className="bg-[#FBF5EC]/90 backdrop-blur-md border-b border-[#E1D4C2] px-4 py-2.5 no-print shadow-xs sticky top-16 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToResume}
              className="flex items-center gap-1.5 text-xs text-[#6E473B] hover:text-[#291C0E] font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Resume Builder</span>
            </button>
            <span className="text-[#BEB5A9]">•</span>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#E1D4C2] text-[#6E473B]">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <h1 className="text-xs font-bold text-[#291C0E] font-serif">
                Cover Letter Builder
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Generate Button */}
            <button
              type="button"
              onClick={() => {
                setAiForm((prev) => ({
                  ...prev,
                  senderName: data.senderName || '',
                  senderTitle: data.senderTitle || '',
                }));
                setIsAiModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 font-sans"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#291C0E]" />
              <span>AI Generate Letter</span>
            </button>

            {resumeData && resumeData.personalInfo.fullName && (
              <button
                type="button"
                onClick={handleImportFromResume}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#291C0E] bg-[#F4E6D2] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Autofill name, title, contact info & skills from your resume"
              >
                <Import className="w-3.5 h-3.5 text-[#C98B5E]" />
                <span className="hidden sm:inline">From My Resume</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!confirmLoadSample) {
                  setConfirmLoadSample(true);
                  setTimeout(() => setConfirmLoadSample(false), 3500);
                  return;
                }
                setConfirmLoadSample(false);
                setData(SAMPLE_COVER_LETTER);
                showToast('Loaded sample cover letter ✓');
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold border rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                confirmLoadSample
                  ? 'bg-[#291C0E] text-[#FBF5EC] border-[#291C0E]'
                  : 'text-[#291C0E] bg-[#F4E6D2] hover:bg-[#E1D4C2] border-[#E1D4C2]'
              }`}
            >
              <span>{confirmLoadSample ? 'Confirm Load Sample?' : 'Load Sample'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 3500);
                  return;
                }
                setConfirmClear(false);
                setData(EMPTY_COVER_LETTER);
                showToast('Cover letter cleared');
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                confirmClear
                  ? 'bg-rose-600 text-white'
                  : 'text-[#6E473B] hover:text-[#B5483A] hover:bg-[#F4E6D2]'
              }`}
            >
              {confirmClear ? 'Confirm Clear?' : 'Clear'}
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#291C0E] bg-[#F4E6D2] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] active:scale-95 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 font-sans disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="bg-[#291C0E] text-[#F4E6D2] px-4 py-2 text-xs flex items-center justify-center gap-2 sticky top-28 z-30 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-[#C98B5E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden p-3 bg-[#F4E6D2] border-b border-[#E1D4C2] flex gap-2 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-[#C98B5E] text-[#291C0E] font-bold shadow-xs'
              : 'bg-[#FBF5EC] text-[#6E473B] hover:text-[#291C0E]'
          }`}
        >
          Edit Letter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#C98B5E] text-[#291C0E] font-bold shadow-xs'
              : 'bg-[#FBF5EC] text-[#6E473B] hover:text-[#291C0E]'
          }`}
        >
          Live A4 Preview
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* Left Side: Letter Form */}
        <div
          className={`lg:col-span-5 flex flex-col bg-[#FBF5EC] border border-[#E1D4C2] rounded-3xl shadow-xs overflow-hidden h-[calc(100vh-10rem)] no-print ${
            activeTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Card Header: Templates & Accents Selector */}
          <div className="p-4 border-b border-[#E1D4C2] bg-[#F4E6D2]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#291C0E] font-serif">Letter Configuration</h2>
                <p className="text-[11px] text-[#6E473B]">Select template layout & accent styling</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#C98B5E]" />
                <span className="text-[11px] text-[#6E473B] font-medium">Accent:</span>
              </div>
            </div>

            {/* Template Selector Carousel */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#6E473B]">
                Choose Cover Letter Template ({COVER_TEMPLATES.length} Styles):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {COVER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setData({ ...data, templateId: tmpl.id })}
                    className={`p-2 rounded-xl text-left border text-[11px] transition cursor-pointer flex flex-col justify-between ${
                      activeTemplateId === tmpl.id
                        ? 'bg-[#291C0E] text-[#F4E6D2] border-[#291C0E] shadow-xs'
                        : 'bg-[#FBF5EC] text-[#291C0E] border-[#E1D4C2] hover:border-[#A78D78]'
                    }`}
                  >
                    <span className="font-bold truncate leading-tight">{tmpl.name}</span>
                    <span
                      className={`text-[9px] mt-1 ${
                        activeTemplateId === tmpl.id ? 'text-[#C98B5E]' : 'text-[#6E473B]'
                      }`}
                    >
                      {tmpl.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {accentColors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, accentColor: c.hex }))}
                  className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                    currentAccent === c.hex
                      ? 'border-[#291C0E] scale-110 shadow-sm'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}

              <div className="ml-auto flex items-center gap-1 text-[11px] text-[#6E473B]">
                <span>Font:</span>
                <select
                  value={data.fontFamily || 'sans'}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, fontFamily: e.target.value as 'sans' | 'serif' | 'mono' }))
                  }
                  className="bg-[#FBF5EC] border border-[#E1D4C2] rounded-lg px-2 py-0.5 text-[#291C0E] text-[11px] outline-none"
                >
                  <option value="sans">Modern Sans (Inter)</option>
                  <option value="serif">Editorial Serif (Fraunces)</option>
                  <option value="mono">Tech Monospace</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Fields Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Section 1: Sender Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                1. Your Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={data.senderName}
                    onChange={(e) => setData({ ...data, senderName: e.target.value })}
                    placeholder="e.g. Girlie Reyes, MD"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={data.senderTitle}
                    onChange={(e) => setData({ ...data, senderTitle: e.target.value })}
                    placeholder="e.g. Attending Physician"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={data.senderEmail}
                    onChange={(e) => setData({ ...data, senderEmail: e.target.value })}
                    placeholder="e.g. hello@reallygreatsite.com"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={data.senderPhone}
                    onChange={(e) => setData({ ...data, senderPhone: e.target.value })}
                    placeholder="e.g. 0123-456-7890"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={data.senderAddress}
                    onChange={(e) => setData({ ...data, senderAddress: e.target.value })}
                    placeholder="e.g. 123 Anywhere St., Any City"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Website / Portfolio</label>
                  <input
                    type="text"
                    value={data.senderWebsite || ''}
                    onChange={(e) => setData({ ...data, senderWebsite: e.target.value })}
                    placeholder="e.g. www.reallygreatsite.com"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] rounded-xl px-3 py-1.5 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Recipient Information & Date */}
            <div className="space-y-3 pt-2 border-t border-[#E1D4C2]">
              <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                2. Recipient & Date
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Date</label>
                  <input
                    type="text"
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                    placeholder="e.g. July 27, 2030"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Salutation</label>
                  <input
                    type="text"
                    value={data.salutation}
                    onChange={(e) => setData({ ...data, salutation: e.target.value })}
                    placeholder="e.g. Dear Mr. Macapagal:"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={data.recipientName}
                    onChange={(e) => setData({ ...data, recipientName: e.target.value })}
                    placeholder="e.g. Lucky Macapagal"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Recipient Title</label>
                  <input
                    type="text"
                    value={data.recipientTitle}
                    onChange={(e) => setData({ ...data, recipientTitle: e.target.value })}
                    placeholder="e.g. Recruitment Consultant"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                    placeholder="e.g. Metropolitan Healthcare Partners"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Company Address</label>
                  <input
                    type="text"
                    value={data.companyAddress}
                    onChange={(e) => setData({ ...data, companyAddress: e.target.value })}
                    placeholder="e.g. 123 Anywhere St., Any City, ST 1234"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Opening Paragraph */}
            <div className="space-y-2 pt-2 border-t border-[#E1D4C2]">
              <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                3. Opening Hook
              </h3>
              <textarea
                rows={3}
                value={data.openingParagraph}
                onChange={(e) => setData({ ...data, openingParagraph: e.target.value })}
                placeholder="State the position you are applying for and how your background aligns with their vision..."
                className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl p-3 text-xs outline-none transition resize-y leading-relaxed"
              />
            </div>

            {/* Section 4: Body Paragraph */}
            <div className="space-y-2 pt-2 border-t border-[#E1D4C2]">
              <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                4. Core Value & Experience
              </h3>
              <textarea
                rows={4}
                value={data.bodyParagraph}
                onChange={(e) => setData({ ...data, bodyParagraph: e.target.value })}
                placeholder="Share your specific achievements, methodology, and why you are uniquely qualified..."
                className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl p-3 text-xs outline-none transition resize-y leading-relaxed"
              />
            </div>

            {/* Section 5: Bullet Points */}
            <div className="space-y-2 pt-2 border-t border-[#E1D4C2]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                  5. Key Highlights (Optional Bullets)
                </h3>
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="text-xs font-semibold text-[#C98B5E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              </div>

              <div className="space-y-2">
                {data.bulletPoints.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#C98B5E] font-bold">•</span>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleBulletChange(idx, e.target.value)}
                      className="flex-1 bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      className="text-[#BEB5A9] hover:text-[#B5483A] p-1 cursor-pointer"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Closing & Signoff */}
            <div className="space-y-2 pt-2 border-t border-[#E1D4C2]">
              <h3 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider">
                6. Closing & Next Steps
              </h3>
              <textarea
                rows={3}
                value={data.closingParagraph}
                onChange={(e) => setData({ ...data, closingParagraph: e.target.value })}
                placeholder="Call to action: request an interview, thank the reader, provide best contact times..."
                className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl p-3 text-xs outline-none transition resize-y leading-relaxed"
              />

              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Signoff</label>
                <input
                  type="text"
                  value={data.signoff}
                  onChange={(e) => setData({ ...data, signoff: e.target.value })}
                  placeholder="e.g. With best regards,"
                  className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] text-[#291C0E] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live A4 Preview Desk (#E1D4C2 Desk with White Paper) */}
        <div
          ref={previewContainerRef}
          className={`lg:col-span-7 flex flex-col bg-[#E1D4C2] rounded-3xl border border-[#BEB5A9] shadow-sm overflow-hidden h-[calc(100vh-10rem)] ${
            activeTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Zoom & Action Controls Bar */}
          <div className="p-3 bg-[#F4E6D2] border-b border-[#E1D4C2] flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#291C0E] font-serif">A4 Letter Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E1D4C2] text-[#291C0E] font-bold">
                {COVER_TEMPLATES.find((t) => t.id === activeTemplateId)?.name || 'Medical Modern'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.05, 0.45))}
                className="p-1.5 rounded-lg bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-[#6E473B] w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.05, 1.25))}
                className="p-1.5 rounded-lg bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#FBF5EC] hover:bg-[#E1D4C2] text-[#291C0E] border border-[#E1D4C2] transition cursor-pointer"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Scaled Preview Desk */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center bg-[#E1D4C2]">
            <div
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
                margin: '0 auto',
                flexShrink: 0,
              }}
            >
              {/* Actual Printable A4 Sheet: Guaranteed White background with dark text */}
              <div
                id="printable-cover-letter"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontFamily:
                    data.fontFamily === 'serif'
                      ? 'Georgia, serif'
                      : data.fontFamily === 'mono'
                      ? 'ui-monospace, monospace'
                      : 'system-ui, -apple-system, sans-serif',
                }}
                className="p-12 sm:p-14 shadow-2xl relative flex flex-col justify-between text-slate-800 leading-relaxed select-text"
              >
                {/* TEMPLATE VARIANT 1: Girlie Reyes MD Reference Format */}
                {activeTemplateId === 'medical_modern' && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: currentAccent }} />
                      <div className="h-1 w-28 rounded-full" style={{ backgroundColor: currentAccent }} />
                    </div>

                    <div className="flex items-start justify-between gap-6 pb-6">
                      <div>
                        <h1
                          className="text-4xl font-black tracking-tight leading-none"
                          style={{ color: currentAccent }}
                        >
                          {data.senderName || 'Your Name'}
                        </h1>
                        {data.senderTitle && (
                          <p className="text-sm font-semibold text-slate-600 mt-1.5">
                            {data.senderTitle}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-xs text-slate-600 space-y-1 shrink-0">
                        {data.senderAddress && <div>{data.senderAddress}</div>}
                        {data.senderPhone && <div>{data.senderPhone}</div>}
                        {data.senderEmail && <div>{data.senderEmail}</div>}
                        {data.senderWebsite && (
                          <div className="text-slate-500 font-mono text-[11px]">{data.senderWebsite}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE VARIANT 2: Executive Harvard Serif */}
                {activeTemplateId === 'executive_serif' && (
                  <div>
                    <div className="text-center pb-6 border-b border-slate-300">
                      <h1
                        className="text-3xl font-serif font-black tracking-wide uppercase"
                        style={{ color: currentAccent }}
                      >
                        {data.senderName || 'YOUR NAME'}
                      </h1>
                      {data.senderTitle && (
                        <p className="text-xs uppercase tracking-widest text-slate-600 mt-1 font-semibold">
                          {data.senderTitle}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-600 mt-2 flex-wrap">
                        {data.senderAddress && <span>{data.senderAddress}</span>}
                        {data.senderPhone && <span>• {data.senderPhone}</span>}
                        {data.senderEmail && <span>• {data.senderEmail}</span>}
                        {data.senderWebsite && <span>• {data.senderWebsite}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE VARIANT 3: Tech & Engineering Minimal */}
                {activeTemplateId === 'tech_minimal' && (
                  <div>
                    <div className="border-l-4 pl-4 pb-4 border-slate-800" style={{ borderColor: currentAccent }}>
                      <div className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500">
                        // Application Letter
                      </div>
                      <h1 className="text-3xl font-bold font-mono text-slate-900 mt-0.5">
                        {data.senderName || 'developer_name'}
                      </h1>
                      <div className="text-xs font-semibold text-slate-600 mt-1 font-mono">
                        {data.senderTitle || 'Full Stack Engineer'}
                      </div>
                      <div className="flex gap-4 text-xs font-mono text-slate-500 mt-2">
                        {data.senderEmail && <span>{data.senderEmail}</span>}
                        {data.senderPhone && <span>{data.senderPhone}</span>}
                        {data.senderWebsite && <span>{data.senderWebsite}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE VARIANT 4: Warm Cocoa Monogram Seal */}
                {activeTemplateId === 'editorial_monogram' && (
                  <div>
                    <div className="flex items-center gap-4 pb-6 border-b-2 border-slate-200" style={{ borderColor: currentAccent }}>
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-serif font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: currentAccent }}
                      >
                        {(data.senderName || 'JN')
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h1 className="text-3xl font-serif font-bold text-slate-900">
                          {data.senderName || 'Your Name'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-600 tracking-wide mt-0.5">
                          {data.senderTitle || 'Senior Professional'}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-600 space-y-0.5">
                        {data.senderAddress && <div>{data.senderAddress}</div>}
                        {data.senderPhone && <div>{data.senderPhone}</div>}
                        {data.senderEmail && <div>{data.senderEmail}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE VARIANT 5: Compact Corporate Pro */}
                {activeTemplateId === 'compact_corporate' && (
                  <div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
                      <div>
                        <h1 className="text-2xl font-black text-slate-900" style={{ color: currentAccent }}>
                          {data.senderName || 'Your Name'}
                        </h1>
                        <p className="text-xs font-bold text-slate-600">{data.senderTitle}</p>
                      </div>
                      <div className="text-right text-xs text-slate-600 space-y-0.5">
                        <div>{data.senderEmail}</div>
                        <div>{data.senderPhone}</div>
                        <div>{data.senderAddress}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE VARIANT 6: Creative Accent Band */}
                {activeTemplateId === 'creative_sidebar' && (
                  <div>
                    <div className="p-4 rounded-lg text-white mb-6 flex justify-between items-center" style={{ backgroundColor: currentAccent }}>
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                          {data.senderName || 'Your Name'}
                        </h1>
                        <p className="text-xs text-white/90">{data.senderTitle}</p>
                      </div>
                      <div className="text-right text-xs text-white/90 space-y-0.5">
                        <div>{data.senderEmail}</div>
                        <div>{data.senderPhone}</div>
                        <div>{data.senderAddress}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Letter Body: Common structured layout across all templates */}
                <div className="mt-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Date */}
                    <div className="text-xs font-semibold text-slate-700">{data.date}</div>

                    {/* Recipient Block */}
                    {(data.recipientName || data.recipientTitle || data.companyName) && (
                      <div className="mt-4 text-xs space-y-0.5 text-slate-800">
                        {data.recipientName && <div className="font-bold">{data.recipientName}</div>}
                        {data.recipientTitle && <div>{data.recipientTitle}</div>}
                        {data.companyName && <div className="font-semibold">{data.companyName}</div>}
                        {data.companyAddress && <div className="text-slate-600">{data.companyAddress}</div>}
                      </div>
                    )}

                    {/* Salutation */}
                    <div className="mt-6 text-xs font-bold text-slate-900">{data.salutation}</div>

                    {/* Letter Body Paragraphs */}
                    <div className="mt-4 text-xs space-y-3.5 text-slate-800 leading-relaxed text-justify">
                      {data.openingParagraph && <p>{data.openingParagraph}</p>}

                      {data.bodyParagraph && (
                        <div className="space-y-3">
                          {data.bodyParagraph.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      )}

                      {/* Bullet Points */}
                      {data.bulletPoints.length > 0 && (
                        <ul className="space-y-1.5 pl-4 list-disc marker:text-slate-700">
                          {data.bulletPoints.map((b, i) => (
                            <li key={i} className="pl-1 text-slate-800">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {data.closingParagraph && (
                        <div className="space-y-3">
                          {data.closingParagraph.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signoff */}
                  <div className="mt-8 pt-4">
                    <div className="text-xs text-slate-700">{data.signoff}</div>
                    <div className="mt-6 font-bold text-sm text-slate-900">
                      {data.senderName || 'Your Name'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Cover Letter Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#291C0E]/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#FBF5EC] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E1D4C2] relative space-y-4 text-[#291C0E]">
            <div className="flex items-center justify-between border-b border-[#E1D4C2] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#E1D4C2] text-[#6E473B]">
                  <Sparkles className="w-4 h-4 text-[#C98B5E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#291C0E] font-serif">AI Cover Letter Writer</h3>
                  <p className="text-[11px] text-[#6E473B]">Tailor a custom letter in seconds with Gemini AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-[#6E473B] hover:text-[#291C0E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Target Job Title</label>
                <input
                  type="text"
                  value={aiForm.targetRole}
                  onChange={(e) => setAiForm({ ...aiForm, targetRole: e.target.value })}
                  placeholder="e.g. Senior Data Analyst or Full Stack Engineer"
                  className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Target Company Name</label>
                <input
                  type="text"
                  value={aiForm.targetCompany}
                  onChange={(e) => setAiForm({ ...aiForm, targetCompany: e.target.value })}
                  placeholder="e.g. Google, Amazon, Deloitte, or Stripe"
                  className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={aiForm.recipientName}
                    onChange={(e) => setAiForm({ ...aiForm, recipientName: e.target.value })}
                    placeholder="e.g. Hiring Manager"
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Experience Level</label>
                  <select
                    value={aiForm.experienceLevel}
                    onChange={(e) => setAiForm({ ...aiForm, experienceLevel: e.target.value })}
                    className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="Fresher / Entry-Level">Fresher / Graduate</option>
                    <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                    <option value="Senior / Lead (6+ years)">Senior / Lead (6+ years)</option>
                    <option value="Executive / Director">Executive / Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">
                  Key Skills & Highlights to Feature
                </label>
                <textarea
                  rows={2}
                  value={aiForm.keySkills}
                  onChange={(e) => setAiForm({ ...aiForm, keySkills: e.target.value })}
                  placeholder="e.g. Python, SQL, Tableau, data pipeline optimization, customer churn models"
                  className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl p-2.5 text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E473B] mb-1">Letter Tone</label>
                <select
                  value={aiForm.tone}
                  onChange={(e) => setAiForm({ ...aiForm, tone: e.target.value })}
                  className="w-full bg-[#FBF5EC] border border-[#E1D4C2] focus:border-[#C98B5E] rounded-xl px-3 py-2 text-xs outline-none"
                >
                  <option value="Professional & Confident">Professional & Confident</option>
                  <option value="Passionate & High Energy">Passionate & High Energy</option>
                  <option value="Executive & Strategic">Executive & Strategic</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-[#E1D4C2]">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6E473B] hover:bg-[#E1D4C2] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleRunAiGeneration}
                className="px-5 py-2 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5 font-sans disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate & Insert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
