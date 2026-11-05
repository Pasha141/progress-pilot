/**
 * @file src/components/preview/templates/TechClean.tsx
 * Template 3: Tech Clean.
 * Tailored for Computer Science graduates, showcasing tech stack, GitHub links, and code-aligned layout.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const TechClean: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-900 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="border-b-2 border-slate-800 pb-2.5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 font-mono">
              &lt;{personalInfo.fullName || 'Rahul Sharma'} /&gt;
            </h1>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600 font-mono">
            {personalInfo.location && <div>{personalInfo.location}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.email && <div className="text-slate-800 font-medium">{personalInfo.email}</div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
          {personalInfo.github && <span>git: {personalInfo.github}</span>}
          {personalInfo.linkedin && <span>in: {personalInfo.linkedin}</span>}
          {personalInfo.website && <span>web: {personalInfo.website}</span>}
        </div>
      </header>

      {/* Technical Skills upfront - standard for SWE/CSE profiles */}
      {skills.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // Technical Stack
          </h2>
          <div className="space-y-1 text-[11px]">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-mono font-bold text-slate-900 min-w-[130px]">
                  {cat.categoryName}:
                </span>
                <span className="text-slate-800 font-mono">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // About
          </h2>
          <p className="text-slate-700 text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // Experience
          </h2>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-mono">
                  <div>
                    <span className="font-bold text-slate-950">{exp.role}</span>
                    <span className="text-slate-700"> @ {exp.company}</span>
                  </div>
                  <span className="text-[11px] text-slate-600">
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
        <section className="mt-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // Projects & Open Source
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-mono">
                  <div>
                    <span className="font-bold text-slate-950">{proj.title}</span>
                    {proj.technologies.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold ml-2">
                        [{proj.technologies.join(', ')}]
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {proj.githubUrl || proj.liveUrl}
                  </div>
                </div>
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

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline font-mono">
                <div>
                  <span className="font-bold text-slate-950">{edu.school}</span>
                  <div className="text-slate-700">
                    {edu.degree} - {edu.fieldOfStudy}
                    {edu.gpa && <span> | GPA: {edu.gpa}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600">
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
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            // Certifications
          </h2>
          <div className="flex flex-wrap gap-3 font-mono text-[11px] text-slate-700">
            {certifications.map((c) => (
              <span key={c.id}>
                * {c.name} ({c.issuer})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
