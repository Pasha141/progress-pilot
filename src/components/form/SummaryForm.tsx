/**
 * @file src/components/form/SummaryForm.tsx
 * Professional Summary / Profile editor with integrated Gemini AI Writer.
 * Features:
 * - "Write with AI" panel: target job title, experience level, top skills, tone selector
 * - 3 generated options with 1-click insert & edit
 * - Quick text polish actions: "Improve my text", "Make shorter", "Make more impactful"
 * - Example helper pills banner
 * - ATS word count guidance
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Lightbulb,
  PlusCircle,
  Check,
  Wand2,
  Minimize2,
  TrendingUp,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';
import { EXAMPLE_SNIPPETS } from '../../data/sampleResume';
import {
  generateSummaryOptions,
  improveSummaryText,
  SummaryOption,
} from '../../utils/geminiAi';

interface SummaryFormProps {
  summary: string;
  summaryTitle?: string;
  onSummaryChange: (updated: string) => void;
  onTitleChange: (updatedTitle: string) => void;
  roleContext?: string;
  skillsContext?: string[];
}

const TITLE_OPTIONS = [
  'Professional Summary',
  'Profile',
  'Executive Profile',
  'Career Summary',
  'About Me',
];

export const SummaryForm: React.FC<SummaryFormProps> = ({
  summary,
  summaryTitle = 'Professional Summary',
  onSummaryChange,
  onTitleChange,
  roleContext = '',
  skillsContext = [],
}) => {
  const [showExamples, setShowExamples] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [insertedIdx, setInsertedIdx] = useState<number | null>(null);

  // AI Form State
  const [aiJobTitle, setAiJobTitle] = useState(roleContext || '');
  const [aiExperience, setAiExperience] = useState('3-5 years');
  const [aiSkills, setAiSkills] = useState(skillsContext.slice(0, 4).join(', ') || 'Python, SQL, React');
  const [aiTone, setAiTone] = useState<'Professional' | 'Confident' | 'Friendly'>('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState<SummaryOption[]>([]);
  const [isPolishing, setIsPolishing] = useState(false);

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const handleInsertExample = (text: string, idx: number) => {
    onSummaryChange(text);
    setInsertedIdx(idx);
    setTimeout(() => setInsertedIdx(null), 2500);
  };

  const handleGenerateAi = async () => {
    setIsGenerating(true);
    try {
      const skillsArray = aiSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const options = await generateSummaryOptions({
        jobTitle: aiJobTitle.trim() || roleContext || 'Software Engineer',
        experienceYears: aiExperience,
        skills: skillsArray,
        tone: aiTone,
      });
      setAiOptions(options);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickImprove = async (mode: 'improve' | 'shorter' | 'impactful') => {
    if (!summary.trim()) return;
    setIsPolishing(true);
    try {
      const improved = await improveSummaryText(summary, mode, roleContext || 'Professional');
      onSummaryChange(improved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title Selector & AI Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">
              {summaryTitle || 'Professional Summary'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Optional
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Summarize your core strengths, experience level, and key qualifications in 2-4 sentences.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Write with AI Button */}
          <button
            type="button"
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border shadow-2xs ${
              showAiPanel
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Write with AI</span>
          </button>

          {/* Section Heading Title Picker */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Heading:</label>
            <div className="relative">
              <select
                value={summaryTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {TITLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Writer Panel */}
      {showAiPanel && (
        <div className="p-4 bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white border border-purple-200 rounded-2xl shadow-xs space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-purple-950">
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span>AI Professional Summary Generator (Gemini 3.8 Flash)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAiPanel(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Job Title:</label>
              <input
                type="text"
                value={aiJobTitle}
                onChange={(e) => setAiJobTitle(e.target.value)}
                placeholder="e.g. Senior Data Analyst / Full Stack Developer"
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Experience Level:</label>
              <select
                value={aiExperience}
                onChange={(e) => setAiExperience(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Fresher / 0 years">Fresher / Student (0 years)</option>
                <option value="1-2 years">Entry Level (1-2 years)</option>
                <option value="3-5 years">Mid Level (3-5 years)</option>
                <option value="6-9 years">Senior Level (6-9 years)</option>
                <option value="10+ years">Executive / Lead (10+ years)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Top 3-5 Skills:</label>
              <input
                type="text"
                value={aiSkills}
                onChange={(e) => setAiSkills(e.target.value)}
                placeholder="e.g. Python, SQL, React, AWS, Docker"
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Desired Tone:</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Professional">Professional (Standard ATS)</option>
                <option value="Confident">Confident & Leadership</option>
                <option value="Friendly">Friendly & Collaborative</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateAi}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating 3 Options...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Generate 3 Summary Options</span>
                </>
              )}
            </button>
          </div>

          {/* AI Generated Options */}
          {aiOptions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-purple-100">
              <span className="text-xs font-bold text-purple-900 block">
                Click any option to insert into your resume:
              </span>
              {aiOptions.map((opt, i) => (
                <div
                  key={i}
                  className="p-3 bg-white border border-purple-200 rounded-xl hover:border-purple-400 transition cursor-pointer text-xs space-y-1.5 shadow-2xs group"
                  onClick={() => {
                    onSummaryChange(opt.summary);
                    setShowAiPanel(false);
                  }}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      {opt.tag}
                    </span>
                    <span className="text-slate-400 font-medium">{opt.wordCount} words</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{opt.summary}</p>
                  <div className="text-[11px] font-bold text-purple-600 group-hover:text-purple-800 flex items-center gap-1">
                    <span>Click to Insert & Edit</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example Helper Pill Banner */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            <span>Need inspiration? Click an example to insert and edit:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 underline cursor-pointer"
          >
            {showExamples ? 'Hide examples' : 'Show examples'}
          </button>
        </div>

        {showExamples && (
          <div className="space-y-2 pt-1">
            {EXAMPLE_SNIPPETS.summary.map((example, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 flex items-start justify-between gap-3 shadow-2xs hover:border-blue-400 transition"
              >
                <p className="flex-1 leading-relaxed">{example}</p>
                <button
                  type="button"
                  onClick={() => handleInsertExample(example, idx)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
                >
                  {insertedIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Inserted ✓</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3 h-3 text-blue-600" />
                      <span>Use example</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Textarea */}
      <div className="space-y-1.5">
        <textarea
          rows={5}
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="e.g. Results-driven graduate with hands-on experience in full-stack development, Python, SQL, and modern web frameworks. Proven ability to optimize application performance and build clean user experiences."
          className="w-full px-3.5 py-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white leading-relaxed resize-y font-normal placeholder-slate-400"
        />

        {/* Quick AI Polish Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Quick polish:</span>
            <button
              type="button"
              disabled={isPolishing || !summary.trim()}
              onClick={() => handleQuickImprove('improve')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-40"
              title="Fix grammar, tone, and readability"
            >
              <RefreshCw className={`w-3 h-3 text-blue-600 ${isPolishing ? 'animate-spin' : ''}`} />
              <span>Improve my text</span>
            </button>
            <button
              type="button"
              disabled={isPolishing || !summary.trim()}
              onClick={() => handleQuickImprove('shorter')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-40"
              title="Condense summary to fit on 1 page"
            >
              <Minimize2 className="w-3 h-3 text-amber-600" />
              <span>Make shorter</span>
            </button>
            <button
              type="button"
              disabled={isPolishing || !summary.trim()}
              onClick={() => handleQuickImprove('impactful')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-40"
              title="Strengthen with action verbs and quantifiable results"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Make more impactful</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Target: 40–80 words</span>
            <span>•</span>
            <span className={`font-semibold ${wordCount > 90 ? 'text-amber-600' : 'text-slate-600'}`}>
              {wordCount} words
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
