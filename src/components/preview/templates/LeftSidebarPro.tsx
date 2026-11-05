/**
 * @file src/components/preview/templates/LeftSidebarPro.tsx
 * Template 13: Left Sidebar Pro.
 * Full-height dark navy left sidebar with photo, contact, skills, and education; right white pane for experience & projects.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const LeftSidebarPro: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;
  const showPhoto = personalInfo.includePhoto && personalInfo.photoUrl;

  return (
    <div className="-m-[16mm] flex min-h-[297mm] text-slate-800 font-sans text-xs">
      {/* Dark Left Sidebar */}
      <aside className="w-[32%] bg-slate-900 text-slate-200 p-6 flex flex-col gap-5 flex-shrink-0">
        {showPhoto && (
          <div className="flex justify-center">
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-lg"
            />
          </div>
        )}

        {/* Contact Info */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700 pb-1 mb-2">
            Contact
          </h3>
          <div className="space-y-1.5 text-[11px] text-slate-300 break-words">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
            {personalInfo.linkedin && <div>in: {personalInfo.linkedin}</div>}
            {personalInfo.github && <div>git: {personalInfo.github}</div>}
            {personalInfo.website && <div>{personalInfo.website}</div>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700 pb-1 mb-2">
              Skills
            </h3>
            <div className="space-y-2.5">
              {skills.map((cat) => (
                <div key={cat.id}>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {cat.categoryName}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cat.skills.map((s, idx) => {
                      const name = typeof s === 'string' ? s : s.name;
                      return (
                        <span
                          key={idx}
                          className="bg-slate-800 text-slate-200 text-[10px] px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education in sidebar */}
        {education.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700 pb-1 mb-2">
              Education
            </h3>
            <div className="space-y-2 text-[11px]">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-white">{edu.school}</div>
                  <div className="text-slate-300">{edu.degree}</div>
                  <div className="text-slate-400">{edu.fieldOfStudy}</div>
                  <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 border-b border-slate-700 pb-1 mb-2">
              Credentials
            </h3>
            <div className="space-y-1.5 text-[11px]">
              {certifications.map((c) => (
                <div key={c.id}>
                  <strong className="text-white block">{c.name}</strong>
                  <span className="text-slate-400 text-[10px]">{c.issuer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Right Body */}
      <main className="w-[68%] p-6 flex flex-col gap-4">
        {/* Name Header */}
        <header className="border-b border-slate-200 pb-3">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-sm font-semibold text-blue-600 mt-0.5">
            {personalInfo.jobTitle || 'Software Engineer'}
          </p>
        </header>

        {/* Summary */}
        {summary && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              Profile Summary
            </h2>
            <p className="text-slate-700 leading-relaxed text-justify">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
              Experience
            </h2>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs">
                      {exp.role} <span className="font-medium text-blue-600">@ {exp.company}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
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
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
              Featured Projects
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    <span className="text-[10px] text-blue-600">{proj.liveUrl || proj.githubUrl}</span>
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
      </main>
    </div>
  );
};
