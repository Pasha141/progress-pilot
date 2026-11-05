/**
 * @file src/components/preview/templates/ClassicCorporate.tsx
 * Template 1: Classic Corporate.
 * ATS Gold-Standard single-column layout with clean horizontal divider lines and optional photo.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const ClassicCorporate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="text-slate-900 leading-relaxed font-sans text-xs">
      {/* Header */}
      <header className="pb-3 border-b-2 border-slate-900">
        <div className={`flex items-center ${showPhoto ? 'justify-between' : 'justify-center'} gap-4`}>
          {showPhoto && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-900 flex-shrink-0"
            />
          )}

          <div className={showPhoto ? 'text-left' : 'text-center'}>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-sm font-medium text-slate-700 mt-0.5">{personalInfo.jobTitle}</p>
            )}

            <div className={`flex flex-wrap ${showPhoto ? 'justify-start' : 'justify-center'} items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600`}>
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.location && <span>• {personalInfo.location}</span>}
              {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
              {personalInfo.github && <span>• {personalInfo.github}</span>}
              {personalInfo.website && <span>• {personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Professional Summary
          </h2>
          <p className="text-slate-700 text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Work & Internship Experience
          </h2>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{exp.role}</span>
                    <span className="text-slate-700">, {exp.company}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 text-right">
                    <span>{exp.startDate} – {exp.endDate}</span>
                    {exp.location && <span> | {exp.location}</span>}
                  </div>
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
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Key Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    {proj.technologies.length > 0 && (
                      <span className="text-slate-600 text-[11px] italic">
                        {' '}
                        | {proj.technologies.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {proj.githubUrl || proj.liveUrl || ''}
                  </div>
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

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span>
                  <div className="text-slate-700">
                    {edu.degree} in {edu.fieldOfStudy}
                    {edu.gpa && <span className="text-slate-600"> • GPA: {edu.gpa}</span>}
                    {edu.honors && <span className="text-slate-600"> • {edu.honors}</span>}
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

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Technical Skills
          </h2>
          <div className="space-y-1 text-slate-800">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-bold min-w-[140px] text-slate-900">{cat.categoryName}:</span>
                <span className="text-slate-700 flex-1">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
            Certifications
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700">
            {certifications.map((cert) => (
              <li key={cert.id}>
                <span className="font-semibold text-slate-900">{cert.name}</span> — {cert.issuer}
                {cert.issueDate && <span className="text-slate-500 text-[11px]"> ({cert.issueDate})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
