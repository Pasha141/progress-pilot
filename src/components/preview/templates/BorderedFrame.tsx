/**
 * @file src/components/preview/templates/BorderedFrame.tsx
 * Template 14: Bordered Frame.
 * Symmetrical framed perimeter border with sophisticated monogram badge and timeless typography.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const BorderedFrame: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CV';

  return (
    <div className="border-2 border-slate-800 p-5 min-h-[265mm] text-slate-900 font-serif text-xs leading-relaxed">
      {/* Centered Monogram Header */}
      <header className="text-center pb-3 border-b border-slate-400">
        <div className="flex justify-center mb-1.5">
          {showPhoto ? (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-xs tracking-wider text-slate-800">
              {initials}
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase text-slate-900">
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <p className="text-xs font-medium text-slate-600 italic mt-0.5 font-sans">
          {personalInfo.jobTitle || 'Software Engineer'}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-0.5 mt-2 text-[11px] text-slate-600 font-sans">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>· {personalInfo.phone}</span>}
          {personalInfo.location && <span>· {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>· {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>· {personalInfo.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-sans">
            Executive Summary
          </h2>
          <p className="text-slate-700 text-justify italic">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 text-center font-sans">
            Professional Experience
          </h2>
          <div className="space-y-3 font-sans">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs">
                    {exp.role} <span className="font-normal italic text-slate-700">— {exp.company}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-xs">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 text-center font-sans">
            Projects & Technical Works
          </h2>
          <div className="space-y-2 font-sans">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[10px] text-slate-500">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-slate-600 italic">[{proj.technologies.join(', ')}]</div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700 text-xs">
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

      {/* Skills & Education */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3.5 font-sans">
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center">
              Areas of Expertise
            </h2>
            <div className="space-y-1 text-xs">
              {skills.map((cat) => (
                <div key={cat.id}>
                  <strong className="text-slate-900">{cat.categoryName}: </strong>
                  <span className="text-slate-700">{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center">
              Academic Background
            </h2>
            <div className="space-y-1.5 text-xs">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-slate-900">{edu.school}</div>
                  <div className="text-slate-700">{edu.degree} in {edu.fieldOfStudy}</div>
                  <div className="text-[11px] text-slate-500">{edu.startDate} – {edu.endDate} {edu.gpa && `| GPA: ${edu.gpa}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
