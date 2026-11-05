/**
 * @file src/components/preview/templates/MidnightBold.tsx
 * Template 17: Midnight Bold.
 * High-contrast dark navy accents, punchy section headers, bold professional aesthetic.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const MidnightBold: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-900 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="pb-3 border-b-4 border-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-xs font-bold text-blue-700 tracking-wider uppercase mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600 font-medium">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.location && <span>• {personalInfo.location}</span>}
              {personalInfo.github && <span>• {personalInfo.github}</span>}
              {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            </div>
          </div>

          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 rounded-sm object-cover border-2 border-slate-900 shadow-xs"
            />
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 mb-1.5 inline-block">
            Professional Profile
          </h2>
          <p className="text-slate-700 text-justify font-medium">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 mb-2 inline-block">
            Experience History
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-slate-950 text-xs">{exp.role}</span>
                    <span className="text-blue-700 font-bold"> | {exp.company}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
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
          <h2 className="text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 mb-2 inline-block">
            Engineered Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-950">{proj.title}</span>
                  <span className="text-[10px] text-blue-700 font-mono">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-mono">[{proj.technologies.join(', ')}]</div>
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
          <h2 className="text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 mb-1.5 inline-block">
            Skillsets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            {skills.map((cat) => (
              <div key={cat.id}>
                <strong className="text-slate-950">{cat.categoryName}: </strong>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 mb-1.5 inline-block">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-baseline text-xs">
              <div>
                <span className="font-bold text-slate-950">{edu.school}</span>
                <span className="text-slate-700"> — {edu.degree}, {edu.fieldOfStudy}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">{edu.startDate} - {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
