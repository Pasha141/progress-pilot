/**
 * @file src/utils/docxExport.ts
 * Generates ATS-friendly .docx Word documents from resume data using the 'docx' library.
 * Preserves clean typography, section borders, bullet points, and two-column header alignment.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';
import { ResumeData, TemplateOption } from '../types/resume';

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

/**
 * Creates an ATS-friendly section heading with a subtle colored underline
 */
function createSectionHeader(title: string, accentHex: string = '2563EB'): Paragraph {
  // Strip '#' if provided
  const cleanHex = accentHex.replace('#', '');
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: cleanHex,
        size: 8, // 1pt
        style: BorderStyle.SINGLE,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 22, // 11pt
        color: cleanHex,
        font: 'Arial',
      }),
    ],
  });
}

/**
 * Exports the user's resume data into a structured .docx file and initiates browser download
 */
export async function exportResumeToDocx(
  data: ResumeData,
  template?: TemplateOption
): Promise<void> {
  const { personalInfo, summary, education, experiences, skills, projects, certifications } = data;
  const accentColor = template?.accentColor || '#2563EB';
  const cleanAccent = accentColor.replace('#', '');

  const docChildren: (Paragraph | Table)[] = [];

  // ================= 1. HEADER (NAME & TITLE) =================
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: personalInfo.fullName || 'YOUR NAME',
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
          font: 'Arial',
        }),
      ],
    })
  );

  if (personalInfo.jobTitle) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [
          new TextRun({
            text: personalInfo.jobTitle,
            bold: true,
            size: 24, // 12pt
            color: cleanAccent,
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // ================= 2. CONTACT INFORMATION =================
  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);
  if (personalInfo.github) contactParts.push(personalInfo.github);
  if (personalInfo.website) contactParts.push(personalInfo.website);

  if (contactParts.length > 0) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 180 },
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: 19, // 9.5pt
            color: '475569',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // ================= 3. PROFESSIONAL SUMMARY =================
  if (summary && summary.trim().length > 0) {
    docChildren.push(createSectionHeader(data.summaryTitle || 'Professional Summary', cleanAccent));
    docChildren.push(
      new Paragraph({
        spacing: { before: 60, after: 140 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: summary.trim(),
            size: 20, // 10pt
            color: '1E293B',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // ================= 4. TECHNICAL SKILLS =================
  if (skills && skills.length > 0) {
    docChildren.push(createSectionHeader('Technical Skills', cleanAccent));
    skills.forEach((cat) => {
      if (cat.skills && cat.skills.length > 0) {
        const formattedSkills = cat.skills
          .map((s) => {
            if (typeof s === 'string') return s;
            if (s.level && s.level !== 'Not specified') {
              return `${s.name} — ${s.level}`;
            }
            return s.name;
          })
          .join(', ');

        docChildren.push(
          new Paragraph({
            spacing: { before: 40, after: 60 },
            children: [
              new TextRun({
                text: `${cat.categoryName}: `,
                bold: true,
                size: 20,
                color: '0F172A',
                font: 'Arial',
              }),
              new TextRun({
                text: formattedSkills,
                size: 20,
                color: '334155',
                font: 'Arial',
              }),
            ],
          })
        );
      }
    });
  }

  // ================= 5. PROJECTS =================
  if (projects && projects.length > 0) {
    docChildren.push(createSectionHeader('Key Projects & Portfolio', cleanAccent));
    projects.forEach((proj) => {
      // Row with project title and optional dates
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: 21,
              color: '0F172A',
              font: 'Arial',
            }),
            ...(proj.technologies && proj.technologies.length > 0
              ? [
                  new TextRun({
                    text: `  |  Technologies: `,
                    bold: true,
                    size: 19,
                    color: cleanAccent,
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: proj.technologies.join(', '),
                    italics: true,
                    size: 19,
                    color: '475569',
                    font: 'Arial',
                  }),
                ]
              : []),
          ],
        })
      );

      // Links or subtitle
      if (proj.liveUrl || proj.githubUrl) {
        const linkParts: string[] = [];
        if (proj.liveUrl) linkParts.push(`Live: ${proj.liveUrl}`);
        if (proj.githubUrl) linkParts.push(`GitHub: ${proj.githubUrl}`);
        docChildren.push(
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: linkParts.join('  •  '),
                size: 18,
                color: '2563EB',
                font: 'Arial',
              }),
            ],
          })
        );
      }

      // Bullet points
      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach((bullet) => {
          docChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 30, after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '1E293B',
                  font: 'Arial',
                }),
              ],
            })
          );
        });
      }
    });
  }

  // ================= 6. EDUCATION =================
  if (education && education.length > 0) {
    docChildren.push(createSectionHeader('Education', cleanAccent));
    education.forEach((edu) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 30 },
          children: [
            new TextRun({
              text: edu.school,
              bold: true,
              size: 21,
              color: '0F172A',
              font: 'Arial',
            }),
            new TextRun({
              text: edu.location ? ` — ${edu.location}` : '',
              size: 19,
              color: '64748B',
              font: 'Arial',
            }),
          ],
        })
      );

      const eduSub = [
        edu.degree ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}` : '',
        edu.startDate || edu.endDate ? `(${edu.startDate || ''} - ${edu.endDate || ''})` : '',
        edu.gpa ? `CGPA/Score: ${edu.gpa}` : '',
      ]
        .filter(Boolean)
        .join('  •  ');

      if (eduSub) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: eduSub,
                size: 19,
                color: '334155',
                font: 'Arial',
              }),
            ],
          })
        );
      }
    });
  }

  // ================= 7. EXPERIENCE (IF ANY) =================
  if (experiences && experiences.length > 0) {
    docChildren.push(createSectionHeader('Professional Experience', cleanAccent));
    experiences.forEach((exp) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 30 },
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 21,
              color: '0F172A',
              font: 'Arial',
            }),
            new TextRun({
              text: ` at ${exp.company}`,
              size: 20,
              color: '334155',
              font: 'Arial',
            }),
            new TextRun({
              text: ` (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`,
              size: 19,
              color: '64748B',
              font: 'Arial',
            }),
          ],
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          docChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 30, after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '1E293B',
                  font: 'Arial',
                }),
              ],
            })
          );
        });
      }
    });
  }

  // ================= 8. CERTIFICATIONS =================
  if (certifications && certifications.length > 0) {
    docChildren.push(createSectionHeader('Certifications & Achievements', cleanAccent));
    certifications.forEach((cert) => {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 20,
              color: '0F172A',
              font: 'Arial',
            }),
            new TextRun({
              text: ` — ${cert.issuer}`,
              size: 19,
              color: '334155',
              font: 'Arial',
            }),
            new TextRun({
              text: cert.issueDate ? ` (${cert.issueDate})` : '',
              size: 18,
              color: '64748B',
              font: 'Arial',
            }),
          ],
        })
      );
    });
  }

  // Build the complete Word Document
  const doc = new Document({
    creator: 'ATS-Friendly Resume Builder by Junaid',
    title: `${personalInfo.fullName || 'Resume'} - ATS Resume`,
    description: 'Generated ATS-Compliant Resume in .docx format',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in twips (standard 1440 twips = 1 inch)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  // Pack and trigger immediate browser download
  const blob = await Packer.toBlob(doc);
  const rawName = personalInfo.fullName?.trim() || 'Candidate';
  const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}_Resume.docx`;

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadUrl);
}
