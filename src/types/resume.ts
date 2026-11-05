/**
 * @file src/types/resume.ts
 * Type definitions for resume state, sections, skills with proficiency levels,
 * Curated ATS templates with category tabs, and Cover Letter Builder models.
 */

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  photoUrl?: string;
  includePhoto?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Not specified';

export interface SkillItem {
  id: string;
  name: string;
  level?: SkillProficiency;
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: (string | SkillItem)[];
}

export type SkillsDisplayStyle = 'tags' | 'bars' | 'text';

export interface ProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  liveUrl?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summaryTitle?: string;
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  skillsDisplayStyle?: SkillsDisplayStyle;
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

export type LayoutArchetype =
  | 'monogram'    // Roger Stevens / Junaid style: Initials circle, 2-column with professional summary & experience on left, contact/skills/education on right
  | 'classic'     // Harvard / Fortune 500 ATS gold standard single-column
  | 'tech'        // Developer-centric monospace, code tags, GitHub repos
  | 'modern'      // Contemporary clean sans-serif with subtle colored accent lines
  | 'banner'      // Bold solid header block with white contrast typography
  | 'sidebar'     // Full-height colored/dark left sidebar for skills, contact, and education
  | 'compact'     // High-density 35/65 split layout for maximum content per page
  | 'executive'   // Prestigious Georgia serif typography with centered header & hairline dividers
  | 'academic'    // Education, GPA, Coursework & Capstone projects upfront for students & researchers
  | 'simple';     // Ultra-minimalist clean ATS layout with zero clutter

export type TemplatePresentationStyle =
  | 'editorial'
  | 'timeline'
  | 'compact'
  | 'framed'
  | 'modern-grid'
  | 'letterhead';

export type ColorTheme =
  | 'blue'
  | 'slate'
  | 'emerald'
  | 'burgundy'
  | 'violet'
  | 'amber'
  | 'cyan'
  | 'rose'
  | 'monochrome'
  | 'indigo'
  | 'teal';

export type TemplateId = string;

export type TemplateCategory =
  | 'All'
  | 'Fresher / Student'
  | 'Software & IT'
  | 'Data & Analytics'
  | 'Business & Management'
  | 'Healthcare'
  | 'Finance & Accounting'
  | 'Creative / Design'
  | 'Sales & Marketing'
  | 'Engineering'
  | 'Education / Teaching'
  | 'Simple / Minimal'
  | 'Two-Column'
  | 'Executive / Professional'
  | 'Compact';

export interface TemplateOption {
  id: TemplateId;
  numericIndex: number;
  name: string;
  layoutArchetype: LayoutArchetype;
  colorTheme: ColorTheme;
  category: TemplateCategory;
  description: string;
  badge: string;
  supportsPhoto: boolean;
  accentColor: string;
  personaId: string;
  isAtsSafe: boolean; // Single-column clean text-first (true) vs designer/sidebar (false)
  presentationStyle?: TemplatePresentationStyle;
  fontPair?: 'sans' | 'serif' | 'mono' | 'modern' | 'executive';
  headingStyle?: 'uppercase' | 'capitalize' | 'accent-border' | 'tinted-badge';
}

export type ActivePage =
  | 'landing'
  | 'templates'
  | 'builder'
  | 'my-resumes'
  | 'cover-letter'
  | 'ats-checker'
  | 'login'
  | 'register'
  | 'forgot-password';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export type CoverLetterTemplateId =
  | 'medical_modern'
  | 'executive_serif'
  | 'tech_minimal'
  | 'editorial_monogram'
  | 'compact_corporate'
  | 'creative_sidebar';

export interface CoverLetterData {
  senderName: string;
  senderTitle: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderWebsite?: string;
  date: string;
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  companyAddress: string;
  salutation: string;
  openingParagraph: string;
  bodyParagraph: string;
  bulletPoints: string[];
  closingParagraph: string;
  signoff: string;
  accentColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  templateId?: CoverLetterTemplateId;
}
