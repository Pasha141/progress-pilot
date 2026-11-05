/**
 * @file src/components/preview/templates/CompactTwoColumn.tsx
 * Template 5: Compact Two-Column.
 * Information-dense 30/70 split layout maximizing single-page usage.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const CompactTwoColumn: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-900 font-sans text-xs leading-normal">
      {/* Top Banner Header */}
      <header className="border-b border-slate-300 pb-2.5 mb-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <p className="text-xs font-semibold text-indigo-700 mt-0.5">
          {personalInfo.jobTitle || 'Software Engineer'}
        </p>
      </header>

      {/* 2-Column Split */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column (4 cols) */}
        <aside className="col-span-4 border-r border-slate-200 pr-3 space-y-3.5">
          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
              Contact
            </h3>
            <div className="space-y-1 text-[11px] text-slate-600 break-words">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedin && <div>in: {personalInfo.linkedin}</div>}
              {personalInfo.github && <div>git: {personalInfo.github}</div>}
              {personalInfo.website && <div>web: {personalInfo.website}</div>}
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
                Skills
              </h3>
              <div className="space-y-2">
                {skills.map((cat) => (
                  <div key={cat.id}>
                    <span className="font-bold text-[11px] text-slate-800 block">{cat.categoryName}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {cat.skills.map((s, sIdx) => {
                        const name = typeof s === 'string' ? s : s.name;
                        return (
                          <span key={sIdx} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-medium">
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
                Education
              </h3>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="text-[11px]">
                    <div className="font-bold text-slate-900">{edu.school}</div>
                    <div className="text-slate-700">{edu.degree}</div>
                    <div className="text-slate-500">{edu.fieldOfStudy}</div>
                    <div className="text-slate-500 text-[10px]">
                      {edu.startDate} - {edu.endDate}
                      {edu.gpa && <span> | GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
                Certifications
              </h3>
              <div className="space-y-1 text-[11px] text-slate-700">
                {certifications.map((c) => (
                  <div key={c.id}>
                    <strong className="text-slate-900">{c.name}</strong>
                    <div className="text-[10px] text-slate-500">{c.issuer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column (8 cols) */}
        <main className="col-span-8 space-y-3.5">
          {/* Summary */}
          {summary && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1">
                Professional Profile
              </h3>
              <p className="text-slate-700 text-justify text-xs leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
                Experience
              </h3>
              <div className="space-y-2.5">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-xs">
                        {exp.role} <span className="font-normal text-slate-600">at {exp.company}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-3.5 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
                        {exp.bullets.filter(Boolean).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
                Projects
              </h3>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{proj.title}</span>
                        {proj.technologies.length > 0 && (
                          <span className="text-[10px] text-indigo-600 font-medium ml-1">
                            [{proj.technologies.join(', ')}]
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{proj.liveUrl || proj.githubUrl}</span>
                    </div>
                    {proj.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-3.5 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
                        {proj.bullets.filter(Boolean).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
