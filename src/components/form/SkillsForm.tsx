/**
 * @file src/components/form/SkillsForm.tsx
 * Dynamic Technical Skills & Competencies editor with proficiency levels.
 * Features:
 * - Each row has: Skill Name input, Proficiency dropdown (Beginner, Intermediate, Advanced, Expert, Not specified), Delete button
 * - Enter key in name field adds a new skill row immediately
 * - Up and Down arrows to reorder skills
 * - "Skills display style" selector: Tags, Progress bars, Text only (best for ATS)
 * - ATS reminder helper text: "Tip: ATS systems read text, so keep the level word visible."
 */

import React, { useRef } from 'react';
import {
  SkillCategory,
  SkillItem,
  SkillProficiency,
  SkillsDisplayStyle,
} from '../../types/resume';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Info,
  Check,
  Tag,
  BarChart2,
  AlignLeft,
  Sparkles,
} from 'lucide-react';

interface SkillsFormProps {
  skills: SkillCategory[];
  onChange: (updated: SkillCategory[]) => void;
  displayStyle?: SkillsDisplayStyle;
  onDisplayStyleChange?: (style: SkillsDisplayStyle) => void;
}

const PROFICIENCY_OPTIONS: { label: string; value: SkillProficiency; percent: string }[] = [
  { label: 'Beginner', value: 'Beginner', percent: '25%' },
  { label: 'Intermediate', value: 'Intermediate', percent: '50%' },
  { label: 'Advanced', value: 'Advanced', percent: '75%' },
  { label: 'Expert', value: 'Expert', percent: '100%' },
  { label: 'Not specified', value: 'Not specified', percent: '' },
];

