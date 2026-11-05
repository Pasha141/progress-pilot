/**
 * @file src/components/preview/templates/CreativePortfolio.tsx
 * Template 8: Creative Portfolio.
 * Modern dynamic layout with accent pills, colored left borders, and prominent avatar.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const CreativePortfolio: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-800 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b-2 border-violet-500">
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 uppercase tracking-widest mb-1">
            Portfolio Resume
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-sm font-semibold text-violet-600 mt-0.5">
            {personalInfo.jobTitle || 'Full Stack Engineer'}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.github && <span>• {personalInfo.github}</span>}
            {personalInfo.website && <span>• {personalInfo.website}</span>}
          </div>
        </div>

        {showPhoto && (
          <img
            src={personalInfo.photoUrl}
            alt={personalInfo.fullName}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-violet-100 shadow-md flex-shrink-0"
          />
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3.5 bg-violet-50/60 p-3 rounded-xl border border-violet-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-1">
            About Me
          </h2>
          <p className="text-slate-700">{summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-violet-600 rounded-sm"></span>
            Tech Stack & Tools
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.flatMap((cat) =>
              cat.skills.map((s, idx) => {
                const name = typeof s === 'string' ? s : s.name;
                return (
                  <span
                    key={`${cat.id}-${idx}`}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {name}
                  </span>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-violet-600 rounded-sm"></span>
            Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="pl-3 border-l-2 border-violet-300">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{exp.role}</span>
                    <span className="text-violet-700 font-medium"> @ {exp.company}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 mt-1 space-y-0.5 text-slate-700">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-violet-600 rounded-sm"></span>
            Portfolio Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[11px] text-violet-600">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Stack: {proj.technologies.join(' • ')}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 mt-1 space-y-0.5 text-slate-700">
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

      {/* Education & Certs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-violet-600 rounded-sm"></span>
              Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="text-xs">
                <div className="font-bold text-slate-900">{edu.school}</div>
                <div className="text-slate-700">{edu.degree} - {edu.fieldOfStudy}</div>
                <div className="text-[11px] text-slate-500">{edu.startDate} - {edu.endDate} {edu.gpa && `• GPA: ${edu.gpa}`}</div>
              </div>
            ))}
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-violet-600 rounded-sm"></span>
              Credentials
            </h2>
            <div className="space-y-1 text-xs">
              {certifications.map((c) => (
                <div key={c.id}>
                  <strong className="text-slate-900">{c.name}</strong>
                  <div className="text-[11px] text-slate-500">{c.issuer}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
