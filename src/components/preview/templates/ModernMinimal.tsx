/**
 * @file src/components/preview/templates/ModernMinimal.tsx
 * Template 2: Modern Minimal.
 * Clean, readable, subtle blue accents and modern badge highlights.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const ModernMinimal: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-800 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="pb-3 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-sm font-semibold text-blue-600 mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
          </div>
          <div className="text-[11px] text-slate-600 sm:text-right space-y-0.5">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
          {personalInfo.website && <span>Portfolio: {personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Profile Summary
          </h2>
          <p className="text-slate-600 leading-normal pl-4">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Work Experience
          </h2>
          <div className="space-y-3 pl-4 border-l-2 border-slate-100 ml-1">
            {experiences.map((exp) => (
              <div key={exp.id} className="relative">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-slate-900 text-[13px]">{exp.role}</h3>
                    <div className="text-blue-700 font-medium text-xs">{exp.company}</div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 mt-1 space-y-1 text-slate-600">
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
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Featured Projects
          </h2>
          <div className="space-y-2.5 pl-4 border-l-2 border-slate-100 ml-1">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-slate-900">{proj.title}</div>
                  <div className="text-[11px] text-slate-500">{proj.githubUrl || proj.liveUrl || ''}</div>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-1">
                    {proj.technologies.map((t) => (
                      <span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 mt-1 space-y-0.5 text-slate-600">
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
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Core Competencies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
            {skills.map((cat) => (
              <div key={cat.id} className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-slate-900 block text-[11px]">{cat.categoryName}</span>
                <span className="text-slate-600 text-[11px]">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Education
          </h2>
          <div className="space-y-2 pl-4">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <div className="font-bold text-slate-900">{edu.school}</div>
                  <div className="text-slate-600">
                    {edu.degree} in {edu.fieldOfStudy}
                    {edu.gpa && <span className="font-semibold text-slate-700"> (GPA: {edu.gpa})</span>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {edu.startDate} - {edu.endDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Certifications
          </h2>
          <div className="flex flex-wrap gap-2 pl-4">
            {certifications.map((c) => (
              <span key={c.id} className="text-slate-700 text-[11px]">
                <strong className="text-slate-900">{c.name}</strong> ({c.issuer})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
