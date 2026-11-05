/**
 * @file src/components/gallery/TemplatePreviewModal.tsx
 * Full-size A4 Resume Lightbox Modal for template inspection.
 * Warm Brown & Cream Palette: #291C0E, #6E473B, #E1D4C2, #F4E6D2, #C98B5E.
 * Fixes right-edge clipping bug with proper padding, box-sizing, and arrow clearance.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, TemplateOption } from '../../types/resume';
import { CURATED_TEMPLATES, POPULAR_ACCENTS } from '../../data/templatesData';
import { PERSONAS } from '../../data/personas';
import { DynamicResumeRenderer } from '../preview/DynamicResumeRenderer';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Palette,
  ShieldCheck,
  ArrowRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  initialTemplateId: string;
  onClose: () => void;
  onUseTemplate: (templateId: string, accentColor?: string) => void;
  overrideResumeData?: ResumeData;
  previewTitleBadge?: string;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  initialTemplateId,
  onClose,
  onUseTemplate,
  overrideResumeData,
  previewTitleBadge,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAccent, setSelectedAccent] = useState<string>('#6E473B');
  const [zoom, setZoom] = useState<number>(0.78);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Initialize selected template index
  useEffect(() => {
    if (initialTemplateId) {
      const idx = CURATED_TEMPLATES.findIndex((t) => t.id === initialTemplateId);
      if (idx !== -1) {
        setCurrentIdx(idx);
        setSelectedAccent(CURATED_TEMPLATES[idx].accentColor || '#6E473B');
      }
    }
  }, [initialTemplateId, isOpen]);

  // Auto-fit zoom so template is NEVER cut off on right or left
  useEffect(() => {
    if (!isOpen) return;
    const calculateZoom = () => {
      if (viewportRef.current) {
        const availableW = viewportRef.current.clientWidth - 110; // Clearance for side navigation arrows
        const sheetW = 794;
        if (availableW > 0) {
          const fitZoom = Math.min(Math.max(availableW / sheetW, 0.45), 0.95);
          setZoom(fitZoom);
        }
      }
    };
    calculateZoom();
    window.addEventListener('resize', calculateZoom);
    return () => window.removeEventListener('resize', calculateZoom);
  }, [isOpen, currentIdx]);

  // Keyboard navigation for Left/Right and Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIdx]);

  if (!isOpen) return null;

  const currentTemplate = CURATED_TEMPLATES[currentIdx] || CURATED_TEMPLATES[0];
  const resumeToRender =
    overrideResumeData || PERSONAS[currentTemplate.personaId] || PERSONAS.roger_stevens;

  const handlePrev = () => {
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : CURATED_TEMPLATES.length - 1;
    setCurrentIdx(nextIdx);
    setSelectedAccent(CURATED_TEMPLATES[nextIdx].accentColor || selectedAccent);
  };

  const handleNext = () => {
    const nextIdx = currentIdx < CURATED_TEMPLATES.length - 1 ? currentIdx + 1 : 0;
    setCurrentIdx(nextIdx);
    setSelectedAccent(CURATED_TEMPLATES[nextIdx].accentColor || selectedAccent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#291C0E]/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-[#FBF5EC] border border-[#E1D4C2] rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-[#F4E6D2] border-b border-[#E1D4C2] flex items-center justify-between gap-4 text-[#291C0E] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-1.5 rounded-xl bg-[#E1D4C2] text-[#6E473B] shrink-0">
              <Sparkles className="w-4 h-4 text-[#C98B5E]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#291C0E] font-serif truncate">
                  {currentTemplate.name}
                </h3>
                {previewTitleBadge ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C98B5E] text-[#291C0E] shrink-0">
                    {previewTitleBadge}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1D4C2] text-[#291C0E] border border-[#BEB5A9] shrink-0">
                    {currentTemplate.badge}
                  </span>
                )}
                {currentTemplate.isAtsSafe && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4D8B6A]/15 text-[#4D8B6A] border border-[#4D8B6A]/30">
                    <ShieldCheck className="w-3 h-3" /> ATS Safe
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6E473B] truncate">
                Template {currentIdx + 1} of {CURATED_TEMPLATES.length} • {currentTemplate.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-[#FBF5EC] rounded-xl p-1 border border-[#E1D4C2] mr-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.05, 0.45))}
                className="p-1 hover:text-[#C98B5E] text-[#6E473B] transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-semibold text-[#291C0E] w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.05, 1.2))}
                className="p-1 hover:text-[#C98B5E] text-[#6E473B] transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Use Template Action */}
            <button
              type="button"
              onClick={() => onUseTemplate(currentTemplate.id, selectedAccent)}
              className="px-4 py-2 bg-[#C98B5E] hover:bg-[#B5774A] text-[#291C0E] font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <span>Use This Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6E473B] hover:text-[#291C0E] hover:bg-[#E1D4C2] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left / Right Navigation & Centered Scaled Preview */}
        <div className="flex-1 relative flex items-center justify-between overflow-hidden bg-[#E1D4C2]">
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#FBF5EC]/95 text-[#291C0E] hover:text-[#C98B5E] hover:bg-white border border-[#BEB5A9] shadow-xl transition cursor-pointer"
            title="Previous Template (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Central Scrollable Resume Desk (No Right Clipping!) */}
          <div
            ref={viewportRef}
            className="w-full h-full overflow-auto px-12 sm:px-16 py-6 flex justify-center items-start"
          >
            <div
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
                margin: '0 auto',
                flexShrink: 0,
              }}
              className="relative transition-all duration-150"
            >
              {/* Guaranteed White Paper with safe 8mm 10mm padding */}
              <div
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundColor: '#ffffff',
                }}
                className="shadow-2xl rounded-xs p-[8mm_10mm] box-border select-text overflow-hidden"
              >
                <DynamicResumeRenderer
                  data={resumeToRender}
                  template={currentTemplate}
                  accentColorOverride={selectedAccent}
                />
              </div>
            </div>
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#FBF5EC]/95 text-[#291C0E] hover:text-[#C98B5E] hover:bg-white border border-[#BEB5A9] shadow-xl transition cursor-pointer"
            title="Next Template (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Footer: Accent Swatches Bar */}
        <div className="px-5 py-3 bg-[#F4E6D2] border-t border-[#E1D4C2] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6E473B]">
            <Palette className="w-3.5 h-3.5 text-[#C98B5E]" />
            <span className="font-semibold text-[#291C0E]">Try Accent Color:</span>
            <div className="flex items-center gap-1.5 ml-2">
              {POPULAR_ACCENTS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setSelectedAccent(swatch.hex)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative ${
                    selectedAccent.toLowerCase() === swatch.hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-[#C98B5E] shadow-xs'
                      : 'opacity-70 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.name}
                >
                  {selectedAccent.toLowerCase() === swatch.hex.toLowerCase() && (
                    <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-[#6E473B] flex items-center gap-4">
            <span>Use Left / Right arrow keys to browse</span>
            <button
              type="button"
              onClick={() => onUseTemplate(currentTemplate.id, selectedAccent)}
              className="text-[#C98B5E] hover:text-[#B5774A] hover:underline font-bold cursor-pointer"
            >
              Select Template & Edit →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
