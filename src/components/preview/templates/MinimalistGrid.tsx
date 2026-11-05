/**
 * @file src/components/preview/templates/MinimalistGrid.tsx
 * Template 10: Minimalist Grid.
 * Sharp architectural lines, boxed section boundaries, structured data presentation.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const MinimalistGrid: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-900 font-sans text-xs border border-slate-300">
      {/* Header Grid Box */}
      <header className="p-4 border-b border-slate-300 flex items-center justify-between gap-4 bg-slate-50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
            {personalInfo.jobTitle || 'Software Engineer'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.github && <span>git: {personalInfo.github}</span>}
          </div>
        </div>
        {showPhoto && (
          <img
            src={personalInfo.photoUrl}
            alt={personalInfo.fullName}
            className="w-16 h-16 object-cover border border-slate-400"
          />
        )}
      </header>

      {/* Summary Box */}
      {summary && (
        <div className="p-3 border-b border-slate-300 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            01. Professional Summary
          </span>
          <p className="text-slate-700 leading-relaxed text-justify">{summary}</p>
        </div>
      )}

      {/* Experience Box */}
      {experiences.length > 0 && (
        <div className="p-3 border-b border-slate-300 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
            02. Experience
          </span>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">
                    {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
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
        </div>
      )}

      {/* Projects Box */}
      {projects.length > 0 && (
        <div className="p-3 border-b border-slate-300 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
            03. Technical Projects
          </span>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{proj.liveUrl || proj.githubUrl}</span>
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
        </div>
      )}

      {/* Bottom 2-Column Grid Box for Skills & Education */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-white">
        {skills.length > 0 && (
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
              04. Skills
            </span>
            <div className="space-y-1">
              {skills.map((cat) => (
                <div key={cat.id}>
                  <strong className="text-slate-900 text-[11px]">{cat.categoryName}: </strong>
                  <span className="text-slate-600 text-[11px]">{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
              05. Education
            </span>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-slate-900">{edu.school}</div>
                  <div className="text-slate-700 text-[11px]">{edu.degree} in {edu.fieldOfStudy}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{edu.startDate} - {edu.endDate} {edu.gpa && `| GPA: ${edu.gpa}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
