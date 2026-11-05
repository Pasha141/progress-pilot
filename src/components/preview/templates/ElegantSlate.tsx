/**
 * @file src/components/preview/templates/ElegantSlate.tsx
 * Template 6: Elegant Slate.
 * Distinctive dark slate top header banner, clean structured section cards.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const ElegantSlate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-800 font-sans text-xs leading-relaxed">
      {/* Dark Slate Header Banner */}
      <header className="bg-slate-900 text-white -mx-6 -mt-6 p-5 mb-4 rounded-t-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-xs font-medium text-slate-300 mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
          </div>
          <div className="text-[11px] text-slate-300 sm:text-right space-y-0.5">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-2.5 pt-2 border-t border-slate-700/80 text-[11px] text-slate-300">
          {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
          {personalInfo.website && <span>Portfolio: {personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
            About Me
          </h2>
          <p className="text-slate-700 leading-normal">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{exp.role}</span>
                    <span className="text-slate-600 font-medium"> • {exp.company}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
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
        <section className="mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
            Selected Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    {proj.technologies.length > 0 && (
                      <span className="text-slate-500 text-[11px] ml-1.5">
                        ({proj.technologies.join(', ')})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{proj.liveUrl || proj.githubUrl}</span>
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

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
            Skills & Competencies
          </h2>
          <div className="space-y-1">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-bold text-slate-900 min-w-[130px]">{cat.categoryName}:</span>
                <span className="text-slate-700 flex-1">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span>
                  <div className="text-slate-700">
                    {edu.degree} in {edu.fieldOfStudy}
                    {edu.gpa && <span> • GPA: {edu.gpa}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  {edu.startDate} - {edu.endDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1">
            Certifications
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-700">
            {certifications.map((c) => (
              <span key={c.id}>
                • <strong>{c.name}</strong> - {c.issuer}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
