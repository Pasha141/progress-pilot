/**
 * @file src/components/preview/templates/EmeraldCorporate.tsx
 * Template 16: Emerald Corporate.
 * Deep emerald green branding, high-trust corporate layout favored in fintech & management.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const EmeraldCorporate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-800 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="pb-3 border-b-2 border-emerald-700">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950 uppercase">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              {personalInfo.jobTitle || 'Software Engineer'}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.location && <span>• {personalInfo.location}</span>}
              {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
              {personalInfo.github && <span>• {personalInfo.github}</span>}
            </div>
          </div>

          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 rounded-lg object-cover border-2 border-emerald-600"
            />
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-1">
            Executive Summary
          </h2>
          <p className="text-slate-700 text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-2">
            Work Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{exp.role}</span>
                    <span className="text-emerald-800 font-medium"> — {exp.company}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {exp.startDate} – {exp.endDate}
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-2">
            Key Technical Initiatives
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[10px] text-emerald-700">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-slate-500 italic">[{proj.technologies.join(', ')}]</div>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-1.5">
            Core Competencies
          </h2>
          <div className="space-y-1">
            {skills.map((cat) => (
              <div key={cat.id} className="flex text-xs">
                <span className="font-bold text-emerald-950 min-w-[140px]">{cat.categoryName}:</span>
                <span className="text-slate-700 flex-1">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span>
                  <span className="text-slate-700"> — {edu.degree}, {edu.fieldOfStudy}</span>
                </div>
                <span className="text-[11px] text-slate-500">{edu.startDate} – {edu.endDate} {edu.gpa && `| GPA: ${edu.gpa}`}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
