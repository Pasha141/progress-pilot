/**
 * @file src/components/preview/templates/SwissInternational.tsx
 * Template 20: Swiss International.
 * Bold neo-grotesque typography, crisp asymmetric grid, high clarity and visual rhythm.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const SwissInternational: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-black font-sans text-xs leading-normal">
      {/* Heavy Swiss Header */}
      <header className="pb-3 border-b-8 border-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-black">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-sm font-bold tracking-tight text-red-600 mt-1 uppercase">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
          </div>

          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 object-cover grayscale contrast-150 border-2 border-black flex-shrink-0"
            />
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-black text-[10px] font-bold uppercase tracking-wider">
          <div>
            <span className="text-neutral-500 block">Mail:</span>
            <span className="text-black break-words">{personalInfo.email}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Tel:</span>
            <span className="text-black">{personalInfo.phone}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Loc:</span>
            <span className="text-black">{personalInfo.location}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Git:</span>
            <span className="text-black">{personalInfo.github}</span>
          </div>
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-0.5">
            01 / Statement
          </span>
          <p className="text-neutral-900 font-medium text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
            02 / Work
          </span>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="border-t border-neutral-300 pt-1.5">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-black text-xs uppercase">{exp.role}</span>
                    <span className="font-medium text-neutral-700"> — {exp.company}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-neutral-600">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-neutral-800">
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
        <section className="mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
            03 / Projects
          </span>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="border-t border-neutral-300 pt-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black uppercase">{proj.title}</span>
                  <span className="text-[10px] font-mono text-neutral-500">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] font-bold text-neutral-600 mt-0.5">
                    [{proj.technologies.join(' / ')}]
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-neutral-800">
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
        <section className="mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
            04 / Skills
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-neutral-300 pt-1.5">
            {skills.map((cat) => (
              <div key={cat.id}>
                <strong className="text-black uppercase text-[11px] block">{cat.categoryName}</strong>
                <span className="text-neutral-700 text-[11px]">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
            05 / Education
          </span>
          <div className="border-t border-neutral-300 pt-1.5 space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-black text-black">{edu.school}</span>
                  <span className="text-neutral-700"> — {edu.degree}, {edu.fieldOfStudy}</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-600">{edu.startDate} – {edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
