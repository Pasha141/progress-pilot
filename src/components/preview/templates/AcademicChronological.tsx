/**
 * @file src/components/preview/templates/AcademicChronological.tsx
 * Template 7: Academic / Chronological.
 * Puts Education and Projects at the top, perfect for CSE freshers and researchers.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const AcademicChronological: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-slate-900 font-sans text-xs leading-relaxed">
      {/* Centered Academic Header */}
      <header className="text-center pb-2.5 border-b border-slate-400">
        <h1 className="text-2xl font-bold tracking-normal text-slate-950">
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <p className="text-xs font-semibold text-slate-700 mt-0.5">
          {personalInfo.jobTitle || 'Computer Science Graduate'}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-slate-600">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo.email && <span>| {personalInfo.email}</span>}
          {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>| {personalInfo.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1">
            Academic Objective & Summary
          </h2>
          <p className="text-slate-700 text-justify px-1">{summary}</p>
        </section>
      )}

      {/* Education - High Priority for Freshers */}
      {education.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1.5">
            Education & Academic Credentials
          </h2>
          <div className="space-y-2 px-1">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-950">{edu.school}</span>
                  <div className="text-slate-800">
                    {edu.degree} in {edu.fieldOfStudy}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {edu.gpa && <span>Cumulative GPA / Grade: {edu.gpa}</span>}
                    {edu.honors && <span> • Honors: {edu.honors}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 text-right">
                  <span>{edu.startDate} – {edu.endDate}</span>
                  {edu.location && <div>{edu.location}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1.5">
            Technical & Research Skills
          </h2>
          <div className="space-y-1 px-1">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-semibold text-slate-900 min-w-[140px]">{cat.categoryName}:</span>
                <span className="text-slate-800">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Capstone & Academic Projects */}
      {projects.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1.5">
            Capstone & Technical Projects
          </h2>
          <div className="space-y-2.5 px-1">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-950">{proj.title}</span>
                    {proj.technologies.length > 0 && (
                      <span className="text-slate-600 text-[11px]">
                        {' '}
                        [Technologies: {proj.technologies.join(', ')}]
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

      {/* Experience / Internships */}
      {experiences.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1.5">
            Internships & Work History
          </h2>
          <div className="space-y-2 px-1">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-950">{exp.role}</span>
                    <span className="text-slate-700">, {exp.company}</span>
                  </div>
                  <span className="text-[11px] text-slate-600">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700">
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

      {/* Certifications & Awards */}
      {certifications.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 mb-1">
            Certifications & Co-Curricular Awards
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 px-1">
            {certifications.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.issuer} ({c.issueDate})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
