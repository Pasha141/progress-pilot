/**
 * @file src/components/preview/templates/ExecutiveSerif.tsx
 * Template 4: Executive Serif.
 * Formal serif typography (Georgia style), classic luxury corporate aesthetic.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const ExecutiveSerif: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-900 font-serif text-xs leading-relaxed">
      {/* Header */}
      <header className="text-center pb-3 border-b-2 border-stone-800">
        <h1 className="text-2xl font-bold tracking-wider uppercase text-stone-900">
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-xs font-semibold italic text-stone-600 tracking-wide mt-0.5">
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 mt-1.5 text-[11px] text-stone-600 font-sans">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && <span>· {personalInfo.phone}</span>}
          {personalInfo.email && <span>· {personalInfo.email}</span>}
          {personalInfo.linkedin && <span>· {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>· {personalInfo.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-1.5 text-center">
            Executive Summary
          </h2>
          <p className="text-stone-700 text-justify italic">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-2 text-center">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-stone-900">{exp.role}</span>
                    <span className="italic text-stone-700"> — {exp.company}</span>
                  </div>
                  <div className="text-[11px] text-stone-600 font-sans text-right">
                    <span>{exp.startDate} – {exp.endDate}</span>
                    {exp.location && <span> | {exp.location}</span>}
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-stone-700 font-sans text-xs">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-2 text-center">
            Key Initiatives & Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-stone-900">{proj.title}</span>
                    {proj.technologies.length > 0 && (
                      <span className="font-sans text-[11px] text-stone-600 italic">
                        {' '}
                        ({proj.technologies.join(', ')})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 font-sans">{proj.githubUrl || proj.liveUrl}</span>
                </div>
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-stone-700 font-sans text-xs">
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
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-2 text-center">
            Education & Academic Credentials
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-stone-900">{edu.school}</span>
                  <div className="text-stone-700 text-xs">
                    {edu.degree}, {edu.fieldOfStudy}
                    {edu.gpa && <span className="font-sans"> (GPA: {edu.gpa})</span>}
                  </div>
                </div>
                <div className="text-[11px] text-stone-600 font-sans text-right">
                  {edu.startDate} – {edu.endDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-1.5 text-center">
            Areas of Expertise
          </h2>
          <div className="space-y-1 font-sans text-xs">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-semibold text-stone-900 min-w-[140px]">{cat.categoryName}:</span>
                <span className="text-stone-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-stone-300 pb-0.5 mb-1.5 text-center">
            Honors & Certifications
          </h2>
          <div className="text-center font-sans text-xs text-stone-700 space-x-2">
            {certifications.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ' • '}
                <strong>{c.name}</strong> ({c.issuer})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
