/**
 * @file src/components/preview/MiniTemplatePreview.tsx
 * High-fidelity miniature resume thumbnail component for curated templates.
 * Every template renders with its specific fictional domain persona (Roger Stevens, Priya Nair, Daniel Okafor, etc.)
 * with authentic archetype layouts, typography nuances, and colored accents.
 */

import React from 'react';
import { TemplateOption } from '../../types/resume';
import { PERSONAS } from '../../data/personas';

interface MiniTemplatePreviewProps {
  template: TemplateOption;
}

const MiniTemplateLayout: React.FC<MiniTemplatePreviewProps> = ({ template }) => {
  const { layoutArchetype, accentColor, personaId } = template;
  const persona = PERSONAS[personaId] || PERSONAS.roger_stevens;
  const { personalInfo, summary, experiences, education, skills } = persona;

  const initials = personalInfo.fullName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // 1. Monogram Archetype (Roger Stevens, Screenshot 3 reference)
  if (layoutArchetype === 'monogram') {
    return (
      <div className="w-full h-full bg-white rounded-md p-3 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs">
        {/* Monogram Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[8.5px] leading-tight text-slate-900 truncate" style={{ color: accentColor }}>
              {personalInfo.fullName}
            </div>
            <div className="text-[6.5px] text-slate-600 font-medium truncate">
              {personalInfo.jobTitle}
            </div>
          </div>
        </div>

        {/* Two-Column Body */}
        <div className="grid grid-cols-12 gap-2 mt-2 flex-1">
          {/* Left Column */}
          <div className="col-span-7 space-y-2">
            <div>
              <div className="font-bold text-[6.5px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                Profile
              </div>
              <p className="text-[6px] text-slate-600 line-clamp-2 leading-tight">
                {summary}
              </p>
            </div>
            <div>
              <div className="font-bold text-[6.5px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                Experience
              </div>
              <div className="space-y-1">
                {experiences.slice(0, 2).map((exp, i) => (
                  <div key={i} className="text-[6px]">
                    <div className="font-bold text-slate-800 truncate">{exp.role}</div>
                    <div className="text-slate-500 text-[5.5px]">{exp.company}</div>
                    <div className="text-slate-600 line-clamp-1 mt-0.5">• {exp.bullets[0] || 'Managed workflow'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-5 space-y-2 pl-1.5 border-l border-slate-200 text-[6px]">
            <div>
              <div className="font-bold text-[6.5px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                Contact
              </div>
              <div className="text-slate-500 text-[5.5px] truncate">{personalInfo.location}</div>
              <div className="text-slate-500 text-[5.5px] truncate">{personalInfo.email}</div>
            </div>
            <div>
              <div className="font-bold text-[6.5px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                Education
              </div>
              <div className="font-bold text-slate-800 text-[6px] truncate">{education[0]?.degree}</div>
              <div className="text-slate-500 text-[5.5px] truncate">{education[0]?.school}</div>
            </div>
            <div>
              <div className="font-bold text-[6.5px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                Key Skills
              </div>
              <div className="flex flex-wrap gap-1">
                {skills[0]?.skills.slice(0, 3).map((s, idx) => {
                  const name = typeof s === 'string' ? s : s.name;
                  return (
                    <span key={idx} className="px-1 py-0.2 bg-slate-100 rounded text-[5px] text-slate-700">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-[5.5px] text-slate-400">
          <span>ATS Verified</span>
          <span className="font-bold text-emerald-600">Single Page A4</span>
        </div>
      </div>
    );
  }

  // 2. Banner Header Archetype (Emily Carter)
  if (layoutArchetype === 'banner') {
    return (
      <div className="w-full h-full bg-white rounded-md flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-2.5 text-white" style={{ backgroundColor: accentColor }}>
          <div className="font-black text-[9px] uppercase tracking-tight truncate">{personalInfo.fullName}</div>
          <div className="text-[6px] opacity-90 truncate">{personalInfo.jobTitle}</div>
        </div>

        <div className="p-2.5 flex-1 space-y-2">
          <div>
            <div className="font-bold text-[6.5px] uppercase border-b pb-0.5 mb-1" style={{ borderColor: accentColor, color: accentColor }}>
              Summary
            </div>
            <p className="text-[6px] text-slate-600 line-clamp-2 leading-tight">{summary}</p>
          </div>
          <div>
            <div className="font-bold text-[6.5px] uppercase border-b pb-0.5 mb-1" style={{ borderColor: accentColor, color: accentColor }}>
              Experience
            </div>
            <div className="text-[6px]">
              <div className="font-bold text-slate-800">{experiences[0]?.role}</div>
              <div className="text-slate-500 text-[5.5px]">{experiences[0]?.company}</div>
              <div className="text-slate-600 line-clamp-1 mt-0.5">• {experiences[0]?.bullets[0]}</div>
            </div>
          </div>
        </div>

        <div className="px-2.5 pb-2 flex justify-between items-center text-[5.5px] text-slate-400 border-t border-slate-100 pt-1">
          <span>Executive ATS</span>
          <span className="font-bold" style={{ color: accentColor }}>Fit 1 Page</span>
        </div>
      </div>
    );
  }

  // 3. Tech & Code Monospace Archetype (Daniel Okafor / Lucas Silva)
  if (layoutArchetype === 'tech') {
    return (
      <div className="w-full h-full bg-white rounded-md p-2.5 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs font-mono">
        <div className="border-b pb-1.5" style={{ borderColor: accentColor }}>
          <div className="font-bold text-[8px] text-slate-900 tracking-tight truncate">
            &lt;{personalInfo.fullName} /&gt;
          </div>
          <div className="text-[6px] font-bold" style={{ color: accentColor }}>
            {personalInfo.jobTitle}
          </div>
        </div>

        <div className="space-y-1.5 my-1.5 flex-1">
          <div>
            <div className="text-[5.5px] text-slate-400 font-bold uppercase">// Stack</div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {skills[0]?.skills.slice(0, 4).map((s, idx) => (
                <span key={idx} className="px-1 py-0.2 bg-slate-100 rounded text-[5px] text-slate-700">
                  {typeof s === 'string' ? s : s.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[5.5px] text-slate-400 font-bold uppercase">// Experience</div>
            <div className="text-[6px] text-slate-800 font-bold truncate">{experiences[0]?.role}</div>
            <div className="text-[5.5px] text-slate-600 line-clamp-1">→ {experiences[0]?.bullets[0]}</div>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-[5.5px] text-slate-400">
          <span>GitHub Verified</span>
          <span className="font-bold text-blue-600">DevOps ATS</span>
        </div>
      </div>
    );
  }

  // 4. Sidebar Archetype (Elena Rostova / Maya Lin / Left Sidebar Pro)
  if (layoutArchetype === 'sidebar') {
    return (
      <div className="w-full h-full bg-white rounded-md flex text-[7px] select-none border border-slate-200 shadow-2xs overflow-hidden">
        {/* Left Mini Sidebar */}
        <div className="w-[34%] p-2 bg-slate-50 border-r border-slate-200 flex flex-col justify-between" style={{ borderRightColor: `${accentColor}30` }}>
          <div className="space-y-1.5">
            <div className="w-5 h-5 rounded-full mx-auto border" style={{ borderColor: accentColor, backgroundColor: `${accentColor}20` }} />
            <div>
              <div className="font-bold text-[5.5px] uppercase" style={{ color: accentColor }}>Skills</div>
              <div className="space-y-0.5 mt-0.5">
                {skills[0]?.skills.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: accentColor }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-bold text-[5.5px] uppercase" style={{ color: accentColor }}>Edu</div>
              <div className="text-[5px] text-slate-600 truncate">{education[0]?.degree}</div>
            </div>
          </div>
          <div className="text-[5px] text-slate-400">Sidebar Pro</div>
        </div>
        {/* Right Mini Body */}
        <div className="flex-1 p-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div>
              <div className="font-bold text-[7.5px] truncate" style={{ color: accentColor }}>{personalInfo.fullName}</div>
              <div className="text-[5.5px] text-slate-500 truncate">{personalInfo.jobTitle}</div>
            </div>
            <div>
              <div className="font-bold text-[5.5px] uppercase text-slate-700">Experience</div>
              <div className="text-[5.5px] text-slate-800 font-semibold truncate">{experiences[0]?.role}</div>
              <div className="text-[5px] text-slate-500 line-clamp-2">• {experiences[0]?.bullets[0]}</div>
            </div>
          </div>
          <div className="text-right text-[5px] font-bold text-emerald-600">1-Page Fit</div>
        </div>
      </div>
    );
  }

  // 5. Compact Two-Column Archetype (Chloe Bennett / Teresa Nguyen)
  if (layoutArchetype === 'compact') {
    return (
      <div className="w-full h-full bg-white rounded-md p-2 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs">
        <div className="border-b pb-1 flex justify-between items-baseline" style={{ borderColor: accentColor }}>
          <div className="font-bold text-[8px] uppercase truncate" style={{ color: accentColor }}>{personalInfo.fullName}</div>
          <div className="text-[5px] text-slate-500">{personalInfo.jobTitle}</div>
        </div>
        <div className="grid grid-cols-12 gap-1.5 my-1 flex-1">
          <div className="col-span-4 border-r border-slate-100 pr-1 space-y-1">
            <div className="font-bold text-[5.5px] uppercase" style={{ color: accentColor }}>Skills</div>
            <div className="space-y-0.5">
              {skills[0]?.skills.slice(0, 3).map((s, idx) => (
                <div key={idx} className="text-[5px] text-slate-600 truncate">{typeof s === 'string' ? s : s.name}</div>
              ))}
            </div>
          </div>
          <div className="col-span-8 space-y-1">
            <div className="font-bold text-[5.5px] uppercase" style={{ color: accentColor }}>Experience</div>
            <div className="text-[5.5px] font-bold text-slate-800 truncate">{experiences[0]?.role}</div>
            <div className="text-[5px] text-slate-500 line-clamp-2">• {experiences[0]?.bullets[0]}</div>
          </div>
        </div>
        <div className="pt-0.5 border-t border-slate-100 flex justify-between items-center text-[5px] text-slate-400">
          <span>High Density</span>
          <span className="font-bold text-emerald-600">35/65 Split</span>
        </div>
      </div>
    );
  }

  // 6. Academic & Fresher Archetype (Arjun Mehta / Ananya Deshmukh)
  if (layoutArchetype === 'academic') {
    return (
      <div className="w-full h-full bg-white rounded-md p-2 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs font-sans">
        <div className="text-center border-b pb-1" style={{ borderColor: accentColor }}>
          <div className="font-bold text-[8px] tracking-tight text-slate-900 uppercase truncate">{personalInfo.fullName}</div>
          <div className="text-[5.5px] font-semibold" style={{ color: accentColor }}>{personalInfo.jobTitle}</div>
        </div>
        <div className="space-y-1 my-1 flex-1">
          <div>
            <div className="font-bold text-[5.5px] uppercase border-b pb-0.2" style={{ color: accentColor, borderColor: `${accentColor}40` }}>Education First</div>
            <div className="text-[5.5px] font-bold text-slate-800 truncate">{education[0]?.degree}</div>
            <div className="text-[5px] text-slate-600 truncate">{education[0]?.school} • GPA: 3.9</div>
          </div>
          <div>
            <div className="font-bold text-[5.5px] uppercase border-b pb-0.2" style={{ color: accentColor, borderColor: `${accentColor}40` }}>Capstone Projects</div>
            <div className="text-[5.5px] text-slate-800 font-semibold truncate">{experiences[0]?.role || 'System Architecture'}</div>
            <div className="text-[5px] text-slate-500 line-clamp-1">• Distributed algorithms & data pipeline</div>
          </div>
        </div>
        <div className="pt-0.5 border-t border-slate-100 flex justify-between items-center text-[5px] text-slate-400">
          <span>Fresher ATS</span>
          <span className="font-bold text-blue-600">Academic Pick</span>
        </div>
      </div>
    );
  }

  // 7. Executive Serif Archetype (Marcus Vance / Sarah Jenkins)
  if (layoutArchetype === 'executive') {
    return (
      <div className="w-full h-full bg-white rounded-md p-2 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs font-serif">
        <div className="text-center border-b pb-1 border-slate-300">
          <div className="font-bold text-[8.5px] uppercase tracking-wide text-slate-900 truncate">{personalInfo.fullName}</div>
          <div className="text-[5.5px] uppercase tracking-widest text-slate-500 font-sans">{personalInfo.jobTitle}</div>
        </div>
        <div className="space-y-1.5 my-1 flex-1 font-sans">
          <div>
            <div className="font-bold text-[5.5px] uppercase tracking-wider text-center text-slate-700 border-b pb-0.2 border-slate-200">Executive Summary</div>
            <p className="text-[5.2px] text-slate-600 line-clamp-2 text-justify leading-tight">{summary}</p>
          </div>
          <div>
            <div className="font-bold text-[5.5px] uppercase tracking-wider text-center text-slate-700 border-b pb-0.2 border-slate-200">Experience</div>
            <div className="text-[5.5px] font-bold text-slate-900 truncate">{experiences[0]?.role}</div>
            <div className="text-[5px] text-slate-600 line-clamp-1">• {experiences[0]?.bullets[0]}</div>
          </div>
        </div>
        <div className="pt-0.5 border-t border-slate-100 flex justify-between items-center text-[5px] text-slate-400 font-sans">
          <span>Board Level</span>
          <span className="font-bold text-slate-900">Serif Elegance</span>
        </div>
      </div>
    );
  }

  // 8. Default Clean Classic & Modern Single Column
  return (
    <div className="w-full h-full bg-white rounded-md p-2.5 flex flex-col justify-between text-[7px] select-none border border-slate-200 shadow-2xs font-sans">
      <div className="border-b-2 pb-1.5" style={{ borderColor: accentColor }}>
        <div className="font-bold text-[8.5px] tracking-tight uppercase truncate" style={{ color: accentColor }}>
          {personalInfo.fullName}
        </div>
        <div className="text-[6px] text-slate-600 font-semibold truncate">{personalInfo.jobTitle}</div>
        <div className="text-[5px] text-slate-400 truncate mt-0.5">
          {personalInfo.email} • {personalInfo.location}
        </div>
      </div>

      <div className="space-y-1.5 my-1.5 flex-1">
        <div>
          <div className="font-bold text-[6px] uppercase border-b pb-0.2 mb-0.5" style={{ borderColor: accentColor, color: accentColor }}>
            Summary
          </div>
          <p className="text-[5.8px] text-slate-600 line-clamp-2 leading-tight">{summary}</p>
        </div>
        <div>
          <div className="font-bold text-[6px] uppercase border-b pb-0.2 mb-0.5" style={{ borderColor: accentColor, color: accentColor }}>
            Experience
          </div>
          <div className="text-[6px]">
            <div className="font-bold text-slate-800 truncate">{experiences[0]?.role}</div>
            <div className="text-slate-600 line-clamp-1">• {experiences[0]?.bullets[0]}</div>
          </div>
        </div>
        <div>
          <div className="font-bold text-[6px] uppercase border-b pb-0.2 mb-0.5" style={{ borderColor: accentColor, color: accentColor }}>
            Skills
          </div>
          <div className="flex flex-wrap gap-1">
            {skills[0]?.skills.slice(0, 3).map((s, idx) => (
              <span key={idx} className="px-1 py-0.2 bg-slate-100 rounded text-[5px] text-slate-700">
                {typeof s === 'string' ? s : s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-[5.5px] text-slate-400">
        <span>ATS 99%</span>
        <span className="font-bold text-emerald-600">Fits 1 Page ✓</span>
      </div>
    </div>
  );
};

export const MiniTemplatePreview: React.FC<MiniTemplatePreviewProps> = ({ template }) => (
  <div
    className="template-presentation h-full"
    data-presentation-style={template.presentationStyle || 'standard'}
  >
    <MiniTemplateLayout template={template} />
  </div>
);