const SUGGESTED_SKILL_PACKS: { label: string; skills: { name: string; level: SkillProficiency }[] }[] = [
  {
    label: '+ Python & SQL Pack',
    skills: [
      { name: 'Python', level: 'Expert' },
      { name: 'SQL & PostgreSQL', level: 'Advanced' },
      { name: 'Data Structures', level: 'Intermediate' },
    ],
  },
  {
    label: '+ Full Stack Web Pack',
    skills: [
      { name: 'React', level: 'Advanced' },
      { name: 'TypeScript', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
      { name: 'Tailwind CSS', level: 'Expert' },
    ],
  },
  {
    label: '+ Cloud & DevOps Pack',
    skills: [
      { name: 'Docker', level: 'Advanced' },
      { name: 'AWS (S3, EC2, Lambda)', level: 'Intermediate' },
      { name: 'Git & GitHub Actions', level: 'Expert' },
    ],
  },
];

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  onChange,
  displayStyle = 'tags',
  onDisplayStyleChange,
}) => {
  const lastInputRef = useRef<HTMLInputElement>(null);

  // Normalize skills category to SkillItem[]
  const getNormalizedSkills = (cat: SkillCategory): SkillItem[] => {
    return cat.skills.map((s, idx) => {
      if (typeof s === 'string') {
        const match = s.match(/(.*?)\s*\((Beginner|Intermediate|Advanced|Expert)\)/i);
        if (match) {
          return {
            id: `sk-${cat.id}-${idx}`,
            name: match[1].trim(),
            level: match[2] as SkillProficiency,
          };
        }
        return {
          id: `sk-${cat.id}-${idx}`,
          name: s.trim(),
          level: 'Intermediate',
        };
      }
      return s;
    });
  };

  const addCategory = (defaultName = 'Technical Skills') => {
    const newCat: SkillCategory = {
      id: `cat-${Date.now()}`,
      categoryName: defaultName,
      skills: [
        { id: `sk-${Date.now()}-1`, name: '', level: 'Intermediate' },
      ],
    };
    onChange([...skills, newCat]);
  };

  const updateCategoryName = (catId: string, name: string) => {
    onChange(
      skills.map((c) => (c.id === catId ? { ...c, categoryName: name } : c))
    );
  };

  const removeCategory = (catId: string) => {
    onChange(skills.filter((c) => c.id !== catId));
  };

  const addSkillRow = (catId: string, skillName = '', level: SkillProficiency = 'Intermediate') => {
    onChange(
      skills.map((c) => {
        if (c.id !== catId) return c;
        const currentNorm = getNormalizedSkills(c);
        const newItem: SkillItem = {
          id: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: skillName,
          level,
        };
        return { ...c, skills: [...currentNorm, newItem] };
      })
    );
  };

  const updateSkillRow = (catId: string, skillIndex: number, field: 'name' | 'level', value: any) => {
    onChange(
      skills.map((c) => {
        if (c.id !== catId) return c;
        const currentNorm = getNormalizedSkills(c);
        const updated = [...currentNorm];
        updated[skillIndex] = { ...updated[skillIndex], [field]: value };
        return { ...c, skills: updated };
      })
    );
  };

  const removeSkillRow = (catId: string, skillIndex: number) => {
    onChange(
      skills.map((c) => {
        if (c.id !== catId) return c;
        const currentNorm = getNormalizedSkills(c);
        const filtered = currentNorm.filter((_, i) => i !== skillIndex);
        return { ...c, skills: filtered.length > 0 ? filtered : [{ id: `sk-${Date.now()}`, name: '', level: 'Intermediate' }] };
      })
    );
  };

  const moveSkill = (catId: string, fromIndex: number, toIndex: number) => {
    onChange(
      skills.map((c) => {
        if (c.id !== catId) return c;
        const currentNorm = getNormalizedSkills(c);
        if (toIndex < 0 || toIndex >= currentNorm.length) return c;
        const updated = [...currentNorm];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return { ...c, skills: updated };
      })
    );
  };

  const insertSkillPack = (catId: string, packSkills: { name: string; level: SkillProficiency }[]) => {
    onChange(
      skills.map((c) => {
        if (c.id !== catId) return c;
        const currentNorm = getNormalizedSkills(c).filter((s) => s.name.trim() !== '');
        const newItems: SkillItem[] = packSkills.map((ps) => ({
          id: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: ps.name,
          level: ps.level,
        }));
        return { ...c, skills: [...currentNorm, ...newItems] };
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Skills Display Style Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">Skills & Competencies</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Optional
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize core capabilities with designated proficiency levels for ATS matching.
          </p>
        </div>

        {/* Skills Display Style Selector */}
        {onDisplayStyleChange && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onDisplayStyleChange('tags')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                displayStyle === 'tags'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Render skills as badges with level pills [Python · Expert]"
            >
              <Tag className="w-3 h-3" />
              <span>Tags</span>
            </button>

            <button
              type="button"
              onClick={() => onDisplayStyleChange('bars')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                displayStyle === 'bars'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Render skills with progress bars & level text"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Progress bars</span>
            </button>

            <button
              type="button"
              onClick={() => onDisplayStyleChange('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                displayStyle === 'text'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Render as comma-separated text list (Best for ATS scanners)"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Text only (Best for ATS)</span>
            </button>
          </div>
        )}
      </div>

      {/* ATS Tip Banner */}
      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Tip:</strong> ATS systems parse raw text, so keep the level word visible. Press <strong>Enter</strong> in any skill field to add the next item.
        </span>
      </div>

      {/* Empty State */}
      {skills.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/80">
          <p className="text-sm font-semibold text-slate-700">No skill categories added yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            Add categories like "Programming Languages", "Tools & Cloud", or "Core Competencies".
          </p>
          <button
            type="button"
            onClick={() => addCategory('Technical Skills')}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
          >
            + Add First Skill Category
          </button>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {skills.map((cat) => {
          const normSkills = getNormalizedSkills(cat);

          return (
            <div
              key={cat.id}
              className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={cat.categoryName}
                    onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                    placeholder="e.g. Programming Languages, Tools & Frameworks"
                    className="font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-blue-500 outline-none pb-0.5 bg-transparent w-full max-w-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Packs */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-medium">Quick add:</span>
                {SUGGESTED_SKILL_PACKS.map((pack, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => insertSkillPack(cat.id, pack.skills)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer"
                  >
                    {pack.label}
                  </button>
                ))}
              </div>

              {/* Skills Rows with Drag/Reorder, Name, Proficiency Dropdown, and Delete */}
              <div className="space-y-1.5 pt-1">
                {normSkills.map((skill, sIdx) => (
                  <div
                    key={skill.id || sIdx}
                    className="flex items-center gap-2 p-1.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl transition"
                  >
                    {/* Up / Down Reorder Arrows */}
                    <div className="flex flex-col gap-0.5 text-slate-400 shrink-0">
                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => moveSkill(cat.id, sIdx, sIdx - 1)}
                        className="hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-default"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === normSkills.length - 1}
                        onClick={() => moveSkill(cat.id, sIdx, sIdx + 1)}
                        className="hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-default"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Skill Name Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkillRow(cat.id, sIdx, 'name', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkillRow(cat.id);
                          }
                        }}
                        placeholder="e.g. Python, SQL, Tableau, Project Management"
                        className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-slate-400"
                      />
                    </div>

                    {/* Proficiency Dropdown */}
                    <div className="w-36 sm:w-44 shrink-0">
                      <select
                        value={skill.level || 'Intermediate'}
                        onChange={(e) => updateSkillRow(cat.id, sIdx, 'level', e.target.value as SkillProficiency)}
                        className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        {PROFICIENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} {opt.percent ? `(${opt.percent})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Skill Row */}
                    <button
                      type="button"
                      onClick={() => removeSkillRow(cat.id, sIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                      title="Remove Skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Skill Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addSkillRow(cat.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill (or press Enter)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Category Button */}
      <button
        type="button"
        onClick={() => addCategory('Tools & Methodologies')}
        className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 transition cursor-pointer bg-slate-50/50"
      >
        <Plus className="w-4 h-4" />
        <span>Add Another Skill Category</span>
      </button>
    </div>
  );
};
