/**
 * @file src/components/form/ExperienceForm.tsx
 * Dynamic work experience editor with quantified bullet points, grey placeholders,
 * clickable "Use example" suggestion helpers, and "✨ Improve with AI" action verbs.
 */

import React, { useState } from 'react';
import { ExperienceItem } from '../../types/resume';
import { Plus, Trash2, Building, Lightbulb, PlusCircle, Sparkles, Loader2 } from 'lucide-react';
import { EXAMPLE_SNIPPETS } from '../../data/sampleResume';
import { improveExperienceBullet } from '../../utils/geminiAi';

interface ExperienceFormProps {
  experiences: ExperienceItem[];
  onChange: (updated: ExperienceItem[]) => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ experiences, onChange }) => {
  const [showExamples, setShowExamples] = useState(false);
  const [polishingId, setPolishingId] = useState<string | null>(null);

  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    };
    onChange([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
    onChange(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperience = (id: string) => {
    onChange(experiences.filter((exp) => exp.id !== id));
  };

  const addBullet = (expId: string) => {
    onChange(
      experiences.map((exp) =>
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      )
    );
  };

  const updateBullet = (expId: string, index: number, value: string) => {
    onChange(
      experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[index] = value;
        return { ...exp, bullets: newBullets };
      })
    );
  };

  const removeBullet = (expId: string, index: number) => {
    onChange(
      experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const newBullets = exp.bullets.filter((_, i) => i !== index);
        return { ...exp, bullets: newBullets.length ? newBullets : [''] };
      })
    );
  };

  const handleImproveBullet = async (expId: string, index: number, roleContext: string) => {
    const targetExp = experiences.find((e) => e.id === expId);
    if (!targetExp) return;
    const currentBullet = targetExp.bullets[index];
    if (!currentBullet.trim()) return;

    const opKey = `${expId}-${index}`;
    setPolishingId(opKey);
    try {
      const improved = await improveExperienceBullet(currentBullet, roleContext || 'Software Engineer');
      updateBullet(expId, index, improved);
    } catch (e) {
      console.error(e);
    } finally {
      setPolishingId(null);
    }
  };

  const handleInsertBulletExample = (bulletText: string) => {
    if (experiences.length === 0) {
      const newExp: ExperienceItem = {
        id: `exp-${Date.now()}`,
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [bulletText],
      };
      onChange([newExp]);
    } else {
      const targetExp = experiences[experiences.length - 1];
      const hasEmptyBullet = targetExp.bullets.length === 1 && targetExp.bullets[0].trim() === '';
      const updatedBullets = hasEmptyBullet ? [bulletText] : [...targetExp.bullets, bulletText];
      onChange(
        experiences.map((exp) =>
          exp.id === targetExp.id ? { ...exp, bullets: updatedBullets } : exp
        )
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Work & Internship Experience</h3>
          <p className="text-xs text-slate-500">
            Detail internships, contract, or full-time roles (optional - skip if fresher).
          </p>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Experience
        </button>
      </div>

      {/* Example Helper Pill Banner */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            <span>Need inspiration for bullet points? Click to insert:</span>
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
            {EXAMPLE_SNIPPETS.experience.map((example, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-700 flex items-start justify-between gap-3 shadow-2xs hover:border-blue-400 transition"
              >
                <p className="flex-1 leading-relaxed">
                  <span className="font-semibold text-blue-600">• </span>
                  {example}
                </p>
                <button
                  type="button"
                  onClick={() => handleInsertBulletExample(example)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3 text-blue-600" />
                  <span>Insert bullet</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {experiences.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Building className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No work experience added yet</p>
          <p className="text-xs text-slate-400 mb-3">Add internships, freelance gigs, or full-time positions.</p>
          <button
            type="button"
            onClick={addExperience}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
          >
            + Add First Position
          </button>
        </div>
      )}

      {experiences.map((exp, index) => (
        <div key={exp.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Position #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeExperience(exp.id)}
              className="p-1 text-slate-400 hover:text-red-500 transition rounded cursor-pointer"
              title="Delete Position"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Apex Cloud Systems"
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Job Title / Role</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Software Engineer"
                value={exp.role}
                onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={exp.location}
                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  placeholder="e.g. Jun 2023"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  placeholder="e.g. Present"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Quantified Bullet Points */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Key Responsibilities & Achievements
              </label>
              <button
                type="button"
                onClick={() => addBullet(exp.id)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                + Add Bullet
              </button>
            </div>

            {exp.bullets.map((bullet, bIdx) => {
              const opKey = `${exp.id}-${bIdx}`;
              const isPolishing = polishingId === opKey;

              return (
                <div key={bIdx} className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-bold">•</span>
                  <input
                    type="text"
                    placeholder="e.g. Built X using Y, resulting in Z% improvement"
                    value={bullet}
                    onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 bg-white"
                  />

                  {/* AI Bullet Improvement Sparkle Action */}
                  <button
                    type="button"
                    disabled={isPolishing || !bullet.trim()}
                    onClick={() => handleImproveBullet(exp.id, bIdx, exp.role)}
                    className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition border border-purple-200 cursor-pointer disabled:opacity-40 shrink-0"
                    title="Improve with AI (Action verbs + metrics)"
                  >
                    {isPolishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </button>

                  {exp.bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBullet(exp.id, bIdx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Remove Bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
