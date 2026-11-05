/**
 * @file src/components/preview/templates/IvyLeagueTraditional.tsx
 * Template 11: Ivy League Traditional.
 * Prestigious single-column serif format standard across Harvard & Stanford career centers.
 */

import React from 'react';
import { ResumeData } from '../../../types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const IvyLeagueTraditional: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications } = data;

  return (
    <div className="text-black font-serif text-xs leading-relaxed">
      {/* Header */}
      <header className="text-center pb-2 border-b border-black">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-black">
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-black font-sans">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && <span>· {personalInfo.phone}</span>}
          {personalInfo.email && <span>· {personalInfo.email}</span>}
          {personalInfo.linkedin && <span>· {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>· {personalInfo.github}</span>}
        </div>
      </header>

      {/* Education First (Traditional Ivy League Order for Students/Graduates) */}
      {education.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black">{edu.school}</span>
                  <span className="text-[11px] text-black font-sans">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline text-black italic text-xs">
                  <span>{edu.degree} in {edu.fieldOfStudy}</span>
                  {edu.gpa && <span className="font-sans not-italic text-[11px]">GPA: {edu.gpa}</span>}
                </div>
                {edu.honors && <div className="text-[11px] text-neutral-700">{edu.honors}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Experience
          </h2>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black">{exp.company}</span>
                  <span className="text-[11px] text-black font-sans">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-xs">
                  <span>{exp.role}</span>
                  {exp.location && <span className="font-sans not-italic text-[11px]">{exp.location}</span>}
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-black">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Projects & Research
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black">{proj.title}</span>
                  <span className="text-[11px] font-sans text-neutral-600">{proj.githubUrl || proj.liveUrl}</span>
                </div>
                {proj.technologies.length > 0 && (
                  <div className="text-[11px] italic text-neutral-800">
                    Tools: {proj.technologies.join(', ')}
                  </div>
                )}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-black">
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
        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Skills & Other
          </h2>
          <div className="space-y-0.5 font-sans text-xs">
            {skills.map((cat) => (
              <div key={cat.id} className="flex">
                <span className="font-bold min-w-[140px] text-black">{cat.categoryName}:</span>
                <span className="text-neutral-800">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
