/**
 * @file src/components/preview/templates/CondensedOnePage.tsx
 * Template 18: Condensed One-Pager.
 * Ultra-tight line spacing and compact margins specifically designed to fit 4+ years of experience onto a single page.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const CondensedOnePage: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-900 font-sans text-[11px] leading-snug">
      {/* Header */}
      <header className="pb-1.5 border-b border-slate-400">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-950">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-[11px] font-semibold text-slate-700">{personalInfo.jobTitle}</p>
          </div>
          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-12 h-12 rounded-full object-cover border border-slate-400"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo.location && <span>| {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>| {personalInfo.github}</span>}
          {personalInfo.website && <span>| {personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-1.5">
          <p className="text-slate-700 text-justify text-[10.5px]">{summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mt-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.2 mb-0.5">
            Technical Skills
          </h2>
          <div className="space-y-0.5 text-[10.5px]">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-bold min-w-[120px] text-slate-900">{cat.categoryName}:</span>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.2 mb-1">
            Experience
          </h2>
          <div className="space-y-1.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">
                    {exp.role}, <span className="font-medium text-slate-700">{exp.company}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 space-y-0.2 text-slate-700 text-[10.5px]">
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
        <section className="mt-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.2 mb-1">
            Projects
          </h2>
          <div className="space-y-1.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">
                    {proj.title}
                    {proj.technologies.length > 0 && (
                      <span className="font-normal text-slate-500 text-[10px]"> ({proj.technologies.join(', ')})</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 space-y-0.2 text-slate-700 text-[10.5px]">
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
        <section className="mt-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.2 mb-0.5">
            Education
          </h2>
          <div className="space-y-0.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[10.5px]">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span> — {edu.degree} in {edu.fieldOfStudy}
                  {edu.gpa && <span> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-[10px] text-slate-500">{edu.startDate} – {edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
