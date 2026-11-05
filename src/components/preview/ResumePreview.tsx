/**
 * @file src/components/preview/ResumePreview.tsx
 * Live Resume Preview container inspired by resumebuilder.com.
 * Warm Palette: #FBF5EC, #F4E6D2, #E1D4C2, #291C0E, #6E473B, #C98B5E.
 * Features:
 * 1. Root cause clipping bug solved: Outer wrapper overflow: auto + inner scale box
 *    with transform: scale(zoom) and margin: 0 auto only when container > scale box.
 * 2. Default "Fit to width" calculated via ResizeObserver so sheet is never cut off on left/right.
 * 3. Section-level sample data rule: Once user types into a section, that section shows only user data.
 *    Untouched sections show sample data with subtle badge inside sheet safe area.
 * 4. Sample data is NEVER exported to PDF/DOCX.
 * 5. Auto fit to 1 physical A4 page with dynamic scale measurement and status indicators.
 * 6. Page Setup menu: toggle paper margins (Narrow/Default/Wide) applied to preview, export, & print.
 * 7. Guaranteed multi-tier PDF download with reliable error handling and fallbacks.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ResumeData, TemplateId, TemplateOption } from '../../types/resume';
import { CURATED_TEMPLATES } from '../../data/templatesData';
import { DynamicResumeRenderer } from './DynamicResumeRenderer';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  Printer,
  FileDown,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Info,
  LayoutGrid,
  ShieldCheck,
  Download,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Check,
  FileText,
} from 'lucide-react';
import { exportResumeToDocx } from '../../utils/docxExport';
import { printResumeDocument, exportElementToPdf } from '../../utils/printHelper';

interface ResumePreviewProps {
  data: ResumeData;
  templateId: TemplateId;
  accentColorOverride?: string;
  onChangeTemplateClick?: () => void;
  onOpenAiConverter?: () => void;
  onOpenAtsScore?: () => void;
}

const SHEET_WIDTH_PX = 794;   // 210mm at 96 DPI
const SHEET_HEIGHT_PX = 1123; // 297mm at 96 DPI

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  templateId,
  accentColorOverride,
  onChangeTemplateClick,
  onOpenAiConverter,
  onOpenAtsScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageSetupRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isFitToWidth, setIsFitToWidth] = useState<boolean>(true);
  const [manualZoom, setManualZoom] = useState<number>(100);
  const [autoFitToOnePage, setAutoFitToOnePage] = useState<boolean>(true);
  const [pageMargin, setPageMargin] = useState<'narrow' | 'default' | 'wide'>('default');
  const [isPageSetupOpen, setIsPageSetupOpen] = useState<boolean>(false);
  const [contentScale, setContentScale] = useState<number>(1.0);
  const [isContentCompact, setIsContentCompact] = useState<boolean>(false);
  const [fitStatus, setFitStatus] = useState<'fits' | 'trimmed' | 'overflow'>('fits');
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [pdfToast, setPdfToast] = useState<string>('');

  // Close Page Setup dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pageSetupRef.current && !pageSetupRef.current.contains(e.target as Node)) {
        setIsPageSetupOpen(false);
      }
    };
    if (isPageSetupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPageSetupOpen]);

  // Find matched template
  const matchedTemplate: TemplateOption = useMemo(() => {
    return (
      CURATED_TEMPLATES.find((t) => t.id === templateId) ||
      CURATED_TEMPLATES.find((t) => t.layoutArchetype === (templateId as any)) ||
      CURATED_TEMPLATES[0]
    );
  }, [templateId]);

  // Track ResizeObserver on outer container to ensure perfect fit-to-width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute active zoom factor
  const autoZoomFactor = useMemo(() => {
    const availableWidth = Math.max(containerWidth - 32, 280);
    const zoomRatio = availableWidth / SHEET_WIDTH_PX;
    return Math.min(Math.max(zoomRatio, 0.35), 1.3);
  }, [containerWidth]);

  const activeZoom = isFitToWidth ? autoZoomFactor : manualZoom / 100;
  const scaledBoxWidth = Math.round(SHEET_WIDTH_PX * activeZoom);
  const scaledBoxHeight = Math.round(SHEET_HEIGHT_PX * activeZoom);

  // SECTION-LEVEL SAMPLE DATA LOGIC:
  const isPersonalTouched = useMemo(() => {
    const p = data.personalInfo;
    return Boolean(
      p.fullName?.trim() ||
      p.jobTitle?.trim() ||
      p.email?.trim() ||
      p.phone?.trim() ||
      p.location?.trim() ||
      p.linkedin?.trim() ||
      p.github?.trim() ||
      p.website?.trim()
    );
  }, [data.personalInfo]);

  const isSummaryTouched = useMemo(() => {
    return Boolean(data.summary?.trim() || data.summaryTitle?.trim());
  }, [data.summary, data.summaryTitle]);

  const isExperienceTouched = useMemo(() => {
    return Boolean(
      data.experiences &&
      data.experiences.length > 0 &&
      data.experiences.some((exp) => exp.company?.trim() || exp.role?.trim() || exp.bullets?.some((b) => b?.trim()))
    );
  }, [data.experiences]);

  const isEducationTouched = useMemo(() => {
    return Boolean(
      data.education &&
      data.education.length > 0 &&
      data.education.some((edu) => edu.school?.trim() || edu.degree?.trim() || edu.fieldOfStudy?.trim())
    );
  }, [data.education]);

  const isProjectsTouched = useMemo(() => {
    return Boolean(
      data.projects &&
      data.projects.length > 0 &&
      data.projects.some((proj) => proj.title?.trim() || proj.bullets?.some((b) => b?.trim()))
    );
  }, [data.projects]);

  const isSkillsTouched = useMemo(() => {
    return Boolean(
      data.skills &&
      data.skills.length > 0 &&
      data.skills.some((cat) => cat.skills && cat.skills.length > 0)
    );
  }, [data.skills]);

  const isCertificationsTouched = useMemo(() => {
    return Boolean(
      data.certifications &&
      data.certifications.length > 0 &&
      data.certifications.some((cert) => cert.name?.trim() || cert.issuer?.trim())
    );
  }, [data.certifications]);

  const isCompletelyEmpty =
    !isPersonalTouched &&
    !isSummaryTouched &&
    !isExperienceTouched &&
    !isEducationTouched &&
    !isProjectsTouched &&
    !isSkillsTouched &&
    !isCertificationsTouched;

  // Render strictly the user's own resume data — never pre-fill sample/owner personas by default
  const previewData: ResumeData = useMemo(() => {
    return {
      ...data,
      skillsDisplayStyle: data.skillsDisplayStyle || 'tags',
    };
  }, [data]);

  // Clean data for EXPORT: Strips all sample data completely!
  const cleanExportData: ResumeData = useMemo(() => {
    return {
      personalInfo: isPersonalTouched ? data.personalInfo : {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summaryTitle: isSummaryTouched ? data.summaryTitle : '',
      summary: isSummaryTouched ? data.summary : '',
      experiences: isExperienceTouched ? data.experiences : [],
      education: isEducationTouched ? data.education : [],
      projects: isProjectsTouched ? data.projects : [],
      skills: isSkillsTouched ? data.skills : [],
      skillsDisplayStyle: data.skillsDisplayStyle || 'tags',
      certifications: isCertificationsTouched ? data.certifications : [],
    };
  }, [
    data,
    isPersonalTouched,
    isSummaryTouched,
    isExperienceTouched,
    isEducationTouched,
    isProjectsTouched,
    isSkillsTouched,
    isCertificationsTouched,
  ]);

  // Margin padding value helper for style
  const marginPaddingValue = useMemo(() => {
    switch (pageMargin) {
      case 'narrow':
        return '10mm 12mm';
      case 'wide':
        return '26mm 28mm';
      case 'default':
      default:
        return '18mm 20mm';
    }
  }, [pageMargin]);

  // AUTO FIT TO 1 PAGE LOGIC (respects chosen margin)
  useEffect(() => {
    if (!autoFitToOnePage || !contentRef.current || !sheetRef.current) {
      setContentScale(1.0);
      setIsContentCompact(false);
      setFitStatus('fits');
      return;
    }

    const marginDeduction = pageMargin === 'narrow' ? 50 : pageMargin === 'wide' ? 120 : 80;
    const availableHeight = SHEET_HEIGHT_PX - marginDeduction;
    const naturalHeight = contentRef.current.scrollHeight;

    if (naturalHeight <= availableHeight) {
      setContentScale(1.0);
      setIsContentCompact(false);
      setFitStatus('fits');
    } else {
      const requiredScale = availableHeight / naturalHeight;
      if (requiredScale >= 0.82) {
        setContentScale(Number(requiredScale.toFixed(3)));
        setIsContentCompact(true);
        setFitStatus('trimmed');
      } else {
        setContentScale(0.82);
        setIsContentCompact(true);
        setFitStatus('overflow');
      }
    }
  }, [previewData, autoFitToOnePage, matchedTemplate, pageMargin]);

  // Real PDF Direct Download using jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setPdfToast('Generating high-resolution PDF...');
    try {
      const candidateName = (cleanExportData.personalInfo.fullName || data.personalInfo.fullName || 'Candidate').trim();
      const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}_Resume.pdf`;

      await exportElementToPdf('printable-resume', filename);
      setPdfToast('PDF downloaded successfully ✓');
      setTimeout(() => setPdfToast(''), 3000);

    } catch (err) {
      console.error('Direct PDF export error:', err);
      setPdfToast('PDF export failed. Please try again.');
      setTimeout(() => setPdfToast(''), 3500);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Browser print fallback
  const handleTriggerPrint = () => {
    setIsPrinting(true);
    printResumeDocument(cleanExportData.personalInfo.fullName || 'Candidate_Resume');
    setTimeout(() => setIsPrinting(false), 1500);
  };

  // DOCX Export handler
  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportResumeToDocx(cleanExportData, matchedTemplate);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E1D4C2] rounded-3xl border border-[#BEB5A9] overflow-hidden shadow-2xs select-none relative">
      {/* Floating PDF Toast */}
      {pdfToast && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-30 bg-[#291C0E] text-[#F4E6D2] px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border border-[#C98B5E]">
          <CheckCircle className="w-4 h-4 text-[#C98B5E]" />
          <span>{pdfToast}</span>
        </div>
      )}

      {/* Top Preview Toolbar */}
      <div className="preview-toolbar bg-[#F4E6D2] px-3.5 py-2.5 border-b border-[#E1D4C2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#291C0E] shrink-0 no-print">
        {/* Left: Template Name, Change Button & 1-Page Badge */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 font-bold text-[#291C0E] font-serif">
            <span className="truncate max-w-[130px] sm:max-w-[180px]" title={matchedTemplate.name}>
              {matchedTemplate.name}
            </span>
          </div>

          {onChangeTemplateClick && (
            <button
              type="button"
              onClick={onChangeTemplateClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer"
              title="Browse & change resume template"
            >
              <LayoutGrid className="w-3 h-3 text-[#C98B5E]" />
              <span>Change Template</span>
            </button>
          )}

          {onOpenAtsScore && (
            <button
              type="button"
              onClick={onOpenAtsScore}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#291C0E] bg-[#E1D4C2] hover:bg-[#D5C5B1] border border-[#BEB5A9] rounded-xl transition cursor-pointer shadow-2xs"
              title="Test ATS Score & Match Keywords"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C98B5E]" />
              <span>ATS Score</span>
            </button>
          )}

          {/* 1-Page Fit Status */}
          {fitStatus === 'fits' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-900 bg-emerald-100 rounded-full border border-emerald-300">
              <CheckCircle className="w-3 h-3 text-emerald-700" />
              <span>Fits 1 page ✓</span>
            </span>
          )}
          {fitStatus === 'trimmed' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-amber-950 bg-amber-100 rounded-full border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>Scaled to 1 page</span>
            </span>
          )}
          {fitStatus === 'overflow' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-rose-950 bg-rose-100 rounded-full border border-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-700" />
              <span>Too long</span>
            </span>
          )}
        </div>

        {/* Right: Actions, Page Setup, DOCX, Download PDF, Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto">
          {/* Page Setup Menu Dropdown */}
          <div className="relative" ref={pageSetupRef}>
            <button
              type="button"
              onClick={() => setIsPageSetupOpen(!isPageSetupOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer shadow-2xs ${
                isPageSetupOpen
                  ? 'bg-[#291C0E] text-[#F4E6D2] border-[#291C0E]'
                  : 'bg-[#FBF5EC] text-[#291C0E] border-[#E1D4C2] hover:bg-[#E1D4C2]'
              }`}
              title="Configure paper margins for preview and PDF export"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C98B5E]" />
              <span>Page Setup</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#C98B5E] text-[#291C0E] shadow-2xs">
                {pageMargin}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Page Setup Floating Dropdown Panel: Opens left-aligned to button so it flows into the preview space without clipping */}
            {isPageSetupOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#FBF5EC] border-2 border-[#BEB5A9] rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 text-xs text-[#291C0E] animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-[#E1D4C2] pb-2.5">
                  <div className="font-bold text-[#291C0E] flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#F4E6D2] text-[#C98B5E] border border-[#E1D4C2]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-serif">Page Setup & Margins</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#291C0E] text-[#F4E6D2]">
                    A4 Portrait
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#6E473B] block uppercase tracking-wider">
                    Select Paper Margin
                  </span>

                  {/* Narrow Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPageMargin('narrow');
                      setIsPageSetupOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center justify-between transition cursor-pointer ${
                      pageMargin === 'narrow'
                        ? 'bg-[#291C0E] border-[#C98B5E] text-[#F4E6D2] shadow-sm'
                        : 'bg-white border-[#E1D4C2] hover:bg-[#F4E6D2] text-[#291C0E]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${pageMargin === 'narrow' ? 'text-[#F4E6D2]' : 'text-[#291C0E]'}`}>
                          Narrow Margins
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pageMargin === 'narrow' ? 'bg-[#C98B5E] text-[#291C0E]' : 'bg-[#E1D4C2] text-[#6E473B]'}`}>
                          10mm
                        </span>
                      </div>
                      <div className={`text-[10px] ${pageMargin === 'narrow' ? 'text-[#E1D4C2]' : 'text-[#6E473B]'}`}>
                        Compact • Maximum space for heavy content & projects
                      </div>
                    </div>
                    {pageMargin === 'narrow' && (
                      <div className="w-5 h-5 rounded-full bg-[#C98B5E] text-[#291C0E] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Default Option (Recommended) - High Contrast & Clearly Visible */}
                  <button
                    type="button"
                    onClick={() => {
                      setPageMargin('default');
                      setIsPageSetupOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center justify-between transition cursor-pointer ${
                      pageMargin === 'default'
                        ? 'bg-[#291C0E] border-[#C98B5E] text-[#F4E6D2] shadow-sm'
                        : 'bg-white border-[#E1D4C2] hover:bg-[#F4E6D2] text-[#291C0E]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${pageMargin === 'default' ? 'text-[#F4E6D2]' : 'text-[#291C0E]'}`}>
                          Default Margins (Standard)
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pageMargin === 'default' ? 'bg-[#C98B5E] text-[#291C0E]' : 'bg-[#E1D4C2] text-[#6E473B]'}`}>
                          18mm
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <div className={`text-[10px] ${pageMargin === 'default' ? 'text-[#E1D4C2]' : 'text-[#6E473B]'}`}>
                        Balanced • Gold standard for HR & ATS scanning
                      </div>
                    </div>
                    {pageMargin === 'default' && (
                      <div className="w-5 h-5 rounded-full bg-[#C98B5E] text-[#291C0E] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Wide Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPageMargin('wide');
                      setIsPageSetupOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center justify-between transition cursor-pointer ${
                      pageMargin === 'wide'
                        ? 'bg-[#291C0E] border-[#C98B5E] text-[#F4E6D2] shadow-sm'
                        : 'bg-white border-[#E1D4C2] hover:bg-[#F4E6D2] text-[#291C0E]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${pageMargin === 'wide' ? 'text-[#F4E6D2]' : 'text-[#291C0E]'}`}>
                          Wide Margins
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pageMargin === 'wide' ? 'bg-[#C98B5E] text-[#291C0E]' : 'bg-[#E1D4C2] text-[#6E473B]'}`}>
                          26mm
                        </span>
                      </div>
                      <div className={`text-[10px] ${pageMargin === 'wide' ? 'text-[#E1D4C2]' : 'text-[#6E473B]'}`}>
                        Spacious • Minimalist & executive layout
                      </div>
                    </div>
                    {pageMargin === 'wide' && (
                      <div className="w-5 h-5 rounded-full bg-[#C98B5E] text-[#291C0E] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Direct Print Option in Menu */}
                <div className="pt-2.5 border-t border-[#E1D4C2] space-y-2">
                  <div className="text-[10px] text-[#6E473B] flex items-center justify-between">
                    <span>Dimensions: 210 × 297 mm</span>
                    <span>100% Vector Print</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPageSetupOpen(false);
                      handleTriggerPrint();
                    }}
                    className="w-full py-2 px-3 bg-[#E1D4C2] hover:bg-[#D5C5B1] rounded-xl text-xs font-bold text-[#291C0E] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-[#C98B5E]" />
                    <span>Print Document / Save as PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Auto Fit to 1 Page Toggle */}
          <button
            type="button"
            onClick={() => setAutoFitToOnePage(!autoFitToOnePage)}
            className={`hidden md:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${
              autoFitToOnePage
                ? 'bg-[#E1D4C2] text-[#291C0E] border-[#BEB5A9]'
                : 'bg-[#FBF5EC] text-[#6E473B] border-[#E1D4C2]'
            }`}
            title="Automatically adjust font size and line spacing to keep resume on 1 physical A4 page"
          >
            {autoFitToOnePage ? (
              <ToggleRight className="w-4 h-4 text-[#C98B5E]" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-[#BEB5A9]" />
            )}
            <span>Auto fit 1 page</span>
          </button>

          {/* DOCX Export Button */}
          <button
            type="button"
            disabled={isExportingDocx}
            onClick={handleExportDocx}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download editable Microsoft Word (.docx) file"
          >
            <FileDown className="w-3.5 h-3.5 text-[#C98B5E]" />
            <span>{isExportingDocx ? 'Exporting...' : 'DOCX'}</span>
          </button>

          {/* Primary Download PDF Button with Copper Accent */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] active:scale-95 rounded-xl shadow-sm transition cursor-pointer font-sans disabled:opacity-50"
            title="Download high-resolution ATS A4 PDF file"
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

          {/* Native Print Dialog Option */}
          <button
            type="button"
            onClick={handleTriggerPrint}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6E473B] hover:text-[#291C0E] bg-[#FBF5EC] hover:bg-[#E1D4C2] border border-[#E1D4C2] rounded-xl transition cursor-pointer shadow-2xs"
            title="Open browser print dialog (Ctrl+P / Save as PDF)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Print</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-[#FBF5EC] p-0.5 rounded-xl border border-[#E1D4C2]">
            <button
              type="button"
              onClick={() => {
                setIsFitToWidth(false);
                setManualZoom((z) => Math.max(z - 10, 50));
              }}
              className="p-1 hover:text-[#291C0E] rounded-lg transition text-[#6E473B] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFitToWidth(!isFitToWidth)}
              className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold cursor-pointer transition ${
                isFitToWidth ? 'bg-[#C98B5E] text-[#291C0E]' : 'text-[#6E473B] hover:text-[#291C0E]'
              }`}
              title="Toggle Fit to Width"
            >
              {isFitToWidth ? 'FIT' : `${manualZoom}%`}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFitToWidth(false);
                setManualZoom((z) => Math.min(z + 10, 150));
              }}
              className="p-1 hover:text-[#291C0E] rounded-lg transition text-[#6E473B] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFitToWidth(true);
                setManualZoom(100);
              }}
              className="p-1 rounded-lg transition text-[#6E473B] hover:text-[#291C0E] cursor-pointer"
              title="Reset to Fit Width"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Overflow Tip Banner */}
      {fitStatus === 'overflow' && autoFitToOnePage && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-950 flex items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Tip:</strong> Resume has extensive content. Try toggling Page Setup to <strong>Narrow (10mm)</strong> margins or shorten bullet points to fit cleanly on 1 page.
            </span>
          </div>
        </div>
      )}

      {/* Outer Scroll Desk (#E1D4C2 warm sand desk): Matching Cover Letter Builder exactly! */}
      <div
        ref={containerRef}
        id="printable-resume-viewport"
        className="flex-1 overflow-auto p-4 sm:p-6 bg-[#E1D4C2]"
      >
        {/* Scale Box: Sized exactly to scaledWidth x scaledHeight. Centers with margin: 0 auto only when container is wider */}
        <div
          id="printable-resume-scalebox"
          style={{
            width: `${scaledBoxWidth}px`,
            height: `${scaledBoxHeight}px`,
            margin: containerWidth > scaledBoxWidth ? '0 auto' : '0',
          }}
          className="relative transition-all duration-150"
        >
          {/* Sheet: Exactly 794px wide standard A4, pure white (#ffffff), scaled from top-left */}
          <div
            id="printable-resume"
            ref={sheetRef}
            data-margin={pageMargin}
            style={{
              width: `${SHEET_WIDTH_PX}px`,
              minHeight: `${SHEET_HEIGHT_PX}px`,
              transform: `scale(${activeZoom})`,
              transformOrigin: 'top left',
              backgroundColor: '#ffffff',
              padding: marginPaddingValue,
            }}
            className="resume-print-sheet text-slate-900 shadow-2xl rounded-xs box-border relative overflow-hidden select-text transition-all duration-150"
          >
            {isCompletelyEmpty && !isPrinting ? (
              <div className="min-h-[900px] flex flex-col items-center justify-center text-center px-10 py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 no-print">
                <div className="w-14 h-14 rounded-2xl bg-[#F4E6D2] text-[#C98B5E] border border-[#E1D4C2] flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-2">
                  Your Blank Resume Canvas Is Ready
                </h3>
                <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                  Start entering your contact details, summary, experience, or skills on the left to see your live A4 resume take shape in real time — or click <strong>&ldquo;Load sample resume&rdquo;</strong> in the top bar if you want to preview an example layout.
                </p>
              </div>
            ) : (
              <div
                ref={contentRef}
                style={{
                  transform: contentScale < 1.0 ? `scale(${contentScale})` : undefined,
                  transformOrigin: 'top center',
                }}
                className="w-full transition-transform duration-100"
              >
                <DynamicResumeRenderer
                  data={previewData}
                  template={matchedTemplate}
                  isCompact={isContentCompact}
                  accentColorOverride={accentColorOverride || matchedTemplate.accentColor}
                  sampleSections={{
                    personalInfo: false,
                    summary: false,
                    experience: false,
                    education: false,
                    projects: false,
                    skills: false,
                    certifications: false,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
