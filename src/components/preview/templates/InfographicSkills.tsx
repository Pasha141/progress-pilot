/**
 * @file src/components/preview/templates/InfographicSkills.tsx
 * Template 15: Infographic Skills.
 * Skills-first resume with clean level badges, modern cyan/blue accents, and photo layout.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const InfographicSkills: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-800 font-sans text-xs leading-relaxed">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 pb-3 border-b-2 border-cyan-600">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-xs font-bold text-cyan-700 tracking-wide mt-0.5">
            {personalInfo.jobTitle || 'Software Engineer'}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600">
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
            className="w-18 h-18 rounded-full object-cover border-2 border-cyan-500 shadow-sm"
          />
        )}
      </header>

      {/* Skills Showcase Bar (Infographic style) */}
      {skills.length > 0 && (
        <section className="mt-3 bg-cyan-50/50 p-2.5 rounded-lg border border-cyan-200">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-900 mb-1.5">
            Core Technical Capabilities
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((cat) => (
              <div key={cat.id} className="text-[11px]">
                <span className="font-bold text-slate-800 block text-[10px] text-cyan-800">{cat.categoryName}</span>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
            Summary
          </h2>
          <p className="text-slate-700 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
            Experience History
          </h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{exp.role}</span>
                    <span className="text-cyan-700 font-medium"> @ {exp.company}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
            Highlighted Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  <span className="text-[10px] text-cyan-600 font-mono">{proj.liveUrl || proj.githubUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Stack: {proj.technologies.join(', ')}
                  </div>
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

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span>
                  <span className="text-slate-600"> — {edu.degree}, {edu.fieldOfStudy}</span>
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
