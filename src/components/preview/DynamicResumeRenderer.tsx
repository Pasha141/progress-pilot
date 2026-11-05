/**
 * @file src/components/preview/DynamicResumeRenderer.tsx
 * Universal renderer engine for all ATS resume templates.
 * Dynamically binds chosen layout archetype with the corresponding professional color & typography theme.
 * Supports:
 * - 10 structural archetypes including Roger Stevens "monogram" (Screenshot 3 reference)
 * - 3 skills display styles: 'tags', 'bars', and 'text' (with real text in DOM for ATS)
 * - Section-level sample status tracking
 * - 100% single-page A4 print compatibility
 */

import React from 'react';
import { ResumeData, TemplateOption, SkillCategory, SkillItem, SkillsDisplayStyle, SkillProficiency } from '../../types/resume';
import { COLOR_THEMES } from '../../data/templatesData';

interface DynamicResumeRendererProps {
  data: ResumeData;
  template: TemplateOption;
  isCompact?: boolean;
  accentColorOverride?: string;
  sampleSections?: {
    personalInfo?: boolean;
    summary?: boolean;
    experience?: boolean;
    education?: boolean;
    projects?: boolean;
    skills?: boolean;
    certifications?: boolean;
  };
}

/**
 * Normalizes skill items whether stored as raw string or structured object
 */
function normalizeSkills(skills: (string | SkillItem)[]): { name: string; level: SkillProficiency }[] {
  return skills.map((s) => {
    if (typeof s === 'string') {
      const match = s.match(/(.*?)\s*\((Beginner|Intermediate|Advanced|Expert)\)/i);
      if (match) {
        return { name: match[1].trim(), level: match[2] as SkillProficiency };
      }
      return { name: s.trim(), level: 'Intermediate' };
    }
    return { name: s.name, level: s.level || 'Intermediate' };
  });
}

function getLevelPercent(level: SkillProficiency): number {
  switch (level) {
    case 'Beginner':
      return 25;
    case 'Intermediate':
      return 50;
    case 'Advanced':
      return 75;
    case 'Expert':
      return 100;
    default:
      return 50;
  }
}

/**
 * Universal Skills Renderer Component supporting Tags, Bars, and Text styles
 */
