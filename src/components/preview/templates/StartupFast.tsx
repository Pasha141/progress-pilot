/**
 * @file src/components/preview/templates/StartupFast.tsx
 * Template 12: Startup Fast.
 * Silicon valley metric-driven resume with energetic amber accents and impact highlights.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const StartupFast: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-900 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="flex justify-between items-start gap-4 pb-3 border-b-2 border-amber-500">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">
            Fast-Growth Builder
          </span>
          <h1 className="text-2xl font-black text-slate-950 mt-1">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            {personalInfo.jobTitle || 'Product-Focused Software Engineer'}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.github && <span className="font-mono text-amber-700">github/{personalInfo.github.split('/').pop()}</span>}
            {personalInfo.website && <span className="font-mono text-amber-700">{personalInfo.website}</span>}
          </div>
        </div>

        {showPhoto && (
          <img
            src={personalInfo.photoUrl}
            alt={personalInfo.fullName}
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-400"
          />
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <p className="text-slate-700 text-justify font-medium">{summary}</p>
        </section>
      )}

      {/* Experience - Impact First */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
            Track Record & Impact
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-slate-950 text-xs">{exp.role}</span>
                    <span className="font-semibold text-amber-600"> @ {exp.company}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700">
                    {exp.bullets.filter(Boolean).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
            Shipped Products & Code
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[11px] font-mono text-amber-600">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] font-mono text-slate-500">
                    Built with: {proj.technologies.join(', ')}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700">
                    {proj.bullets.filter(Boolean).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1.5">
            Core Toolkit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {skills.map((cat) => (
              <div key={cat.id} className="text-[11px]">
                <strong className="text-slate-900">{cat.categoryName}: </strong>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1.5">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-baseline text-xs">
              <div>
                <span className="font-bold text-slate-900">{edu.school}</span>
                <span className="text-slate-600"> — {edu.degree}, {edu.fieldOfStudy}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{edu.startDate} - {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
