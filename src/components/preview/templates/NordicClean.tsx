/**
 * @file src/components/preview/templates/NordicClean.tsx
 * Template 9: Nordic Clean.
 * Scandinavian aesthetic, generous whitespace, calm typography, and refined minimalism.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const NordicClean: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-stone-800 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="pb-4 border-b border-stone-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-stone-900 uppercase">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-xs font-medium tracking-wider text-teal-700 uppercase mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-stone-500">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>· {personalInfo.phone}</span>}
              {personalInfo.location && <span>· {personalInfo.location}</span>}
              {personalInfo.github && <span>· {personalInfo.github}</span>}
              {personalInfo.linkedin && <span>· {personalInfo.linkedin}</span>}
            </div>
          </div>
          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 rounded-full object-cover grayscale contrast-125 border border-stone-300"
            />
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-800 mb-1">
            Overview
          </h2>
          <p className="text-stone-600 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-800 mb-2">
            Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-stone-900">{exp.role}</span>
                    <span className="text-stone-600">, {exp.company}</span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-stone-600">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-800 mb-2">
            Selected Work
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-stone-900">{proj.title}</span>
                  <span className="text-[10px] text-stone-400">{proj.githubUrl || proj.liveUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-teal-700 italic">
                    {proj.technologies.join(', ')}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-stone-600">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-800 mb-1.5">
            Competencies
          </h2>
          <div className="space-y-1 text-stone-600">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-medium text-stone-800 min-w-[130px]">{cat.categoryName}:</span>
                <span className="flex-1">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-800 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-stone-900">{edu.school}</span>
                  <span className="text-stone-600"> — {edu.degree}, {edu.fieldOfStudy}</span>
                </div>
                <span className="text-[11px] text-stone-400">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