export const SkillsRenderer: React.FC<{
  skills: SkillCategory[];
  style?: SkillsDisplayStyle;
  accentHex: string;
}> = ({ skills, style = 'tags', accentHex }) => {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="space-y-2">
      {skills.map((cat) => {
        const norm = normalizeSkills(cat.skills);
        if (norm.length === 0) return null;

        return (
          <div key={cat.id} className="text-xs">
            {cat.categoryName && (
              <div className="font-bold text-slate-800 mb-1">{cat.categoryName}:</div>
            )}

            {/* Style 1: Tags with small level badge */}
            {style === 'tags' && (
              <div className="flex flex-wrap gap-1.5">
                {norm.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 print:border-slate-300"
                  >
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    {item.level && item.level !== 'Not specified' && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                          item.level === 'Expert'
                            ? 'bg-purple-100 text-purple-700'
                            : item.level === 'Advanced'
                            ? 'bg-blue-100 text-blue-700'
                            : item.level === 'Intermediate'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.level}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Style 2: Progress Bars with visible text level */}
            {style === 'bars' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {norm.map((item, idx) => {
                  const pct = getLevelPercent(item.level);
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                      <span className="font-medium text-slate-800 text-[11px] truncate max-w-[130px]">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden print:bg-slate-300">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: accentHex,
                              printColorAdjust: 'exact',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium w-14 text-right shrink-0">
                          {item.level !== 'Not specified' ? item.level : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Style 3: Text Only (Best for ATS) */}
            {style === 'text' && (
              <div className="text-slate-700 text-[11px] leading-relaxed">
                {norm
                  .map((item) =>
                    item.level && item.level !== 'Not specified'
                      ? `${item.name} (${item.level})`
                      : item.name
                  )
                  .join(', ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DynamicResumeLayout: React.FC<DynamicResumeRendererProps> = ({
  data,
  template,
  isCompact = false,
  accentColorOverride,
  sampleSections = {},
}) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, skillsDisplayStyle } = data;
  const theme = COLOR_THEMES[template.colorTheme] || COLOR_THEMES.blue;
  const accentHex = accentColorOverride || template.accentColor || theme.hex;
  const showPhoto = Boolean(personalInfo.includePhoto && personalInfo.photoUrl);

  const { layoutArchetype } = template;

  // Extract initials for monogram archetype (e.g. "Roger Stevens" -> "RS")
  const getInitials = (name: string): string => {
    if (!name.trim()) return 'RS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // =========================================================================
  // 1. MONOGRAM ARCHETYPE: Roger Stevens style (User Screenshot 3 reference)
  // Two-column layout with orange/accent monogram circle, summary & experience
  // on left, contact/education/skills/credentials on right.
  // =========================================================================
  if (layoutArchetype === 'monogram') {
    const initials = getInitials(personalInfo.fullName);

    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        {/* Monogram Top Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold tracking-tight shadow-sm shrink-0"
            style={{ backgroundColor: accentHex, printColorAdjust: 'exact' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: accentHex }}
            >
              {personalInfo.fullName || 'YOUR NAME'}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-xs font-semibold text-slate-700 tracking-wide mt-0.5">
                {personalInfo.jobTitle}
              </p>
            )}
          </div>
        </header>

        {/* Two-Column Grid: Left (Summary + Experience) & Right (Contact + Education + Skills + Certs) */}
        <div className="grid grid-cols-12 gap-5 mt-4">
          {/* Left Column (col-span-7) */}
          <div className="col-span-7 space-y-4">
            {/* Executive Summary */}
            {summary && (
              <section className={sampleSections.summary ? 'opacity-85' : ''}>
                <p className="text-slate-700 text-justify text-[11px] leading-relaxed">
                  {summary}
                </p>
              </section>
            )}

            {/* Professional Experience */}
            {experiences.length > 0 && (
              <section className={sampleSections.experience ? 'opacity-85' : ''}>
                <h2
                  className="text-sm font-bold tracking-wide mb-2"
                  style={{ color: accentHex }}
                >
                  Professional Experience
                </h2>
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="text-xs">
                      <div className="font-bold text-slate-900">{exp.role}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {exp.company}
                        {exp.location ? `, ${exp.location}` : ''} • {exp.startDate} to {exp.endDate}
                      </div>
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-slate-700 text-[11px]">
                          {exp.bullets.filter(Boolean).map((bullet, idx) => (
                            <li key={idx} className="leading-snug">{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Key Technical Projects */}
            {projects.length > 0 && (
              <section className={sampleSections.projects ? 'opacity-85' : ''}>
                <h2
                  className="text-sm font-bold tracking-wide mb-2"
                  style={{ color: accentHex }}
                >
                  Key Projects & Initiatives
                </h2>
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <div key={proj.id} className="text-xs">
                      <div className="font-bold text-slate-900">{proj.title}</div>
                      {proj.technologies.length > 0 && (
                        <div className="text-[10px] text-slate-500 italic">
                          Stack: {proj.technologies.join(', ')}
                        </div>
                      )}
                      {proj.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
                          {proj.bullets.filter(Boolean).map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (col-span-5) */}
          <div className="col-span-5 space-y-4 pl-3 border-l border-slate-200">
            {/* Contact details */}
            <section className={`text-[11px] text-slate-700 space-y-0.5 ${sampleSections.personalInfo ? 'opacity-85' : ''}`}>
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.email && <div className="truncate">{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.linkedin && <div className="truncate">{personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="truncate">{personalInfo.github}</div>}
            </section>

            {/* Education */}
            {education.length > 0 && (
              <section className={sampleSections.education ? 'opacity-85' : ''}>
                <h2
                  className="text-sm font-bold tracking-wide mb-1.5"
                  style={{ color: accentHex }}
                >
                  Education
                </h2>
                <div className="space-y-2 text-xs">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div className="font-bold text-slate-900">{edu.degree}</div>
                      <div className="text-slate-700 text-[11px]">{edu.fieldOfStudy}</div>
                      <div className="text-[10px] text-slate-500">
                        {edu.school}{edu.endDate ? ` | ${edu.endDate}` : ''}
                      </div>
                      {edu.gpa && <div className="text-[10px] text-slate-600 font-medium">{edu.gpa}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Key Skills */}
            {skills.length > 0 && (
              <section className={sampleSections.skills ? 'opacity-85' : ''}>
                <h2
                  className="text-sm font-bold tracking-wide mb-1.5"
                  style={{ color: accentHex }}
                >
                  Key Skills
                </h2>
                <SkillsRenderer
                  skills={skills}
                  style={skillsDisplayStyle || 'tags'}
                  accentHex={accentHex}
                />
              </section>
            )}

            {/* Credentials & Certifications */}
            {certifications.length > 0 && (
              <section className={sampleSections.certifications ? 'opacity-85' : ''}>
                <h2
                  className="text-sm font-bold tracking-wide mb-1.5"
                  style={{ color: accentHex }}
                >
                  Credentials
                </h2>
                <div className="space-y-1 text-xs">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="text-[11px]">
                      <div className="font-bold text-slate-900">{cert.name}</div>
                      <div className="text-slate-600 text-[10px]">
                        {cert.issuer} {cert.issueDate ? `| ${cert.issueDate}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CLASSIC SINGLE COLUMN ARCHETYPE (Gold Standard ATS)
  // =========================================================================
  if (layoutArchetype === 'classic') {
    return (
      <div className={`text-slate-900 leading-relaxed font-sans text-xs ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <header className="pb-3 border-b-2" style={{ borderColor: accentHex }}>
          <div className={`flex items-center ${showPhoto ? 'justify-between' : 'justify-center'} gap-4`}>
            {showPhoto && (
              <div
                className="w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-xs"
                style={{ borderColor: accentHex }}
              >
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={showPhoto ? 'text-left' : 'text-center'}>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              {personalInfo.jobTitle && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: accentHex }}>
                  {personalInfo.jobTitle}
                </p>
              )}
              <div className={`flex flex-wrap ${showPhoto ? 'justify-start' : 'justify-center'} items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600`}>
                {personalInfo.email && <span>{personalInfo.email}</span>}
                {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                {personalInfo.location && <span>• {personalInfo.location}</span>}
                {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
                {personalInfo.github && <span>• {personalInfo.github}</span>}
              </div>
            </div>
          </div>
        </header>

        {summary && (
          <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              {data.summaryTitle || 'Professional Summary'}
            </h2>
            <p className="text-slate-700 text-justify">{summary}</p>
          </section>
        )}

        {experiences.length > 0 && (
          <section className={`mt-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              Work Experience
            </h2>
            <div className="space-y-2.5">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      <span className="text-slate-700">, {exp.company}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 text-right font-medium">
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

        {projects.length > 0 && (
          <section className={`mt-3 ${sampleSections.projects ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              Key Technical Projects
            </h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-slate-900">{proj.title}</span>
                      {proj.technologies.length > 0 && (
                        <span className="text-slate-600 text-[11px] italic"> | {proj.technologies.join(', ')}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-600 text-right">
                      {proj.liveUrl || proj.githubUrl}
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

        {education.length > 0 && (
          <section className={`mt-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              Education
            </h2>
            <div className="space-y-1.5">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.school}</span>
                    <div className="text-slate-700">
                      {edu.degree} in {edu.fieldOfStudy}
                      {edu.gpa && <span className="text-slate-600 font-medium"> • {edu.gpa}</span>}
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

        {skills.length > 0 && (
          <section className={`mt-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              Technical Skills
            </h2>
            <SkillsRenderer
              skills={skills}
              style={skillsDisplayStyle || 'tags'}
              accentHex={accentHex}
            />
          </section>
        )}

        {certifications.length > 0 && (
          <section className={`mt-3 ${sampleSections.certifications ? 'opacity-85' : ''}`}>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
              style={{ color: accentHex, borderColor: accentHex }}
            >
              Certifications
            </h2>
            <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700">
              {certifications.map((cert) => (
                <li key={cert.id}>
                  <strong className="text-slate-900">{cert.name}</strong> — {cert.issuer} ({cert.issueDate})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. TECH & CODE MONOSPACE ARCHETYPE
  // =========================================================================
  if (layoutArchetype === 'tech') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <header className="border-b-2 pb-2.5" style={{ borderColor: accentHex }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 font-mono">
                &lt;{personalInfo.fullName || 'YOUR NAME'} /&gt;
              </h1>
              <p className="text-xs font-bold mt-0.5" style={{ color: accentHex }}>
                {personalInfo.jobTitle || 'Software Engineer'}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600 font-mono">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-blue-600 font-mono">
            {personalInfo.github && <span>gh: {personalInfo.github}</span>}
            {personalInfo.linkedin && <span>in: {personalInfo.linkedin}</span>}
          </div>
        </header>

        {summary && (
          <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-1">
              // {data.summaryTitle || 'Profile Overview'}
            </h2>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 font-sans">
              {summary}
            </p>
          </section>
        )}

        {skills.length > 0 && (
          <section className={`mt-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-1.5">
              // Technical Competencies
            </h2>
            <SkillsRenderer
              skills={skills}
              style={skillsDisplayStyle || 'tags'}
              accentHex={accentHex}
            />
          </section>
        )}

        {experiences.length > 0 && (
          <section className={`mt-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-1.5">
              // Work Experience
            </h2>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3" style={{ borderColor: accentHex }}>
                  <div className="flex justify-between items-baseline font-mono text-xs">
                    <span className="font-bold text-slate-900">{exp.role} @ {exp.company}</span>
                    <span className="text-[11px] text-slate-500">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-xs font-sans">
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

        {projects.length > 0 && (
          <section className={`mt-3 ${sampleSections.projects ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-1.5">
              // Featured Open Source & Projects
            </h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-slate-50/70 p-2 rounded border border-slate-200">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold font-mono text-slate-900">{proj.title}</span>
                    <span className="text-[11px] text-blue-600 font-mono">{proj.githubUrl || proj.liveUrl}</span>
                  </div>
                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.technologies.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-white text-[10px] font-mono border rounded text-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {proj.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-xs font-sans">
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

        {education.length > 0 && (
          <section className={`mt-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-1">
              // Education
            </h2>
            <div className="space-y-1">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between text-xs font-mono">
                  <span>{edu.degree} — {edu.school}</span>
                  <span className="text-slate-500">{edu.endDate} {edu.gpa ? `(${edu.gpa})` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. BANNER HEADER ARCHETYPE (Emily Carter style)
  // =========================================================================
  if (layoutArchetype === 'banner') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        {/* Full-width Solid Header Banner */}
        <header
          className="-mx-[10mm] -mt-[8mm] p-6 text-white mb-4 shadow-sm"
          style={{ backgroundColor: accentHex, printColorAdjust: 'exact' }}
        >
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              {personalInfo.jobTitle && (
                <p className="text-sm font-medium opacity-90 tracking-wide mt-0.5">
                  {personalInfo.jobTitle}
                </p>
              )}
            </div>
            <div className="text-right text-[11px] opacity-90 space-y-0.5">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
            </div>
          </div>
        </header>

        {summary && (
          <section className={`mb-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-1 border-b-2" style={{ borderColor: accentHex, color: accentHex }}>
              {data.summaryTitle || 'Executive Summary'}
            </h2>
            <p className="text-slate-700 text-justify">{summary}</p>
          </section>
        )}

        {experiences.length > 0 && (
          <section className={`mb-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-1.5 border-b-2" style={{ borderColor: accentHex, color: accentHex }}>
              Professional Experience
            </h2>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{exp.role} — {exp.company}</span>
                    <span className="text-[11px] text-slate-600 font-normal">{exp.startDate} – {exp.endDate}</span>
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

        {skills.length > 0 && (
          <section className={`mb-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-1.5 border-b-2" style={{ borderColor: accentHex, color: accentHex }}>
              Skills & Core Competencies
            </h2>
            <SkillsRenderer
              skills={skills}
              style={skillsDisplayStyle || 'bars'}
              accentHex={accentHex}
            />
          </section>
        )}

        {education.length > 0 && (
          <section className={`mb-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-1 border-b-2" style={{ borderColor: accentHex, color: accentHex }}>
              Education
            </h2>
            <div className="space-y-1">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between text-xs">
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <span className="text-slate-600">{edu.school} ({edu.endDate})</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. EXECUTIVE SERIF ARCHETYPE (Marcus Vance / Sarah Jenkins style)
  // =========================================================================
  if (layoutArchetype === 'executive') {
    return (
      <div className={`text-slate-900 font-serif text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <header className="text-center pb-3 border-b border-slate-300">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mt-1">
              {personalInfo.jobTitle}
            </p>
          )}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-2 text-[11px] text-slate-600 font-sans">
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.email && <span>• {personalInfo.email}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
          </div>
        </header>

        {summary && (
          <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest pb-0.5 mb-1 text-slate-800 border-b border-slate-300">
              {data.summaryTitle || 'Executive Profile'}
            </h2>
            <p className="text-slate-800 text-justify font-sans text-xs leading-relaxed">{summary}</p>
          </section>
        )}

        {experiences.length > 0 && (
          <section className={`mt-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest pb-0.5 mb-1.5 text-slate-800 border-b border-slate-300">
              Professional Experience
            </h2>
            <div className="space-y-3 font-sans">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 font-serif text-sm">{exp.role}</span>
                    <span className="text-[11px] text-slate-600">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-slate-700 italic text-xs mb-1">{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-xs">
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

        {education.length > 0 && (
          <section className={`mt-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest pb-0.5 mb-1 text-slate-800 border-b border-slate-300">
              Education
            </h2>
            <div className="space-y-1.5 font-sans">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.school}</span>
                    <div className="text-slate-700">{edu.degree} in {edu.fieldOfStudy}</div>
                  </div>
                  <span className="text-[11px] text-slate-600">{edu.endDate}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section className={`mt-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest pb-0.5 mb-1.5 text-slate-800 border-b border-slate-300">
              Areas of Expertise
            </h2>
            <SkillsRenderer
              skills={skills}
              style={skillsDisplayStyle || 'text'}
              accentHex={accentHex}
            />
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 6. SIDEBAR ARCHETYPE (Elena Rostova / Left Sidebar Pro style)
  // Two-column layout with dedicated left column for photo, contact, skills & edu
  // =========================================================================
  if (layoutArchetype === 'sidebar') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <div className="grid grid-cols-12 gap-5 min-h-[1050px]">
          {/* Left Column Sidebar */}
          <aside
            className="col-span-4 p-4 rounded-xl space-y-4 border flex flex-col"
            style={{
              backgroundColor: '#f8fafc',
              borderColor: `${accentHex}30`,
            }}
          >
            {showPhoto && (
              <div className="flex justify-center">
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 shadow-xs"
                  style={{ borderColor: accentHex }}
                />
              </div>
            )}

            {/* Contact Details */}
            <div className={`space-y-1.5 text-[11px] text-slate-600 break-words ${sampleSections.personalInfo ? 'opacity-85' : ''}`}>
              <h3 className="font-bold uppercase tracking-wider text-xs pb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                Contact
              </h3>
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedin && <div className="truncate">{personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="truncate">{personalInfo.github}</div>}
              {personalInfo.website && <div className="truncate">{personalInfo.website}</div>}
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className={sampleSections.skills ? 'opacity-85' : ''}>
                <h3 className="font-bold uppercase tracking-wider text-xs pb-1 border-b mb-2" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Core Skills
                </h3>
                <SkillsRenderer
                  skills={skills}
                  style={skillsDisplayStyle || 'bars'}
                  accentHex={accentHex}
                />
              </div>
            )}

            {/* Education in sidebar */}
            {education.length > 0 && (
              <div className={`space-y-2 text-[11px] ${sampleSections.education ? 'opacity-85' : ''}`}>
                <h3 className="font-bold uppercase tracking-wider text-xs pb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Education
                </h3>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900">{edu.school}</div>
                    <div className="text-slate-700">{edu.degree}</div>
                    <div className="text-slate-500 text-[10px]">{edu.fieldOfStudy}</div>
                    <div className="text-[10px] text-slate-400">
                      {edu.startDate} – {edu.endDate} {edu.gpa ? `| ${edu.gpa}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications in sidebar */}
            {certifications.length > 0 && (
              <div className={`space-y-1 text-[11px] ${sampleSections.certifications ? 'opacity-85' : ''}`}>
                <h3 className="font-bold uppercase tracking-wider text-xs pb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Credentials
                </h3>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <strong className="text-slate-900 block">{c.name}</strong>
                    <span className="text-[10px] text-slate-500">{c.issuer}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Right Main Pane */}
          <main className="col-span-8 space-y-4">
            {/* Header */}
            <header className="border-b-2 pb-3" style={{ borderColor: accentHex }}>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              {personalInfo.jobTitle && (
                <p className="text-sm font-bold mt-0.5" style={{ color: accentHex }}>
                  {personalInfo.jobTitle}
                </p>
              )}
            </header>

            {/* Profile Summary */}
            {summary && (
              <section className={sampleSections.summary ? 'opacity-85' : ''}>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1 text-slate-800">
                  {data.summaryTitle || 'Executive Profile'}
                </h2>
                <p className="text-slate-700 text-justify leading-relaxed">{summary}</p>
              </section>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <section className={sampleSections.experience ? 'opacity-85' : ''}>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-2 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Professional Experience
                </h2>
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                        <span>{exp.role} <span className="font-semibold text-slate-600">@ {exp.company}</span></span>
                        <span className="text-[11px] text-slate-500 font-normal">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-[11px]">
                          {exp.bullets.filter(Boolean).map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Technical Projects */}
            {projects.length > 0 && (
              <section className={sampleSections.projects ? 'opacity-85' : ''}>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-2 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Key Initiatives & Projects
                </h2>
                <div className="space-y-2.5">
                  {projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>{proj.title}</span>
                        <span className="text-[10px] text-blue-600 font-normal">{proj.liveUrl || proj.githubUrl}</span>
                      </div>
                      {proj.technologies.length > 0 && (
                        <div className="text-[10px] text-slate-500 italic">
                          Stack: {proj.technologies.join(', ')}
                        </div>
                      )}
                      {proj.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
                          {proj.bullets.filter(Boolean).map((b, idx) => (
                            <li key={idx}>{b}</li>
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
      </div>
    );
  }

  // =========================================================================
  // 7. COMPACT TWO-COLUMN ARCHETYPE (Chloe Bennett / Teresa Nguyen style)
  // 35/65 dense split maximizing single-page A4 space
  // =========================================================================
  if (layoutArchetype === 'compact') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-normal ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <header className="border-b pb-2 mb-3" style={{ borderColor: accentHex }}>
          <div className="flex justify-between items-baseline">
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase" style={{ color: accentHex }}>
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              <p className="text-xs font-semibold text-slate-700">{personalInfo.jobTitle}</p>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone} • {personalInfo.location}</div>}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column (4 cols) */}
          <aside className="col-span-4 border-r border-slate-200 pr-3 space-y-3">
            {skills.length > 0 && (
              <div className={sampleSections.skills ? 'opacity-85' : ''}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Skills
                </h3>
                <SkillsRenderer
                  skills={skills}
                  style={skillsDisplayStyle || 'tags'}
                  accentHex={accentHex}
                />
              </div>
            )}

            {education.length > 0 && (
              <div className={`space-y-1.5 text-[11px] ${sampleSections.education ? 'opacity-85' : ''}`}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Education
                </h3>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900">{edu.school}</div>
                    <div className="text-slate-700">{edu.degree}</div>
                    <div className="text-[10px] text-slate-500">{edu.startDate} – {edu.endDate} {edu.gpa ? `(${edu.gpa})` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {certifications.length > 0 && (
              <div className={`space-y-1 text-[11px] ${sampleSections.certifications ? 'opacity-85' : ''}`}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Certifications
                </h3>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <strong className="text-slate-900">{c.name}</strong>
                    <div className="text-[10px] text-slate-500">{c.issuer}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Right Column (8 cols) */}
          <main className="col-span-8 space-y-3">
            {summary && (
              <section className={sampleSections.summary ? 'opacity-85' : ''}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  {data.summaryTitle || 'Profile'}
                </h3>
                <p className="text-slate-700 text-justify text-xs leading-relaxed">{summary}</p>
              </section>
            )}

            {experiences.length > 0 && (
              <section className={sampleSections.experience ? 'opacity-85' : ''}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Experience
                </h3>
                <div className="space-y-2.5">
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline font-bold text-xs text-slate-900">
                        <span>{exp.role} <span className="font-normal text-slate-600">at {exp.company}</span></span>
                        <span className="text-[10px] text-slate-500 font-medium">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-3.5 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
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

            {projects.length > 0 && (
              <section className={sampleSections.projects ? 'opacity-85' : ''}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
                  Projects
                </h3>
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline font-bold text-xs text-slate-900">
                        <span>{proj.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{proj.liveUrl || proj.githubUrl}</span>
                      </div>
                      {proj.technologies.length > 0 && (
                        <div className="text-[10px] text-slate-500">[{proj.technologies.join(', ')}]</div>
                      )}
                      {proj.bullets.length > 0 && (
                        <ul className="list-disc list-outside ml-3.5 mt-0.5 space-y-0.5 text-slate-700 text-[11px]">
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
      </div>
    );
  }

  // =========================================================================
  // 8. ACADEMIC ARCHETYPE (Arjun Mehta / Ananya Deshmukh style)
  // Education & Capstone Projects upfront for students, freshers, researchers
  // =========================================================================
  if (layoutArchetype === 'academic') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        {/* Centered Academic Header */}
        <header className="text-center pb-2.5 border-b-2" style={{ borderColor: accentHex }}>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-xs font-semibold mt-0.5" style={{ color: accentHex }}>
            {personalInfo.jobTitle || 'Computer Science Graduate'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-slate-600">
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.phone && <span>| {personalInfo.phone}</span>}
            {personalInfo.email && <span>| {personalInfo.email}</span>}
            {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>| {personalInfo.github}</span>}
          </div>
        </header>

        {summary && (
          <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Academic Objective & Summary
            </h2>
            <p className="text-slate-700 text-justify">{summary}</p>
          </section>
        )}

        {/* Education - High Priority First */}
        {education.length > 0 && (
          <section className={`mt-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Education & Academic Credentials
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-950">{edu.school}</span>
                    <div className="text-slate-800">
                      {edu.degree} in {edu.fieldOfStudy}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {edu.gpa && <span>Cumulative GPA / Grade: {edu.gpa}</span>}
                      {edu.honors && <span> • Honors: {edu.honors}</span>}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 text-right font-medium">
                    <span>{edu.startDate} – {edu.endDate}</span>
                    {edu.location && <div>{edu.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Skills */}
        {skills.length > 0 && (
          <section className={`mt-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Technical & Core Competencies
            </h2>
            <SkillsRenderer
              skills={skills}
              style={skillsDisplayStyle || 'tags'}
              accentHex={accentHex}
            />
          </section>
        )}

        {/* Technical Projects */}
        {projects.length > 0 && (
          <section className={`mt-3 ${sampleSections.projects ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Capstone & Technical Projects
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline font-bold text-slate-950">
                    <span>{proj.title}</span>
                    <span className="text-[11px] text-blue-600 font-normal">{proj.liveUrl || proj.githubUrl}</span>
                  </div>
                  {proj.technologies.length > 0 && (
                    <div className="text-[11px] text-slate-600 italic">
                      [Technologies: {proj.technologies.join(', ')}]
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

        {/* Experience / Internships */}
        {experiences.length > 0 && (
          <section className={`mt-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Internships & Work History
            </h2>
            <div className="space-y-2">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{exp.role}, {exp.company}</span>
                    <span className="text-[11px] text-slate-600 font-normal">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700">
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

        {/* Certifications & Awards */}
        {certifications.length > 0 && (
          <section className={`mt-3 ${sampleSections.certifications ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: accentHex, borderColor: `${accentHex}40` }}>
              Certifications & Co-Curricular Awards
            </h2>
            <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700">
              {certifications.map((c) => (
                <li key={c.id}>
                  <strong className="text-slate-900">{c.name}</strong> — {c.issuer} ({c.issueDate})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 9. MODERN ARCHETYPE (Priya Nair / Hannah Taylor style)
  // Contemporary clean sans-serif with subtle colored accent lines
  // =========================================================================
  if (layoutArchetype === 'modern') {
    return (
      <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
        <header className="pb-3 border-b-2" style={{ borderColor: accentHex }}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              {personalInfo.jobTitle && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: accentHex }}>
                  {personalInfo.jobTitle}
                </p>
              )}
            </div>
            <div className="text-right text-[11px] text-slate-600 space-y-0.5">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
            {personalInfo.website && <span>Portfolio: {personalInfo.website}</span>}
          </div>
        </header>

        {summary && (
          <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>{data.summaryTitle || 'Profile Summary'}</span>
            </h2>
            <p className="text-slate-700 leading-normal pl-3.5">{summary}</p>
          </section>
        )}

        {experiences.length > 0 && (
          <section className={`mt-3.5 ${sampleSections.experience ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>Professional Experience</span>
            </h2>
            <div className="space-y-3 pl-3.5 border-l-2 ml-1" style={{ borderColor: `${accentHex}30` }}>
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                    <span>{exp.role} <span className="font-medium text-slate-600">at {exp.company}</span></span>
                    <span className="text-[11px] font-normal text-slate-500">{exp.startDate} – {exp.endDate}</span>
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

        {projects.length > 0 && (
          <section className={`mt-3.5 ${sampleSections.projects ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>Key Initiatives & Projects</span>
            </h2>
            <div className="space-y-2.5 pl-3.5 border-l-2 ml-1" style={{ borderColor: `${accentHex}30` }}>
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{proj.title}</span>
                    <span className="text-[11px] text-blue-600 font-normal">{proj.liveUrl || proj.githubUrl}</span>
                  </div>
                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-1">
                      {proj.technologies.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.2 rounded font-medium border" style={{ color: accentHex, borderColor: `${accentHex}40`, backgroundColor: `${accentHex}10` }}>
                          {t}
                        </span>
                      ))}
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

        {skills.length > 0 && (
          <section className={`mt-3.5 ${sampleSections.skills ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>Skills & Competencies</span>
            </h2>
            <div className="pl-3.5">
              <SkillsRenderer
                skills={skills}
                style={skillsDisplayStyle || 'bars'}
                accentHex={accentHex}
              />
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className={`mt-3.5 ${sampleSections.education ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>Education</span>
            </h2>
            <div className="space-y-1.5 pl-3.5">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.school}</span>
                    <span className="text-slate-600"> — {edu.degree} in {edu.fieldOfStudy}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{edu.endDate} {edu.gpa ? `(${edu.gpa})` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section className={`mt-3 ${sampleSections.certifications ? 'opacity-85' : ''}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: accentHex }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentHex }} />
              <span>Certifications</span>
            </h2>
            <div className="flex flex-wrap gap-3 pl-3.5 text-[11px] text-slate-700">
              {certifications.map((c) => (
                <span key={c.id}>
                  <strong className="text-slate-900">{c.name}</strong> ({c.issuer})
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // 10. SIMPLE / MINIMAL ARCHETYPE (Oliver Wright / Jordan Lee style)
  // Ultra-clean single-column ATS layout with zero clutter
  // =========================================================================
  return (
    <div className={`text-slate-900 font-sans text-xs leading-relaxed ${isCompact ? 'scale-95 origin-top' : ''}`}>
      <header className="pb-3 border-b-2" style={{ borderColor: accentHex }}>
        <h1 className="text-2xl font-black tracking-tight text-slate-900" style={{ color: accentHex }}>
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-xs font-semibold text-slate-700 tracking-wide mt-0.5">
            {personalInfo.jobTitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[11px] text-slate-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
        </div>
      </header>

      {summary && (
        <section className={`mt-3 ${sampleSections.summary ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            {data.summaryTitle || 'Professional Summary'}
          </h2>
          <p className="text-slate-700 text-justify">{summary}</p>
        </section>
      )}

      {experiences.length > 0 && (
        <section className={`mt-3 ${sampleSections.experience ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            Experience & Internships
          </h2>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{exp.role}, {exp.company}</span>
                  <span className="text-[11px] text-slate-600 font-normal">{exp.startDate} – {exp.endDate}</span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700">
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

      {projects.length > 0 && (
        <section className={`mt-3 ${sampleSections.projects ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            Technical Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.title}</span>
                  {proj.technologies.length > 0 && (
                    <span className="text-slate-500 font-normal italic text-[11px]">{proj.technologies.join(', ')}</span>
                  )}
                </div>
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700">
                    {proj.bullets.filter(Boolean).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className={`mt-3 ${sampleSections.education ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            Education
          </h2>
          <div className="space-y-1">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span> — {edu.degree} in {edu.fieldOfStudy}
                </div>
                <span className="text-slate-600 font-medium">{edu.endDate} {edu.gpa ? `(${edu.gpa})` : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className={`mt-3 ${sampleSections.skills ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            Skills & Competencies
          </h2>
          <SkillsRenderer
            skills={skills}
            style={skillsDisplayStyle || 'tags'}
            accentHex={accentHex}
          />
        </section>
      )}

      {certifications.length > 0 && (
        <section className={`mt-3 ${sampleSections.certifications ? 'opacity-85' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b" style={{ borderColor: accentHex, color: accentHex }}>
            Certifications
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700">
            {certifications.map((cert) => (
              <li key={cert.id}>
                <strong>{cert.name}</strong> — {cert.issuer} ({cert.issueDate})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export const DynamicResumeRenderer: React.FC<DynamicResumeRendererProps> = (props) => (
  <div
    className="template-presentation"
    data-presentation-style={props.template.presentationStyle || 'standard'}
  >
    <DynamicResumeLayout {...props} />
  </div>
);
