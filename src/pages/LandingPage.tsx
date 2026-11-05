/**
 * @file src/pages/LandingPage.tsx
 * Landing page & 100-template showcase for Resume Builder by Junaid.
 * Warm Brown & Cream Palette: #291C0E, #6E473B, #E1D4C2, #F4E6D2, #C98B5E.
 * Features:
 * 1. Hero section:
 *    - Deep warm cocoa gradient (#291C0E to #6E473B) with cream text & taupe ambient glow
 *    - Hero floating preview card with Mohammed Junaid Pasha's resume on pure white paper
 *    - Name badge "Mohammed Junaid Pasha" in copper (#C98B5E) with cocoa text (#291C0E)
 *    - Auto-rotates across 3 templates every 4s with interactive dot indicators
 * 2. 100-template Gallery:
 *    - 14 categories with dynamic template count indicators
 *    - ATS-safe only toggle switch (copper when enabled)
 *    - Search box & Sort dropdown (Popular / New / A-Z)
 *    - Warm cream cards with soft shadows and sand borders
 *    - Full-screen lightbox modal on click with zero right clipping
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TemplateId, TemplateCategory, TemplateOption } from '../types/resume';
import { CURATED_TEMPLATES } from '../data/templatesData';
import { FICTIONAL_SAMPLE_RESUME } from '../data/sampleResume';
import { MiniTemplatePreview } from '../components/preview/MiniTemplatePreview';
import { DynamicResumeRenderer } from '../components/preview/DynamicResumeRenderer';
import { TemplatePreviewModal } from '../components/gallery/TemplatePreviewModal';
import { Footer } from '../components/Footer';
import {
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Eye,
  Search,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface LandingPageProps {
  onSelectTemplate: (templateId: TemplateId, accentColor?: string) => void;
  onNavigateToBuilder: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAtsChecker?: () => void;
  currentTemplateId: TemplateId;
  activePage?: string;
}

const CATEGORIES: TemplateCategory[] = [
  'All',
  'Fresher / Student',
  'Software & IT',
  'Data & Analytics',
  'Business & Management',
  'Healthcare',
  'Finance & Accounting',
  'Creative / Design',
  'Sales & Marketing',
  'Engineering',
  'Education / Teaching',
  'Simple / Minimal',
  'Two-Column',
  'Executive / Professional',
  'Compact',
];

// 3 Templates to rotate in the hero preview card
const HERO_ROTATING_TEMPLATES = ['tmpl-1', 'tmpl-3', 'tmpl-2'];

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTemplate,
  onNavigateToBuilder,
  onNavigateToAtsChecker,
  currentTemplateId,
  activePage,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'new' | 'az'>('popular');
  const [atsSafeOnly, setAtsSafeOnly] = useState<boolean>(false);
  const [previewModalTemplateId, setPreviewModalTemplateId] = useState<string | null>(null);
  const [isHeroOwnerModalOpen, setIsHeroOwnerModalOpen] = useState<boolean>(false);

  // Hero Preview Auto-Rotation state
  const [heroTemplateIdx, setHeroTemplateIdx] = useState<number>(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Scroll to gallery whenever activePage is templates
  useEffect(() => {
    if (activePage === 'templates') {
      const timer = setTimeout(() => {
        galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePage]);

  // Auto-rotate hero preview card every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTemplateIdx((prev) => (prev + 1) % HERO_ROTATING_TEMPLATES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeHeroTemplateId = HERO_ROTATING_TEMPLATES[heroTemplateIdx];
  const activeHeroTemplate =
    CURATED_TEMPLATES.find((t) => t.id === activeHeroTemplateId) || CURATED_TEMPLATES[0];

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Category counts computation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: CURATED_TEMPLATES.length };
    for (const tmpl of CURATED_TEMPLATES) {
      counts[tmpl.category] = (counts[tmpl.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered & Sorted Templates
  const filteredTemplates = useMemo(() => {
    let list = CURATED_TEMPLATES.filter((tmpl) => {
      const matchesCategory =
        activeCategory === 'All' ||
        tmpl.category === activeCategory ||
        (activeCategory === 'Two-Column' &&
          (tmpl.layoutArchetype === 'monogram' ||
            tmpl.layoutArchetype === 'sidebar' ||
            tmpl.layoutArchetype === 'compact'));

      const matchesSearch =
        searchQuery.trim() === '' ||
        tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAts = !atsSafeOnly || tmpl.isAtsSafe;

      return matchesCategory && matchesSearch && matchesAts;
    });

    if (sortBy === 'new') {
      list = [...list].sort((a, b) => b.numericIndex - a.numericIndex);
    } else if (sortBy === 'az') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [activeCategory, searchQuery, atsSafeOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#FBF5EC] dark:bg-[#1E1612] text-[#291C0E] dark:text-[#F5EBE0] flex flex-col select-none transition-colors">
      {/* ========================================================= */}
      {/* 1. HERO SECTION: Deep Warm Cocoa to Muted Brown Gradient  */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#291C0E] via-[#482E22] to-[#6E473B] dark:from-[#160F0C] dark:via-[#261A14] dark:to-[#3A271E] text-[#F4E6D2] pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#E1D4C2]/30 dark:border-[#3D2C23]">
        {/* Subtle Ambient Radial Glow in Taupe */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A78D78]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C98B5E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline, CTAs, Trust Badges */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Top Recruiter Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#F4E6D2]/10 text-[#F4E6D2] border border-[#F4E6D2]/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#C98B5E]" />
                <span>Recruiter & ATS Verified 2026 Engine</span>
              </div>

              {/* Main Headline with Serif Typography */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight text-white">
                Build an ATS-friendly resume{' '}
                <span className="text-[#C98B5E] italic">
                  in minutes
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-sm sm:text-base text-[#BEB5A9] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Craft a recruiter-approved resume that guarantees a 90+ ATS score, fits on exactly one physical A4 page, and exports cleanly to PDF or Word (.docx).
              </p>

              {/* Primary & Secondary Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToBuilder}
                  className="px-6 py-3.5 text-sm sm:text-base font-bold text-[#291C0E] bg-[#C98B5E] hover:bg-[#B5774A] active:scale-95 rounded-full shadow-lg shadow-[#C98B5E]/30 transition flex items-center gap-2 cursor-pointer font-sans"
                >
                  <span>Build My Resume</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onNavigateToAtsChecker && (
                  <button
                    type="button"
                    onClick={onNavigateToAtsChecker}
                    className="px-6 py-3.5 text-sm sm:text-base font-bold text-[#291C0E] bg-[#F4E6D2] hover:bg-[#E1D4C2] active:scale-95 rounded-full shadow-md transition flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <Sparkles className="w-4 h-4 text-[#C98B5E]" />
                    <span>Check My ATS Score</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={scrollToGallery}
                  className="px-6 py-3.5 text-sm sm:text-base font-semibold text-[#F4E6D2] bg-white/10 hover:bg-white/15 border border-white/20 rounded-full transition cursor-pointer backdrop-blur-md"
                >
                  Browse 100 Templates
                </button>
              </div>

              {/* 3 Trust Points */}
              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2 text-xs text-[#F4E6D2]">
                  <div className="w-5 h-5 rounded-full bg-[#C98B5E]/20 text-[#C98B5E] flex items-center justify-center shrink-0 border border-[#C98B5E]/40">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-semibold text-xs">100% ATS-Friendly</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#F4E6D2]">
                  <div className="w-5 h-5 rounded-full bg-[#C98B5E]/20 text-[#C98B5E] flex items-center justify-center shrink-0 border border-[#C98B5E]/40">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-semibold text-xs">1-Page Fit Guarantee</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#F4E6D2]">
                  <div className="w-5 h-5 rounded-full bg-[#C98B5E]/20 text-[#C98B5E] flex items-center justify-center shrink-0 border border-[#C98B5E]/40">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-semibold text-xs">Free PDF & DOCX</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Floating Preview Card with Mohammed Junaid Pasha's Resume */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div
                onClick={() => setIsHeroOwnerModalOpen(true)}
                className="w-72 sm:w-80 h-[380px] sm:h-[420px] rounded-3xl shadow-2xl bg-white p-2 border-2 border-[#BEB5A9]/50 hover:border-[#C98B5E] transition-all duration-300 transform hover:-translate-y-1 rotate-1 hover:rotate-0 cursor-pointer group relative overflow-hidden"
              >
                {/* Copper Background & Cocoa Text Badge: Mohammed Junaid Pasha */}
                <div className="absolute -top-1 -right-1 z-30 bg-[#C98B5E] text-[#291C0E] px-3.5 py-1 rounded-bl-2xl rounded-tr-2xl text-xs font-black shadow-md flex items-center gap-1.5 border border-[#B5774A] tracking-tight font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-[#291C0E]" />
                  <span>Mohammed Junaid Pasha</span>
                </div>

                {/* Scaled Render of Owner Resume on Pure White Paper */}
                <div data-resume-paper="true" className="w-full h-full overflow-hidden rounded-2xl bg-white relative">
                  <div
                    style={{
                      width: '794px',
                      minHeight: '1123px',
                      transform: 'scale(0.355)',
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <DynamicResumeRenderer
                      data={FICTIONAL_SAMPLE_RESUME}
                      template={activeHeroTemplate}
                      accentColorOverride={activeHeroTemplate.accentColor}
                    />
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#291C0E]/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs z-20">
                  <span className="px-4 py-2 bg-[#C98B5E] text-[#291C0E] font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5 font-sans">
                    <Eye className="w-3.5 h-3.5" /> Click to Inspect Full Size
                  </span>
                </div>
              </div>

              {/* Template Rotation Dots Indicator */}
              <div className="flex items-center gap-2 mt-4 z-10">
                {HERO_ROTATING_TEMPLATES.map((tId, idx) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setHeroTemplateIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      heroTemplateIdx === idx ? 'w-6 bg-[#C98B5E]' : 'w-2 bg-[#BEB5A9]/50 hover:bg-[#F4E6D2]'
                    }`}
                    title={`View in ${CURATED_TEMPLATES.find((t) => t.id === tId)?.name || 'template'}`}
                  />
                ))}
                <span className="text-[10px] text-[#BEB5A9] font-medium ml-1">
                  Preview in {activeHeroTemplate.name.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. 100-TEMPLATE GALLERY                                    */}
      {/* ========================================================= */}
      <section ref={galleryRef} className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        {/* Section Header */}
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E1D4C2] dark:bg-[#352720] text-[#291C0E] dark:text-[#F5EBE0] border border-[#BEB5A9] dark:border-[#4A372D]">
            <Layers className="w-3.5 h-3.5 text-[#C98B5E] dark:text-[#DF9F70]" />
            <span>42 Config-Driven ATS Templates</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#291C0E] dark:text-[#F5EBE0] tracking-tight">
            Curated ATS Resume Examples & Templates
          </h2>
          <p className="text-xs sm:text-sm text-[#6E473B] dark:text-[#D2BFA9] leading-relaxed">
            Explore 100 professional resume designs for freshers, technology, data, business, healthcare, engineering, education, and more. Each design keeps your resume content intact while giving you a distinct, role-ready layout.
          </p>
        </div>

        {/* Filter Controls: Category Tabs, Search, Sort, ATS Toggle */}
        <div className="space-y-4 mb-8">
          {/* Category Tabs with dynamic counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              const count = categoryCounts[cat] || (cat === 'All' ? CURATED_TEMPLATES.length : 0);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#F4E6D2] dark:text-[#1E1612] bg-[#291C0E] dark:bg-[#DF9F70] shadow-xs font-black'
                      : 'text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] bg-[#F4E6D2]/60 dark:bg-[#2A1F1A] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] border border-[#E1D4C2] dark:border-[#433229]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#C98B5E] dark:bg-[#291C0E] text-[#291C0E] dark:text-[#F5EBE0]'
                        : 'bg-[#E1D4C2] dark:bg-[#3A2A20] text-[#6E473B] dark:text-[#E8B892]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Search, Sort Dropdown & ATS-Safe Switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FBF5EC] dark:bg-[#261C17] p-3 rounded-2xl border border-[#E1D4C2] dark:border-[#433229]">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#A78D78] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, skill, or template name..."
                className="w-full bg-[#FBF5EC] dark:bg-[#1E1612] border border-[#BEB5A9] dark:border-[#4A372D] focus:border-[#C98B5E] focus:ring-2 focus:ring-[#C98B5E]/20 text-[#291C0E] dark:text-[#F5EBE0] rounded-xl pl-8 pr-3 py-2 text-xs placeholder:text-[#A78D78]/60 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
              {/* ATS Safe Only Switch */}
              <label className="flex items-center gap-2 text-xs text-[#291C0E] dark:text-[#F5EBE0] font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={atsSafeOnly}
                  onChange={(e) => setAtsSafeOnly(e.target.checked)}
                  className="rounded border-[#BEB5A9] text-[#C98B5E] focus:ring-[#C98B5E] bg-[#FBF5EC] w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4D8B6A]" />
                  <span>ATS-safe only</span>
                </span>
              </label>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E473B] dark:text-[#D2BFA9]">
                <ArrowUpDown className="w-3 h-3 text-[#C98B5E] dark:text-[#DF9F70]" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popular' | 'new' | 'az')}
                  className="bg-[#FBF5EC] dark:bg-[#1E1612] border border-[#BEB5A9] dark:border-[#4A372D] rounded-lg px-2 py-1 text-xs text-[#291C0E] dark:text-[#F5EBE0] outline-none cursor-pointer"
                >
                  <option value="popular">Popular First</option>
                  <option value="new">Newest Added</option>
                  <option value="az">Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* Result Count */}
              <span className="text-[11px] text-[#6E473B] dark:text-[#CBB8A6] font-medium">
                {filteredTemplates.length} templates
              </span>
            </div>
          </div>
        </div>

        {/* Curated Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => {
            const isCurrentlySelected = currentTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`bg-[#FBF5EC] dark:bg-[#2A1F1A] rounded-3xl border transition-all duration-200 flex flex-col overflow-hidden group shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                  isCurrentlySelected
                    ? 'border-[#C98B5E] dark:border-[#DF9F70] ring-2 ring-[#C98B5E]/30'
                    : 'border-[#E1D4C2] dark:border-[#433229] hover:border-[#A78D78] dark:hover:border-[#C98B5E]/60'
                }`}
              >
                {/* Miniature Canvas Wrapper (White Paper inside) */}
                <div
                  onClick={() => setPreviewModalTemplateId(template.id)}
                  className="relative h-64 bg-[#E1D4C2] dark:bg-[#352720] p-3 flex items-center justify-center cursor-pointer overflow-hidden border-b border-[#E1D4C2] dark:border-[#433229]"
                >
                  {/* Miniature Resume */}
                  <div data-resume-paper="true" className="w-full h-full transform group-hover:scale-[1.02] transition-transform duration-200">
                    <MiniTemplatePreview template={template} />
                  </div>

                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EC]/90 dark:bg-[#241B16]/90 text-[#291C0E] dark:text-[#F5EBE0] border border-[#BEB5A9] dark:border-[#4A372D] shadow-xs">
                      {template.badge}
                    </span>
                    {template.isAtsSafe && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#4D8B6A]/15 text-[#4D8B6A] dark:text-[#7CC49B] border border-[#4D8B6A]/30">
                        ATS 99%
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#291C0E]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                    <span className="px-3 py-1.5 bg-[#C98B5E] text-[#291C0E] font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 font-sans">
                      <Eye className="w-3.5 h-3.5" /> Quick Preview
                    </span>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98B5E] dark:text-[#DF9F70] truncate">
                        {template.category}
                      </span>
                      <span className="text-[10px] text-[#A78D78] font-mono">
                        #{template.numericIndex}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#291C0E] dark:text-[#F5EBE0] truncate mt-0.5" title={template.name}>
                      {template.name}
                    </h3>

                    <p className="text-[11px] text-[#6E473B] dark:text-[#D2BFA9] line-clamp-2 mt-1 leading-snug">
                      {template.description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#E1D4C2] dark:border-[#433229] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalTemplateId(template.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#6E473B] dark:text-[#D2BFA9] hover:text-[#291C0E] dark:hover:text-[#F5EBE0] hover:bg-[#F4E6D2] dark:hover:bg-[#352720] rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectTemplate(template.id, template.accentColor)}
                      className="flex-1 py-1.5 px-3 text-xs font-bold text-[#291C0E] bg-[#C98B5E] dark:bg-[#DF9F70] hover:bg-[#B5774A] dark:hover:bg-[#CE8D5D] rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hero Card Full-Size Lightbox Modal (Mohammed Junaid Pasha's Resume) */}
      <TemplatePreviewModal
        isOpen={isHeroOwnerModalOpen}
        initialTemplateId={activeHeroTemplateId}
        onClose={() => setIsHeroOwnerModalOpen(false)}
        onUseTemplate={(tmplId, accent) => {
          setIsHeroOwnerModalOpen(false);
          onSelectTemplate(tmplId, accent);
        }}
        overrideResumeData={FICTIONAL_SAMPLE_RESUME}
        previewTitleBadge="Alex Johnson"
      />

      {/* Gallery Template Full-Size Lightbox Modal */}
      <TemplatePreviewModal
        isOpen={!!previewModalTemplateId}
        initialTemplateId={previewModalTemplateId || 'tmpl-1'}
        onClose={() => setPreviewModalTemplateId(null)}
        onUseTemplate={(tmplId, accent) => {
          setPreviewModalTemplateId(null);
          onSelectTemplate(tmplId, accent);
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
