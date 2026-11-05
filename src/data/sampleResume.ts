/**
 * @file src/data/sampleResume.ts
 * Fictional dummy resume data, pristine empty defaults, and reusable writing examples.
 * Strictly fictional - no real personal data hardcoded.
 */

import { ResumeData } from '../types/resume';

/**
 * Empty baseline resume where all inputs start completely blank.
 */
export const EMPTY_RESUME: ResumeData = {
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    photoUrl: '',
    includePhoto: false,
  },
  summary: '',
  summaryTitle: 'Professional Summary',
  experiences: [],
  education: [],
  skills: [
    { id: 'skill-cat-1', categoryName: 'Programming Languages', skills: [] },
    { id: 'skill-cat-2', categoryName: 'Frameworks & Tools', skills: [] },
    { id: 'skill-cat-3', categoryName: 'Databases & Cloud', skills: [] },
  ],
  projects: [],
  certifications: [],
};

/**
 * High-quality fictional sample resume displayed in preview on first load (Alex Johnson).
 * Displayed with subtle sample watermark; never exported to PDF/Word.
 */
export const FICTIONAL_SAMPLE_RESUME: ResumeData = {
  personalInfo: {
    fullName: 'Alex Johnson',
    jobTitle: 'Software Engineer | Full Stack Developer',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
    github: 'github.com/alexjohnson',
    website: 'alexjohnson.dev',
    photoUrl: '',
    includePhoto: false,
  },
  summaryTitle: 'Professional Summary',
  summary:
    'Results-driven Software Engineer with hands-on experience designing scalable web applications and high-throughput RESTful APIs. Proficient in TypeScript, React, Python, and PostgreSQL, with a proven track record of optimizing page load speeds by 35% and automating CI/CD pipelines for production deployments.',
  experiences: [
    {
      id: 'sample-exp-1',
      company: 'Apex Cloud Systems',
      role: 'Full Stack Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jun 2023',
      endDate: 'Present',
      current: true,
      bullets: [
        'Architected microservices handling 50k+ daily transactions with 99.9% uptime using Node.js and PostgreSQL.',
        'Engineered responsive frontend modules in React and TypeScript, boosting customer engagement by 28%.',
        'Optimized database queries and indexing strategies, reducing median API response latency by 42%.',
      ],
    },
    {
      id: 'sample-exp-2',
      company: 'Nova Digital Labs',
      role: 'Software Development Intern',
      location: 'San Jose, CA',
      startDate: 'Jan 2023',
      endDate: 'May 2023',
      current: false,
      bullets: [
        'Developed reusable UI components for client onboarding portals using React and Tailwind CSS.',
        'Collaborated with senior engineers to construct REST endpoints and automated unit tests with Jest.',
      ],
    },
  ],
  education: [
    {
      id: 'sample-edu-1',
      school: 'State University of Technology',
      degree: 'Bachelor of Science (B.S.)',
      fieldOfStudy: 'Computer Science',
      location: 'California, USA',
      startDate: '2019',
      endDate: '2023',
      gpa: 'GPA: 3.8 / 4.0',
      honors: 'Dean’s Honor List',
    },
  ],
  skills: [
    {
      id: 'sample-skill-1',
      categoryName: 'Programming Languages',
      skills: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'Java'],
    },
    {
      id: 'sample-skill-2',
      categoryName: 'Frameworks & Libraries',
      skills: ['React', 'Node.js', 'Next.js', 'Express', 'Tailwind CSS'],
    },
    {
      id: 'sample-skill-3',
      categoryName: 'Databases & Tools',
      skills: ['PostgreSQL', 'MySQL', 'Git', 'Docker', 'REST APIs', 'AWS'],
    },
  ],
  projects: [
    {
      id: 'sample-proj-1',
      title: 'Real-Time Analytics Dashboard',
      subtitle: 'React, TypeScript, WebSocket, Node.js',
      liveUrl: 'https://demo-analytics.dev',
      githubUrl: 'https://github.com/alexjohnson/analytics-dash',
      startDate: '2023',
      endDate: '2024',
      technologies: ['React', 'TypeScript', 'Node.js', 'WebSocket'],
      bullets: [
        'Built interactive data visualization charts streaming live metrics at 60 FPS with WebSocket feeds.',
        'Implemented secure JWT authentication and role-based permissions for enterprise accounts.',
      ],
    },
    {
      id: 'sample-proj-2',
      title: 'Automated Code Review Bot',
      subtitle: 'Python, FastAPI, Docker, GitHub Actions',
      liveUrl: '',
      githubUrl: 'https://github.com/alexjohnson/code-review-bot',
      startDate: '2023',
      endDate: '2023',
      technologies: ['Python', 'FastAPI', 'Docker', 'GitHub Actions'],
      bullets: [
        'Developed an automated bot scanning pull request diffs for syntax regressions and security flaws.',
        'Integrated into 15+ engineering repositories, reducing manual code review turnaround by 30%.',
      ],
    },
  ],
  certifications: [
    {
      id: 'sample-cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2024',
      credentialUrl: '',
    },
    {
      id: 'sample-cert-2',
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Meta / Coursera',
      issueDate: '2023',
      credentialUrl: '',
    },
  ],
};

// Aliases for compatibility
export const SAMPLE_RESUME: ResumeData = FICTIONAL_SAMPLE_RESUME;
export const JUNAID_RESUME: ResumeData = FICTIONAL_SAMPLE_RESUME;

/**
 * Fictional suggestions and helper examples that users can click to insert
 */
export const EXAMPLE_SNIPPETS = {
  summary: [
    'Results-driven Software Engineer with hands-on experience designing scalable web applications and high-throughput RESTful APIs. Proficient in TypeScript, React, and PostgreSQL with a strong focus on clean architecture.',
    'Detail-oriented Computer Science graduate with strong foundational skills in Python, SQL, and data structures. Eager to contribute analytical problem-solving to high-impact development projects.',
    'Proactive Full Stack Developer skilled in building modern, responsive user interfaces and robust microservices. Passionate about automated testing, performance optimization, and seamless user experiences.',
  ],
  experience: [
    'Architected microservices handling 50k+ daily transactions with 99.9% uptime using Node.js and PostgreSQL.',
    'Engineered responsive frontend modules in React and TypeScript, boosting customer conversion by 28%.',
    'Optimized relational database queries and indexing strategies, reducing median API response latency by 42%.',
    'Automated CI/CD deployment pipelines with GitHub Actions, cutting release cycle time from 2 hours to 15 minutes.',
  ],
  projects: [
    'Built an interactive real-time dashboard streaming live metrics at 60 FPS using React, TypeScript, and WebSockets.',
    'Designed and implemented secure RESTful API endpoints with JWT authentication and role-based permissions.',
    'Created a machine learning pipeline in Python and Scikit-learn for automated data clustering and visualization.',
  ],
};
