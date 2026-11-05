/**
 * @file src/data/personas.ts
 * Curated collection of 42 realistic, domain-specific fictional candidate personas.
 * Each persona is paired with a matching ATS resume template to make the template showcase
 * feel genuine, professional, and visually compelling across 14 diverse industries.
 * All data is 100% fictional.
 */

import { ResumeData } from '../types/resume';

export const PERSONAS: Record<string, ResumeData> = {
  // 1. Roger Stevens, MBA - Business Analyst (Monogram)
  roger_stevens: {
    personalInfo: {
      fullName: 'Roger Stevens, MBA',
      jobTitle: 'Senior Business Analyst',
      email: 'roger@email.com',
      phone: '(213) 456-7890',
      location: 'Los Angeles, CA 90210',
      linkedin: 'linkedin.com/in/rogerstevens-mba',
      github: '',
      website: 'www.linkedin.com/example',
    },
    summaryTitle: 'Executive Profile',
    summary:
      'Strategic Business Analyst with 8+ years of experience leaning operations and boosting company performance. Readily collaborates and builds productive relationships with diverse team members and executive stakeholders.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Arrow Sales Company',
        role: 'Senior Business Analyst',
        location: 'Los Angeles, CA',
        startDate: 'April 2017',
        endDate: 'Present',
        current: true,
        bullets: [
          'Evaluate company operational requirements by interviewing stakeholders and analyzing documents and workflows.',
          'Articulate business needs by building clear process models, flowcharts, and Jira user stories.',
          'Evaluated and addressed five urgent testing and training risks, saving the company more than $75,000.',
        ],
      },
      {
        id: 'exp-2',
        company: 'Delta Consulting',
        role: 'Business Analyst',
        location: 'San Francisco, CA',
        startDate: 'January 2013',
        endDate: 'March 2017',
        current: false,
        bullets: [
          'Translated stakeholder requirements into concrete deliverables including functional specifications and data model diagrams.',
          'Completed in-depth analysis of client tools, programs, and processes, increasing revenue by 8% and operational efficiency by 14%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Southern California',
        degree: 'Master of Business Administration (MBA)',
        fieldOfStudy: 'Operations & Business Strategy',
        location: 'Los Angeles, CA',
        startDate: '2015',
        endDate: '2017',
        gpa: '3.9 GPA',
      },
      {
        id: 'edu-2',
        school: 'UCLA',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Economics',
        location: 'Los Angeles, CA',
        startDate: '2009',
        endDate: '2013',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Core Competencies',
        skills: [
          { id: 'sk-1', name: 'Business Process Modeling (BPMN)', level: 'Expert' },
          { id: 'sk-2', name: 'Requirements Gathering & User Stories', level: 'Expert' },
          { id: 'sk-3', name: 'Stakeholder Management & ERP', level: 'Advanced' },
          { id: 'sk-4', name: 'Financial Modeling & Tableau', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [
      {
        id: 'cert-1',
        name: 'Certified Business Analysis Professional (CBAP)',
        issuer: 'IIBA',
        issueDate: '2019',
      },
    ],
  },

  // 2. Priya Nair - Senior Data Analyst & BI Specialist
  priya_nair: {
    personalInfo: {
      fullName: 'Priya Nair',
      jobTitle: 'Senior Data Analyst & BI Specialist',
      email: 'priya.nair@analytics.io',
      phone: '+1 (415) 555-0142',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/priyanair-bi',
      github: 'github.com/priyanair-data',
      website: 'priyanair.me',
    },
    summaryTitle: 'Professional Summary',
    summary:
      'Data Analyst with 5+ years translating millions of complex telemetry and revenue records into self-serve Tableau & Power BI dashboards, automated SQL models, and predictive business decisions.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Stripe Analytics Lab',
        role: 'Senior Data Analyst',
        location: 'San Francisco, CA',
        startDate: 'May 2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Designed Snowflake data pipeline and 14 executive Tableau dashboards tracking $420M monthly GMV.',
          'Automated daily churn forecasting in dbt and BigQuery, cutting forecasting cycle time from 3 days to 40 minutes.',
          'Partnered with product managers to conduct 30+ A/B experiments, improving onboarding checkout conversion by 4.2%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'UC Berkeley',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Data Science & Applied Statistics',
        location: 'Berkeley, CA',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.88 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Analytics & BI',
        skills: [
          { id: 'sk-1', name: 'SQL (Snowflake / BigQuery)', level: 'Expert' },
          { id: 'sk-2', name: 'Python (Pandas, NumPy, Matplotlib)', level: 'Advanced' },
          { id: 'sk-3', name: 'Tableau & Power BI Dashboards', level: 'Expert' },
          { id: 'sk-4', name: 'dbt & Data Modeling', level: 'Intermediate' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [
      {
        id: 'proj-1',
        title: 'SaaS Churn Intelligence Pipeline',
        technologies: ['Python', 'SQL', 'Snowflake', 'Streamlit'],
        bullets: [
          'Engineered random forest model forecasting B2B churn with 89% precision, saving $1.2M in annual recurring revenue.',
        ],
      },
    ],
    certifications: [],
  },

  // 3. Daniel Okafor - Senior Full Stack Cloud Engineer
  daniel_okafor: {
    personalInfo: {
      fullName: 'Daniel Okafor',
      jobTitle: 'Senior Full Stack Cloud Engineer',
      email: 'daniel.okafor@devcloud.com',
      phone: '+1 (206) 555-0193',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/danielokafor-cloud',
      github: 'github.com/danielokafor',
      website: '',
    },
    summaryTitle: 'Technical Summary',
    summary:
      'Full Stack Cloud Architect with 7+ years constructing high-throughput microservices in TypeScript, Go, and AWS serverless architectures handling 50k+ requests per second with 99.99% availability.',
    experiences: [
      {
        id: 'exp-1',
        company: 'CloudScale Systems',
        role: 'Lead Cloud Engineer',
        location: 'Seattle, WA',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected Kubernetes microservices gateway reducing p99 API response latencies from 320ms to 48ms.',
          'Spearheaded migration of legacy monolith to Node.js / Go event-driven architecture deployed on AWS ECS.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Washington',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        location: 'Seattle, WA',
        startDate: '2014',
        endDate: '2018',
        gpa: '3.92 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Languages & Tools',
        skills: [
          { id: 'sk-1', name: 'TypeScript & Node.js', level: 'Expert' },
          { id: 'sk-2', name: 'Go (Golang)', level: 'Advanced' },
          { id: 'sk-3', name: 'React & Next.js', level: 'Expert' },
          { id: 'sk-4', name: 'AWS & Kubernetes (EKS)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Professional',
        issuer: 'Amazon Web Services',
        issueDate: '2023',
      },
    ],
  },

  // 4. Sofia Martinez - Emergency & Critical Care Nurse (Healthcare)
  sofia_martinez: {
    personalInfo: {
      fullName: 'Sofia Martinez, BSN, RN',
      jobTitle: 'Critical Care & Emergency Nurse',
      email: 's.martinez.rn@healthmail.org',
      phone: '+1 (305) 555-0177',
      location: 'Miami, FL',
      linkedin: 'linkedin.com/in/sofiamartinez-rn',
      github: '',
      website: '',
    },
    summaryTitle: 'Clinical Summary',
    summary:
      'Compassionate Registered Nurse with 6+ years in Level 1 Trauma Emergency Rooms. Certified in ACLS, BLS, and PALS with proven leadership during rapid triage and patient stabilization.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Jackson Memorial Hospital',
        role: 'Staff Registered Nurse – Trauma ER',
        location: 'Miami, FL',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Manage rapid triage, hemodynamic monitoring, and acute resuscitation for 25+ trauma patients per 12-hour shift.',
          'Reduced ER door-to-balloon time by 18% through multidisciplinary protocol alignment.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Miami School of Nursing',
        degree: 'Bachelor of Science in Nursing (BSN)',
        fieldOfStudy: 'Nursing Practice',
        location: 'Coral Gables, FL',
        startDate: '2014',
        endDate: '2018',
        gpa: '3.8 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Clinical Competencies',
        skills: [
          { id: 'sk-1', name: 'Trauma Triage & Acute Resuscitation', level: 'Expert' },
          { id: 'sk-2', name: 'Hemodynamic & Vent Monitoring', level: 'Expert' },
          { id: 'sk-3', name: 'Epic EHR & Medication Dispensation', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [
      {
        id: 'cert-1',
        name: 'Advanced Cardiovascular Life Support (ACLS)',
        issuer: 'American Heart Association',
        issueDate: '2024',
      },
    ],
  },

  // 5. Arjun Mehta - CS Graduate & Fresher
  arjun_mehta: {
    personalInfo: {
      fullName: 'Arjun Mehta',
      jobTitle: 'Graduate Software Engineer',
      email: 'arjun.mehta@alumni.edu',
      phone: '+1 (617) 555-0182',
      location: 'Boston, MA',
      linkedin: 'linkedin.com/in/arjunmehta-dev',
      github: 'github.com/arjunmehta',
      website: '',
    },
    summaryTitle: 'Objective',
    summary:
      'Computer Science graduate with strong algorithms fundamentals, high-impact open-source contributions, and internship experience developing scalable RESTful services in Java and Python.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Akamai Technologies',
        role: 'Software Engineering Intern',
        location: 'Cambridge, MA',
        startDate: 'May 2023',
        endDate: 'Aug 2023',
        current: false,
        bullets: [
          'Engineered caching benchmark CLI in Go, speeding up local test suite execution by 45%.',
          'Authored unit and integration test suites achieving 94% code coverage across authentication microservices.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Northeastern University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science (Honors)',
        location: 'Boston, MA',
        startDate: '2020',
        endDate: '2024',
        gpa: '3.91 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Technical Skills',
        skills: [
          { id: 'sk-1', name: 'Java & Spring Boot', level: 'Advanced' },
          { id: 'sk-2', name: 'Python & Data Structures', level: 'Advanced' },
          { id: 'sk-3', name: 'Git, Docker, CI/CD', level: 'Intermediate' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [
      {
        id: 'proj-1',
        title: 'Distributed Key-Value Store',
        technologies: ['Java', 'Raft Consensus', 'gRPC'],
        bullets: [
          'Implemented Raft leader election and log replication handling node failures transparently.',
        ],
      },
    ],
    certifications: [],
  },

  // 6. Emily Carter - VP of Growth & Product Marketing
  emily_carter: {
    personalInfo: {
      fullName: 'Emily Carter',
      jobTitle: 'VP of Growth & Product Marketing',
      email: 'emily.carter@growthexec.co',
      phone: '+1 (512) 555-0129',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/emilycarter-growth',
      github: '',
      website: '',
    },
    summaryTitle: 'Executive Summary',
    summary:
      'Growth executive with 10+ years scaling B2B SaaS ARR from $5M to $65M. Expert in PLG funnels, multi-touch attribution, sales enablement, and enterprise demand generation.',
    experiences: [
      {
        id: 'exp-1',
        company: 'CloudVentures SaaS',
        role: 'VP of Growth Marketing',
        location: 'Austin, TX',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Scaled annual recurring revenue from $12M to $48M through high-intent content, paid acquisition, and product-led signups.',
          'Managed $6M annual marketing budget delivering an overall 4.3x customer acquisition payback ratio.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'UT Austin – McCombs School of Business',
        degree: 'BBA',
        fieldOfStudy: 'Marketing & Economics',
        location: 'Austin, TX',
        startDate: '2010',
        endDate: '2014',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Leadership & Marketing',
        skills: [
          { id: 'sk-1', name: 'Product-Led Growth (PLG)', level: 'Expert' },
          { id: 'sk-2', name: 'Demand Generation & SEM', level: 'Expert' },
          { id: 'sk-3', name: 'Multi-Touch Attribution', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 7. Liam Chen - Senior Investment Banking Analyst
  liam_chen: {
    personalInfo: {
      fullName: 'Liam Chen',
      jobTitle: 'Senior Investment Banking Analyst',
      email: 'liam.chen@financecapital.com',
      phone: '+1 (212) 555-0164',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/liamchen-ib',
      github: '',
      website: '',
    },
    summaryTitle: 'Professional Profile',
    summary:
      'Wall Street Analyst with 4+ years of cross-border M&A advisory experience. Built 50+ discounted cash flow (DCF), LBO, and accretion/dilution models for transactions exceeding $3.8B in total value.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Goldman Sachs & Co.',
        role: 'Investment Banking Analyst – TMT Group',
        location: 'New York, NY',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Built comprehensive three-statement financial models, LBO analyses, and fairness opinions for $1.8B tech acquisition.',
          'Authored confidential information memorandums (CIM) and pitch decks for board presentations.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Wharton School – University of Pennsylvania',
        degree: 'Bachelor of Science in Economics',
        fieldOfStudy: 'Finance & Statistics (Summa Cum Laude)',
        location: 'Philadelphia, PA',
        startDate: '2017',
        endDate: '2021',
        gpa: '3.95 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Financial Expertise',
        skills: [
          { id: 'sk-1', name: 'LBO & DCF Financial Modeling', level: 'Expert' },
          { id: 'sk-2', name: 'M&A Valuation & Pitch Books', level: 'Expert' },
          { id: 'sk-3', name: 'Capital IQ & Bloomberg Terminal', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [
      { id: 'cert-1', name: 'Series 79 & Series 63 Licensed', issuer: 'FINRA', issueDate: '2021' },
    ],
  },

  // 8. Aisha Khan - Staff Machine Learning & AI Engineer
  aisha_khan: {
    personalInfo: {
      fullName: 'Aisha Khan',
      jobTitle: 'Staff Machine Learning Engineer',
      email: 'aisha.khan@ai-research.org',
      phone: '+1 (650) 555-0133',
      location: 'Palo Alto, CA',
      linkedin: 'linkedin.com/in/aishakhan-ml',
      github: 'github.com/aishakhan-ai',
      website: '',
    },
    summaryTitle: 'AI Research & Engineering Profile',
    summary:
      'Staff ML Engineer with 7+ years pioneering LLM fine-tuning, retrieval-augmented generation (RAG), and model distillation for enterprise production clusters.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Anthropic Labs',
        role: 'Senior Machine Learning Engineer',
        location: 'San Francisco, CA',
        startDate: '2022',
        endDate: 'Present',
        current: true,
        bullets: [
          'Engineered vLLM inference optimization pipelines cutting generation latency by 55% at scale.',
          'Trained domain-specific 7B/13B parameter language models using LoRA and QLoRA on distributed GPUs.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Stanford University',
        degree: 'Master of Science',
        fieldOfStudy: 'Artificial Intelligence & Computer Science',
        location: 'Stanford, CA',
        startDate: '2016',
        endDate: '2018',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Machine Learning',
        skills: [
          { id: 'sk-1', name: 'PyTorch & Transformers', level: 'Expert' },
          { id: 'sk-2', name: 'vLLM & TensorRT-LLM', level: 'Expert' },
          { id: 'sk-3', name: 'Vector Databases & RAG', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 9. Marcus Vance - Senior Product Manager
  marcus_vance: {
    personalInfo: {
      fullName: 'Marcus Vance',
      jobTitle: 'Senior Product Manager',
      email: 'marcus.vance@productpro.com',
      phone: '+1 (312) 555-0155',
      location: 'Chicago, IL',
      linkedin: 'linkedin.com/in/marcusvance-pm',
      github: '',
      website: '',
    },
    summaryTitle: 'Executive Profile',
    summary:
      'Data-driven Product Leader with 8+ years steering cross-functional teams of engineers, designers, and marketers to build enterprise B2B fintech workflows with measurable business value.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Morningstar Inc.',
        role: 'Senior Product Manager',
        location: 'Chicago, IL',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Owned roadmap for advisor analytics portal serving 45,000 active institutional users daily.',
          'Increased product NPS from 42 to 68 through systematic user interviews and simplified data visualizer tools.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Northwestern University – Kellogg School',
        degree: 'MBA',
        fieldOfStudy: 'Technology Strategy',
        location: 'Evanston, IL',
        startDate: '2016',
        endDate: '2018',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Product Execution',
        skills: [
          { id: 'sk-1', name: 'Product Roadmapping & PRDs', level: 'Expert' },
          { id: 'sk-2', name: 'User Research & Prototyping', level: 'Advanced' },
          { id: 'sk-3', name: 'Agile & OKR Frameworks', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [],
  },

  // 10. Elena Rostova - Lead UX/UI Designer
  elena_rostova: {
    personalInfo: {
      fullName: 'Elena Rostova',
      jobTitle: 'Lead UX/UI & Product Designer',
      email: 'elena.rostova@designworks.io',
      phone: '+1 (415) 555-0199',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/elenarostova-design',
      github: '',
      website: 'elenarostova.design',
    },
    summaryTitle: 'Design Philosophy',
    summary:
      'Human-centered Lead Product Designer with 7+ years designing enterprise design systems, accessibility-first component libraries (WCAG AAA), and intuitive SaaS user interfaces in Figma.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Figma Design Partners',
        role: 'Lead Product Designer',
        location: 'San Francisco, CA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Built unified design system token library adopted across 12 product teams, reducing design QA cycles by 60%.',
          'Conducted over 120 moderated usability sessions informing end-to-end checkout redesign.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Rhode Island School of Design (RISD)',
        degree: 'BFA',
        fieldOfStudy: 'Graphic & Interaction Design',
        location: 'Providence, RI',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Design Systems',
        skills: [
          { id: 'sk-1', name: 'Figma & Design Tokens', level: 'Expert' },
          { id: 'sk-2', name: 'Design Systems Architecture', level: 'Expert' },
          { id: 'sk-3', name: 'Accessibility (WCAG 2.1 AA)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 11. David Kim - Enterprise Software Sales Executive
  david_kim: {
    personalInfo: {
      fullName: 'David Kim',
      jobTitle: 'VP of Enterprise Software Sales',
      email: 'david.kim@salesexecutive.com',
      phone: '+1 (404) 555-0167',
      location: 'Atlanta, GA',
      linkedin: 'linkedin.com/in/davidkim-sales',
      github: '',
      website: '',
    },
    summaryTitle: 'Sales Track Record',
    summary:
      'Top-performing Enterprise B2B Sales Executive with 12+ years exceeding quotas (142% average). Closed $35M+ in lifetime contract value across Fortune 500 manufacturing and financial accounts.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Salesforce Enterprise',
        role: 'Enterprise Strategic Account Executive',
        location: 'Atlanta, GA',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Closed largest multi-year CRM renewal in region valued at $8.4M ARR.',
          'Maintained 138% quota attainment over four consecutive fiscal years.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Emory University – Goizueta Business School',
        degree: 'BBA',
        fieldOfStudy: 'Finance & Marketing',
        location: 'Atlanta, GA',
        startDate: '2008',
        endDate: '2012',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Sales Competencies',
        skills: [
          { id: 'sk-1', name: 'MEDDPICC & Challenger Methodology', level: 'Expert' },
          { id: 'sk-2', name: 'Executive C-Suite Presentations', level: 'Expert' },
          { id: 'sk-3', name: 'Contract Negotiations & Quota Attainment', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [],
  },

  // 12. Chloe Bennett - Senior Talent Acquisition Partner
  chloe_bennett: {
    personalInfo: {
      fullName: 'Chloe Bennett',
      jobTitle: 'Senior Talent Acquisition Partner',
      email: 'chloe.bennett@peoplehire.com',
      phone: '+1 (720) 555-0144',
      location: 'Denver, CO',
      linkedin: 'linkedin.com/in/chloebennett-recruiter',
      github: '',
      website: '',
    },
    summaryTitle: 'Talent Acquisition Profile',
    summary:
      'Strategic Technical Recruiter with 7+ years sourcing and closing premier engineering, product, and leadership talent. Built scalable hiring funnels reducing time-to-fill from 62 to 28 days.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Scale AI',
        role: 'Senior Technical Recruiter',
        location: 'Denver, CO',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Hired 64 senior and staff level AI/ML and systems engineers with 91% offer acceptance rate.',
          'Standardized structured rubric interviews improving candidate satisfaction rating to 4.9/5.0.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Colorado Boulder',
        degree: 'BA',
        fieldOfStudy: 'Human Resources & Psychology',
        location: 'Boulder, CO',
        startDate: '2013',
        endDate: '2017',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Recruiting Toolkit',
        skills: [
          { id: 'sk-1', name: 'Technical Sourcing & Headhunting', level: 'Expert' },
          { id: 'sk-2', name: 'Greenhouse & Ashby ATS', level: 'Expert' },
          { id: 'sk-3', name: 'Offer Closing & Compensation Structuring', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [],
  },

  // 13. Lucas Silva - DevOps & Site Reliability Engineer
  lucas_silva: {
    personalInfo: {
      fullName: 'Lucas Silva',
      jobTitle: 'DevOps & Site Reliability Engineer',
      email: 'lucas.silva@opsdev.net',
      phone: '+1 (619) 555-0188',
      location: 'San Diego, CA',
      linkedin: 'linkedin.com/in/lucassilva-sre',
      github: 'github.com/lucassilva-infra',
      website: '',
    },
    summaryTitle: 'Reliability Summary',
    summary:
      'Site Reliability Engineer with 6+ years managing multi-region Kubernetes clusters, Terraform IaC, and Datadog observability across high-traffic cloud environments.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Fastly Edge Networks',
        role: 'Site Reliability Engineer',
        location: 'San Diego, CA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Engineered automated canary deployment pipeline eliminating production release rollback incidents.',
          'Architected zero-downtime disaster recovery failover across AWS us-east-1 and us-west-2.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'UC San Diego',
        degree: 'BS',
        fieldOfStudy: 'Computer Engineering',
        location: 'La Jolla, CA',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Infrastructure',
        skills: [
          { id: 'sk-1', name: 'Terraform & Infrastructure as Code', level: 'Expert' },
          { id: 'sk-2', name: 'Kubernetes (K8s) & Helm', level: 'Expert' },
          { id: 'sk-3', name: 'Prometheus & Datadog Monitoring', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [
      { id: 'cert-1', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', issueDate: '2023' },
    ],
  },

  // 14. Hannah Schmidt - Corporate Legal Counsel
  hannah_schmidt: {
    personalInfo: {
      fullName: 'Hannah Schmidt, Esq.',
      jobTitle: 'Senior Corporate Legal Counsel',
      email: 'hannah.schmidt@counsellaw.com',
      phone: '+1 (202) 555-0158',
      location: 'Washington, DC',
      linkedin: 'linkedin.com/in/hannahschmidt-legal',
      github: '',
      website: '',
    },
    summaryTitle: 'Legal Summary',
    summary:
      'Corporate Attorney with 9+ years advising technology enterprises on commercial agreements, privacy regulations (GDPR/CCPA), intellectual property, and venture financings.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Vanguard Tech Group',
        role: 'Senior Legal Counsel',
        location: 'Washington, DC',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Negotiated over 200 enterprise master services agreements (MSAs) valued at $120M+.',
          'Established global data privacy compliance framework adhering to GDPR, CCPA, and CPRA standards.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Georgetown University Law Center',
        degree: 'Juris Doctor (JD)',
        fieldOfStudy: 'Corporate & Tech Law (Cum Laude)',
        location: 'Washington, DC',
        startDate: '2012',
        endDate: '2015',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Legal Expertise',
        skills: [
          { id: 'sk-1', name: 'Commercial Contract Negotiation (MSA/SOW)', level: 'Expert' },
          { id: 'sk-2', name: 'GDPR / CCPA Data Privacy', level: 'Expert' },
          { id: 'sk-3', name: 'Intellectual Property Licensing', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Admitted to the DC and New York Bar', issuer: 'Bar Association', issueDate: '2015' }],
  },

  // 15. Omar Hassan - Lead Mechanical Design Engineer
  omar_hassan: {
    personalInfo: {
      fullName: 'Omar Hassan, PE',
      jobTitle: 'Lead Mechanical Design Engineer',
      email: 'omar.hassan@engineered.com',
      phone: '+1 (313) 555-0171',
      location: 'Detroit, MI',
      linkedin: 'linkedin.com/in/omarhassan-pe',
      github: '',
      website: '',
    },
    summaryTitle: 'Engineering Summary',
    summary:
      'Licensed Professional Engineer with 8+ years leading mechanical component design, FEA structural stress analysis, and thermal management for electric vehicles and aerospace hardware.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Rivian Automotive',
        role: 'Senior Mechanical Design Engineer',
        location: 'Plymouth, MI',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Designed high-voltage battery enclosure achieving 22% weight reduction while exceeding crash safety standards.',
          'Conducted non-linear finite element analysis (FEA) in ANSYS and CAD modeling in SolidWorks.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Michigan – Ann Arbor',
        degree: 'Master of Science',
        fieldOfStudy: 'Mechanical Engineering',
        location: 'Ann Arbor, MI',
        startDate: '2014',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Engineering & CAD',
        skills: [
          { id: 'sk-1', name: 'SolidWorks & CATIA 3D CAD', level: 'Expert' },
          { id: 'sk-2', name: 'ANSYS FEA & Thermal Analysis', level: 'Expert' },
          { id: 'sk-3', name: 'GD&T (ASME Y14.5) & DFM', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Professional Engineer (PE) License', issuer: 'State Board of Michigan', issueDate: '2018' }],
  },

  // 16. Hannah Taylor - Senior Frontend UI Engineer
  hannah_taylor: {
    personalInfo: {
      fullName: 'Hannah Taylor',
      jobTitle: 'Senior Frontend UI Engineer',
      email: 'hannah.taylor@email.com',
      phone: '+1 (347) 555-0181',
      location: 'Brooklyn, NY',
      linkedin: 'linkedin.com/in/hannahtaylor-ui',
      github: 'github.com/hannahtaylor',
      website: '',
    },
    summaryTitle: 'Professional Profile',
    summary:
      'Specialist Frontend Engineer with 6+ years constructing accessible, pixel-perfect design systems, React web apps, and fluid micro-interactions with TypeScript and modern Tailwind CSS.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Verve Interactive Studio',
        role: 'Senior Frontend Engineer',
        location: 'New York, NY',
        startDate: '2022',
        endDate: 'Present',
        current: true,
        bullets: [
          'Spearhead frontend design system architecture used across 8 consumer-facing web properties.',
          'Reduced bundle sizes by 38% through route splitting, dynamic imports, and modern asset compression.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Cornell University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        location: 'Ithaca, NY',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.86 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Frontend Stack',
        skills: [
          { id: 'sk-1', name: 'React 19 & Next.js', level: 'Expert' },
          { id: 'sk-2', name: 'TypeScript & JavaScript (ES6+)', level: 'Expert' },
          { id: 'sk-3', name: 'Tailwind CSS & Modern CSS', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 17. Sarah Jenkins - STEM Educator (Education / Teaching)
  sarah_jenkins: {
    personalInfo: {
      fullName: 'Sarah Jenkins, M.Ed.',
      jobTitle: 'High School STEM Department Lead',
      email: 'sarah.jenkins@edulearn.org',
      phone: '+1 (617) 555-0214',
      location: 'Cambridge, MA',
      linkedin: 'linkedin.com/in/sarahjenkins-stem',
      github: '',
      website: '',
    },
    summaryTitle: 'Teaching Philosophy',
    summary:
      'Passionate STEM Educator with 9+ years designing project-based AP Physics and Robotics curricula. Champion of inquiry-driven learning and expanding female participation in STEM competitions.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Cambridge Rindge and Latin School',
        role: 'Science Department Chair & AP Physics Teacher',
        location: 'Cambridge, MA',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Increased student AP Physics exam pass rate from 72% to 94% through hands-on laboratory modules.',
          'Coached FIRST Robotics Competition team to regional finals two consecutive years.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Harvard Graduate School of Education',
        degree: 'Master of Education (M.Ed.)',
        fieldOfStudy: 'Science Curriculum & Instruction',
        location: 'Cambridge, MA',
        startDate: '2014',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Pedagogy & Curriculum',
        skills: [
          { id: 'sk-1', name: 'AP Physics & STEM Curriculum Design', level: 'Expert' },
          { id: 'sk-2', name: 'Differentiated Instruction & Inquiry', level: 'Expert' },
          { id: 'sk-3', name: 'Classroom Tech & Lab Safety', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Massachusetts Professional Teaching License', issuer: 'DESE', issueDate: '2016' }],
  },

  // 18. Carlos Ramirez - Civil & Structural Project Lead (Engineering)
  carlos_ramirez: {
    personalInfo: {
      fullName: 'Carlos Ramirez, PE, SE',
      jobTitle: 'Principal Structural Engineer',
      email: 'carlos.ramirez@structures.net',
      phone: '+1 (214) 555-0238',
      location: 'Dallas, TX',
      linkedin: 'linkedin.com/in/carlosramirez-se',
      github: '',
      website: '',
    },
    summaryTitle: 'Structural Profile',
    summary:
      'Licensed Structural Engineer with 11+ years directing seismic analysis, post-tensioned concrete modeling, and steel framing design for $250M+ commercial and airport infrastructure.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Thornton Tomasetti',
        role: 'Senior Project Structural Engineer',
        location: 'Dallas, TX',
        startDate: '2017',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led structural design team on 32-story mixed-use tower in downtown Dallas completed on schedule.',
          'Delivered ETABS non-linear seismic performance assessments reducing structural steel tonnage by 14%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Texas A&M University',
        degree: 'Master of Science',
        fieldOfStudy: 'Structural Engineering',
        location: 'College Station, TX',
        startDate: '2011',
        endDate: '2013',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Engineering Software',
        skills: [
          { id: 'sk-1', name: 'ETABS & SAP2000 Seismic Modeling', level: 'Expert' },
          { id: 'sk-2', name: 'Revit Structure & BIM 360', level: 'Expert' },
          { id: 'sk-3', name: 'AISC & ACI 318 Building Codes', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Licensed Structural Engineer (SE)', issuer: 'Texas Board', issueDate: '2017' }],
  },

  // 19. Zoya Sheikh - Cybersecurity & Incident Response Analyst (Software & IT)
  zoya_sheikh: {
    personalInfo: {
      fullName: 'Zoya Sheikh, CISSP',
      jobTitle: 'Lead Security Operations Analyst',
      email: 'zoya.sheikh@secops.io',
      phone: '+1 (703) 555-0261',
      location: 'McLean, VA',
      linkedin: 'linkedin.com/in/zoyasheikh-cyber',
      github: 'github.com/zoyasheikh-sec',
      website: '',
    },
    summaryTitle: 'Cybersecurity Profile',
    summary:
      'Incident Response Analyst with 6+ years hunting advanced persistent threats (APTs), tuning SIEM/SOAR playbooks, and fortifying enterprise cloud boundaries against zero-day exploits.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Mandiant (Google Cloud)',
        role: 'Senior Threat Hunter & IR Consultant',
        location: 'Reston, VA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Remediated 40+ high-severity ransomware and breach investigations across critical finance and healthcare clients.',
          'Created automated Splunk and Sentinel detection rules mitigating MITRE ATT&CK adversary tactics.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'George Mason University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Cyber Security Engineering',
        location: 'Fairfax, VA',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Security Stack',
        skills: [
          { id: 'sk-1', name: 'Incident Response & Digital Forensics', level: 'Expert' },
          { id: 'sk-2', name: 'Splunk / Microsoft Sentinel SIEM', level: 'Expert' },
          { id: 'sk-3', name: 'MITRE ATT&CK & Threat Hunting', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Certified Information Systems Security Professional (CISSP)', issuer: 'ISC2', issueDate: '2022' }],
  },

  // 20. Matthew Brooks - Financial Controller & CPA (Finance & Accounting)
  matthew_brooks: {
    personalInfo: {
      fullName: 'Matthew Brooks, CPA',
      jobTitle: 'Corporate Financial Controller',
      email: 'matthew.brooks@fincontrol.com',
      phone: '+1 (312) 555-0289',
      location: 'Chicago, IL',
      linkedin: 'linkedin.com/in/matthewbrooks-cpa',
      github: '',
      website: '',
    },
    summaryTitle: 'Controller Summary',
    summary:
      'Certified Public Accountant with 10+ years overseeing GAAP financial reporting, SOX compliance audits, treasury operations, and month-end closes for fast-scaling enterprises.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Groupon Inc.',
        role: 'Assistant Controller',
        location: 'Chicago, IL',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Direct team of 14 accountants closing books within 4 business days each month.',
          'Spearheaded NetSuite ERP automation saving 120 staff hours monthly and eliminating audit deficiencies.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Illinois Urbana-Champaign',
        degree: 'Master of Accounting Science (MAS)',
        fieldOfStudy: 'Accountancy',
        location: 'Champaign, IL',
        startDate: '2012',
        endDate: '2014',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Accounting & Systems',
        skills: [
          { id: 'sk-1', name: 'GAAP Reporting & SOX 404', level: 'Expert' },
          { id: 'sk-2', name: 'NetSuite ERP & Workday Financials', level: 'Expert' },
          { id: 'sk-3', name: 'Treasury & Cash Flow Management', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Certified Public Accountant (CPA)', issuer: 'Illinois Board', issueDate: '2014' }],
  },

  // 21. Ananya Deshmukh - Junior Data Scientist & ML Intern (Fresher / Student)
  ananya_deshmukh: {
    personalInfo: {
      fullName: 'Ananya Deshmukh',
      jobTitle: 'Junior Data Scientist',
      email: 'ananya.deshmukh@grad.edu',
      phone: '+1 (408) 555-0247',
      location: 'San Jose, CA',
      linkedin: 'linkedin.com/in/ananyadeshmukh-ds',
      github: 'github.com/ananya-ds',
      website: '',
    },
    summaryTitle: 'Education & Career Goal',
    summary:
      'Recent Data Science graduate skilled in predictive modeling, NLP feature extraction, and exploratory analysis in Python (Pandas, Scikit-Learn) seeking an entry-level Data Scientist role.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Adobe Data Insights Lab',
        role: 'Data Science Intern',
        location: 'San Jose, CA',
        startDate: 'May 2024',
        endDate: 'Aug 2024',
        current: false,
        bullets: [
          'Engineered customer churn classifier with XGBoost improving prediction recall from 68% to 83%.',
          'Created automated reporting scripts generating weekly statistical summaries for product managers.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'San Jose State University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Data Science & Statistics',
        location: 'San Jose, CA',
        startDate: '2020',
        endDate: '2024',
        gpa: '3.87 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Languages & Tools',
        skills: [
          { id: 'sk-1', name: 'Python, Pandas, NumPy, Scikit-Learn', level: 'Advanced' },
          { id: 'sk-2', name: 'SQL & PostgreSQL Queries', level: 'Advanced' },
          { id: 'sk-3', name: 'Data Visualization (Seaborn, Plotly)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [
      {
        id: 'proj-1',
        title: 'Credit Risk Scoring ML Model',
        technologies: ['Python', 'XGBoost', 'Streamlit', 'Docker'],
        bullets: ['Trained and deployed credit scoring pipeline on AWS with 0.89 ROC-AUC score.'],
      },
    ],
    certifications: [],
  },

  // 22. Vikram Patel - Supply Chain & Operations Director (Business & Management)
  vikram_patel: {
    personalInfo: {
      fullName: 'Vikram Patel',
      jobTitle: 'Director of Supply Chain Operations',
      email: 'vikram.patel@globalops.com',
      phone: '+1 (732) 555-0275',
      location: 'Newark, NJ',
      linkedin: 'linkedin.com/in/vikrampatel-ops',
      github: '',
      website: '',
    },
    summaryTitle: 'Executive Summary',
    summary:
      'Supply chain executive with 13+ years transforming global logistics, procurement, and warehouse inventory systems. Delivered $18M in cumulative freight and fulfillment cost reductions.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Wayfair Supply Chain',
        role: 'Director of Regional Logistics',
        location: 'Edison, NJ',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Oversaw 850k sq. ft. fulfillment center managing 1,200 warehouse associates and 99.4% on-time ship rate.',
          'Negotiated 3PL ocean and intermodal carrier contracts driving 16% freight margin improvement.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Rutgers Business School',
        degree: 'Master of Science',
        fieldOfStudy: 'Supply Chain Management',
        location: 'New Brunswick, NJ',
        startDate: '2009',
        endDate: '2011',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Operations',
        skills: [
          { id: 'sk-1', name: 'Warehouse Management Systems (WMS/SAP)', level: 'Expert' },
          { id: 'sk-2', name: 'Strategic Sourcing & Vendor Contracts', level: 'Expert' },
          { id: 'sk-3', name: 'Lean Six Sigma Black Belt', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Lean Six Sigma Black Belt (LSSBB)', issuer: 'ASQ', issueDate: '2016' }],
  },

  // 23. Rachel Adams - Pediatric Nurse Practitioner (Healthcare)
  rachel_adams: {
    personalInfo: {
      fullName: 'Rachel Adams, DNP, CPNP-PC',
      jobTitle: 'Pediatric Nurse Practitioner',
      email: 'rachel.adams@pedscare.org',
      phone: '+1 (503) 555-0219',
      location: 'Portland, OR',
      linkedin: 'linkedin.com/in/racheladams-pnp',
      github: '',
      website: '',
    },
    summaryTitle: 'Clinical Summary',
    summary:
      'Dedicated Pediatric Nurse Practitioner with 8+ years delivering outpatient primary care, developmental evaluations, and acute pediatric illness management to diverse patient communities.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Doernbecher Children’s Hospital',
        role: 'Pediatric Nurse Practitioner',
        location: 'Portland, OR',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Provide autonomous diagnostic evaluations, developmental screenings, and treatment plans for 20+ pediatric patients daily.',
          'Reduced clinic wait times by 22% by instituting an evidence-based clinical triage intake protocol.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Oregon Health & Science University (OHSU)',
        degree: 'Doctor of Nursing Practice (DNP)',
        fieldOfStudy: 'Pediatric Primary Care',
        location: 'Portland, OR',
        startDate: '2015',
        endDate: '2018',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Clinical Competencies',
        skills: [
          { id: 'sk-1', name: 'Pediatric Physical & Developmental Exam', level: 'Expert' },
          { id: 'sk-2', name: 'Pediatric Pharmacology & Care Plans', level: 'Expert' },
          { id: 'sk-3', name: 'Parent Education & Vaccine Advocacy', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Certified Pediatric Nurse Practitioner', issuer: 'PNCB', issueDate: '2018' }],
  },

  // 24. Kevin Zhao - Mobile App Developer (Software & IT)
  kevin_zhao: {
    personalInfo: {
      fullName: 'Kevin Zhao',
      jobTitle: 'Senior Mobile App Developer',
      email: 'kevin.zhao@mobilelabs.io',
      phone: '+1 (310) 555-0283',
      location: 'Santa Monica, CA',
      linkedin: 'linkedin.com/in/kevinzhao-mobile',
      github: 'github.com/kevinzhao-apps',
      website: '',
    },
    summaryTitle: 'Mobile Engineering Profile',
    summary:
      'Mobile Engineer with 6+ years shipping React Native and native iOS (Swift) apps with over 2M+ combined App Store downloads and 4.8 average star ratings.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Snap Inc. Ecosystem',
        role: 'Senior React Native Engineer',
        location: 'Santa Monica, CA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Engineered core social feed module sustaining 60 FPS scrolling animations across 500k daily active users.',
          'Decreased app crash rate from 0.42% to 0.04% using automated Sentry profiling and memory leak testing.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'UCLA',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        location: 'Los Angeles, CA',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Mobile Tech',
        skills: [
          { id: 'sk-1', name: 'React Native & Expo', level: 'Expert' },
          { id: 'sk-2', name: 'Swift & iOS SDK', level: 'Advanced' },
          { id: 'sk-3', name: 'Redux Toolkit & Offline Sync', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 25. Maya Lin - Brand & Graphic Designer (Creative / Design)
  maya_lin: {
    personalInfo: {
      fullName: 'Maya Lin',
      jobTitle: 'Senior Brand Identity Designer',
      email: 'maya.lin@studiocreative.com',
      phone: '+1 (415) 555-0294',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/mayalin-brand',
      github: '',
      website: 'mayalindesign.co',
    },
    summaryTitle: 'Creative Summary',
    summary:
      'Brand Identity Designer with 7+ years developing visual systems, typography guidelines, and packaging for modern tech and consumer lifestyle brands.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Pentagram Design Affiliate',
        role: 'Senior Visual Brand Designer',
        location: 'San Francisco, CA',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Designed complete rebrand identity for fintech startup that successfully raised $40M Series B.',
          'Authored 140-page brand guidelines covering color theory, custom iconography, and multi-channel asset kits.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'California College of the Arts (CCA)',
        degree: 'BFA',
        fieldOfStudy: 'Graphic Design',
        location: 'San Francisco, CA',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Creative Mastery',
        skills: [
          { id: 'sk-1', name: 'Brand Strategy & Identity Systems', level: 'Expert' },
          { id: 'sk-2', name: 'Adobe Illustrator, Photoshop & InDesign', level: 'Expert' },
          { id: 'sk-3', name: 'Typography & Motion Graphics', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 26. James Wilson - Performance Marketing Director (Sales & Marketing)
  james_wilson: {
    personalInfo: {
      fullName: 'James Wilson',
      jobTitle: 'Director of Performance Marketing',
      email: 'james.wilson@growthmedia.com',
      phone: '+1 (310) 555-0231',
      location: 'Los Angeles, CA',
      linkedin: 'linkedin.com/in/jameswilson-media',
      github: '',
      website: '',
    },
    summaryTitle: 'Performance Profile',
    summary:
      'Performance Marketing Director managing $15M+ annual ad budgets across Google, Meta, and TikTok with a proven track record of maintaining ROAS above 3.5x.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Hims & Hers Health',
        role: 'Director of Paid Acquisition',
        location: 'San Francisco, CA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Scaled monthly paid spend from $600K to $2.2M while reducing customer acquisition cost (CAC) by 19%.',
          'Built proprietary attribution dashboards tracking incrementality and multi-channel blended ROAS.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Southern California',
        degree: 'BS',
        fieldOfStudy: 'Business Administration – Marketing',
        location: 'Los Angeles, CA',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Acquisition Channels',
        skills: [
          { id: 'sk-1', name: 'Paid Search (Google Ads / Performance Max)', level: 'Expert' },
          { id: 'sk-2', name: 'Paid Social (Meta Ads & TikTok Ads)', level: 'Expert' },
          { id: 'sk-3', name: 'Attribution & Conversion Rate Optimization (CRO)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [],
  },

  // 27. Devon Reed - Cloud Solutions Architect (Engineering)
  devon_reed: {
    personalInfo: {
      fullName: 'Devon Reed',
      jobTitle: 'Principal Cloud Solutions Architect',
      email: 'devon.reed@cloudsolutions.com',
      phone: '+1 (425) 555-0211',
      location: 'Bellevue, WA',
      linkedin: 'linkedin.com/in/devonreed-cloud',
      github: 'github.com/devonreed-arch',
      website: '',
    },
    summaryTitle: 'Architecture Profile',
    summary:
      'Cloud Architect with 12+ years engineering mission-critical AWS/GCP infrastructures for Fortune 100 enterprise clients, reducing cloud infrastructure spend by over $4.5M annually.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Slalom Consulting',
        role: 'Principal Cloud Architect',
        location: 'Seattle, WA',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led cloud modernization migrations for 5 enterprise healthcare clients to HIPAA-compliant AWS architectures.',
          'Architected multi-region serverless API pipelines handling 120M transactions per day.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Washington',
        degree: 'MS',
        fieldOfStudy: 'Computer Engineering',
        location: 'Seattle, WA',
        startDate: '2008',
        endDate: '2010',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Cloud & Infrastructure',
        skills: [
          { id: 'sk-1', name: 'AWS & Google Cloud Architecture', level: 'Expert' },
          { id: 'sk-2', name: 'Terraform & CloudFormation IaC', level: 'Expert' },
          { id: 'sk-3', name: 'Cost Optimization (FinOps)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'AWS Solutions Architect Professional', issuer: 'AWS', issueDate: '2023' }],
  },

  // 28. Tariq Mansoor - Quantitative Risk Analyst (Data & Analytics)
  tariq_mansoor: {
    personalInfo: {
      fullName: 'Tariq Mansoor, CQF',
      jobTitle: 'Quantitative Risk Analyst',
      email: 'tariq.mansoor@quantfund.com',
      phone: '+1 (212) 555-0259',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/tariqmansoor-quant',
      github: 'github.com/tariqquant',
      website: '',
    },
    summaryTitle: 'Quantitative Profile',
    summary:
      'Quantitative Risk Analyst with 5+ years constructing Value at Risk (VaR), stress testing models, and high-frequency statistical arbitrage backtests in Python and C++.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Two Sigma Investments',
        role: 'Quantitative Risk Analyst',
        location: 'New York, NY',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Built Monte Carlo portfolio simulation engine running 100k paths over $14B multi-asset portfolios in under 12 seconds.',
          'Formulated factor covariance matrices identifying hidden downside tail exposures.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Columbia University',
        degree: 'Master of Science',
        fieldOfStudy: 'Financial Engineering (MSFE)',
        location: 'New York, NY',
        startDate: '2019',
        endDate: '2021',
        gpa: '3.94 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Quant Toolkit',
        skills: [
          { id: 'sk-1', name: 'Python (NumPy, SciPy, Numba) & C++', level: 'Expert' },
          { id: 'sk-2', name: 'Monte Carlo & Historical VaR Modeling', level: 'Expert' },
          { id: 'sk-3', name: 'Stochastic Calculus & Time-Series', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Certificate in Quantitative Finance (CQF)', issuer: 'Fitch Learning', issueDate: '2022' }],
  },

  // 29. Amanda Cross - Elementary School Principal (Education / Teaching)
  amanda_cross: {
    personalInfo: {
      fullName: 'Amanda Cross, Ed.D.',
      jobTitle: 'Elementary School Principal',
      email: 'amanda.cross@k12schools.org',
      phone: '+1 (614) 555-0227',
      location: 'Columbus, OH',
      linkedin: 'linkedin.com/in/amandacross-leader',
      github: '',
      website: '',
    },
    summaryTitle: 'Educational Leadership',
    summary:
      'Educational Leader with 14+ years advancing literacy scores, teacher retention, and parent engagement across urban and suburban public school districts.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Oakridge Elementary School',
        role: 'School Principal',
        location: 'Columbus, OH',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led staff of 52 educators and 640 students to state Blue Ribbon School of Excellence recognition.',
          'Elevated 3rd-grade reading proficiency from 64% to 88% through structured phonics literacy coaching.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Ohio State University',
        degree: 'Doctor of Education (Ed.D.)',
        fieldOfStudy: 'Educational Administration',
        location: 'Columbus, OH',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Leadership Competencies',
        skills: [
          { id: 'sk-1', name: 'Instructional Leadership & Teacher Coaching', level: 'Expert' },
          { id: 'sk-2', name: 'District Budgeting & Grant Management', level: 'Expert' },
          { id: 'sk-3', name: 'School Safety & Community Relations', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Superintendent & Principal Licensure', issuer: 'Ohio Dept of Education', issueDate: '2016' }],
  },

  // 30. Felix Bauer - Senior Python Backend Architect (Software & IT)
  felix_bauer: {
    personalInfo: {
      fullName: 'Felix Bauer',
      jobTitle: 'Senior Python Backend Architect',
      email: 'felix.bauer@backendscale.de',
      phone: '+49 30 555-0272',
      location: 'Berlin, Germany',
      linkedin: 'linkedin.com/in/felixbauer-py',
      github: 'github.com/felixbauer-dev',
      website: '',
    },
    summaryTitle: 'Architecture Profile',
    summary:
      'Backend Systems Architect with 8+ years designing high-throughput asynchronous microservices in Python (FastAPI, AsyncIO), PostgreSQL, and Redis caching layers.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Delivery Hero SE',
        role: 'Lead Backend Engineer',
        location: 'Berlin, Germany',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected order dispatch engine processing 300 orders/sec with sub-50ms database transactions.',
          'Refactored Django ORM queries with PostgreSQL indexing and partition schemes, reducing DB CPU load by 48%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Technical University of Berlin',
        degree: 'Master of Science',
        fieldOfStudy: 'Computer Science',
        location: 'Berlin, Germany',
        startDate: '2013',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Backend Tech',
        skills: [
          { id: 'sk-1', name: 'Python (FastAPI, AsyncIO, Django)', level: 'Expert' },
          { id: 'sk-2', name: 'PostgreSQL Query Optimization & Partitioning', level: 'Expert' },
          { id: 'sk-3', name: 'RabbitMQ, Kafka & Redis', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 31. Natasha Ivanov - Executive Operations Manager (Business & Management)
  natasha_ivanov: {
    personalInfo: {
      fullName: 'Natasha Ivanov',
      jobTitle: 'Executive Operations Manager',
      email: 'natasha.ivanov@execops.com',
      phone: '+1 (415) 555-0248',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/natashaivanov-ops',
      github: '',
      website: '',
    },
    summaryTitle: 'Operations Summary',
    summary:
      'High-impact Operations Manager with 7+ years orchestrating C-suite executive support, global board logistics, company-wide quarterly OKR tracking, and workplace expansion.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Brex Tech',
        role: 'Senior Executive Operations Manager',
        location: 'San Francisco, CA',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Manage end-to-end operational rhythms, board meetings, and offsite events for CEO and executive leadership team.',
          'Reduced executive administrative overhead by 35% through Notion and Slack workflow automations.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'UC Davis',
        degree: 'BA',
        fieldOfStudy: 'Communications & Business',
        location: 'Davis, CA',
        startDate: '2013',
        endDate: '2017',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Executive Operations',
        skills: [
          { id: 'sk-1', name: 'C-Suite & Board Governance Support', level: 'Expert' },
          { id: 'sk-2', name: 'Cross-Functional Project Coordination', level: 'Expert' },
          { id: 'sk-3', name: 'Asana, Notion & Workflow Automation', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [],
  },

  // 32. Jordan Lee - Junior Frontend Developer (Fresher / Student)
  jordan_lee: {
    personalInfo: {
      fullName: 'Jordan Lee',
      jobTitle: 'Junior Frontend Developer',
      email: 'jordan.lee@freshdev.io',
      phone: '+1 (206) 555-0268',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/jordanlee-dev',
      github: 'github.com/jordanlee-code',
      website: '',
    },
    summaryTitle: 'Career Objective',
    summary:
      'Enthusiastic Junior Developer skilled in TypeScript, React, Tailwind CSS, and Git version control. Built responsive full-stack applications with clean component architecture and REST API integrations.',
    experiences: [
      {
        id: 'exp-1',
        company: 'CodeForge Academy',
        role: 'Full-Stack Developer Resident',
        location: 'Seattle, WA',
        startDate: 'Jan 2024',
        endDate: 'Jul 2024',
        current: false,
        bullets: [
          'Engineered responsive collaborative Kanban task board using React 18, TypeScript, and Supabase auth.',
          'Maintained 100% test pass rate across Jest and React Testing Library test suites.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Western Washington University',
        degree: 'BS',
        fieldOfStudy: 'Informatics & Web Computing',
        location: 'Bellingham, WA',
        startDate: '2020',
        endDate: '2024',
        gpa: '3.82 GPA',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Core Web Tech',
        skills: [
          { id: 'sk-1', name: 'React 18 & TypeScript', level: 'Intermediate' },
          { id: 'sk-2', name: 'Tailwind CSS & Responsive Design', level: 'Advanced' },
          { id: 'sk-3', name: 'Git, GitHub, Vercel Deployment', level: 'Intermediate' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [
      {
        id: 'proj-1',
        title: 'TaskFlow Pro – Kanban Management App',
        technologies: ['React', 'TypeScript', 'Tailwind', 'Supabase'],
        bullets: ['Deployed live productivity app with drag-and-drop task sorting and real-time syncing.'],
      },
    ],
    certifications: [],
  },

  // 33. Patricia Gomez - Hospital Quality & Safety Director (Healthcare)
  patricia_gomez: {
    personalInfo: {
      fullName: 'Patricia Gomez, RN, CPHQ',
      jobTitle: 'Director of Healthcare Quality & Patient Safety',
      email: 'patricia.gomez@healthsafety.org',
      phone: '+1 (602) 555-0215',
      location: 'Phoenix, AZ',
      linkedin: 'linkedin.com/in/patriciagomez-cphq',
      github: '',
      website: '',
    },
    summaryTitle: 'Healthcare Quality Profile',
    summary:
      'Certified Healthcare Quality Professional with 12+ years driving hospital accreditation (Joint Commission), patient fall prevention, and clinical safety protocol compliance.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Banner Health System',
        role: 'Director of Clinical Quality',
        location: 'Phoenix, AZ',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Achieved zero Joint Commission deficiency findings across 450-bed regional medical facility.',
          'Decreased hospital-acquired infections (HAI) by 34% by instituting standardized central-line insertion bundles.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Arizona State University',
        degree: 'Master of Science',
        fieldOfStudy: 'Healthcare Quality & Safety',
        location: 'Tempe, AZ',
        startDate: '2011',
        endDate: '2013',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Quality & Accreditation',
        skills: [
          { id: 'sk-1', name: 'Joint Commission & CMS Regulatory Audits', level: 'Expert' },
          { id: 'sk-2', name: 'Root Cause Analysis (RCA) & FMEA', level: 'Expert' },
          { id: 'sk-3', name: 'Clinical Quality Metrics (HEDIS / Leapfrog)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Certified Professional in Healthcare Quality (CPHQ)', issuer: 'NAHQ', issueDate: '2015' }],
  },

  // 34. Simon Fraser - Corporate Tax Strategist (Finance & Accounting)
  simon_fraser: {
    personalInfo: {
      fullName: 'Simon Fraser, CPA, MST',
      jobTitle: 'Senior Corporate Tax Director',
      email: 'simon.fraser@taxadvisory.com',
      phone: '+1 (617) 555-0291',
      location: 'Boston, MA',
      linkedin: 'linkedin.com/in/simonfraser-tax',
      github: '',
      website: '',
    },
    summaryTitle: 'Tax Advisory Profile',
    summary:
      'Corporate Tax Specialist with 10+ years optimizing federal, multi-state, and cross-border corporate tax provisions (ASC 740), R&D tax credits, and transfer pricing strategies.',
    experiences: [
      {
        id: 'exp-1',
        company: 'PwC US',
        role: 'Tax Director – Tech Practice',
        location: 'Boston, MA',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Delivered $14M in verified R&D tax credit savings for rapid-growth biotechnology and SaaS clients.',
          'Advised C-level clients on tax structuring for $600M+ international acquisition transactions.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Bentley University',
        degree: 'Master of Science in Taxation (MST)',
        fieldOfStudy: 'Corporate Taxation',
        location: 'Waltham, MA',
        startDate: '2011',
        endDate: '2013',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Tax Specializations',
        skills: [
          { id: 'sk-1', name: 'ASC 740 Tax Provision & Compliance', level: 'Expert' },
          { id: 'sk-2', name: 'Section 41 R&D Credit Structuring', level: 'Expert' },
          { id: 'sk-3', name: 'Cross-Border Transfer Pricing', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'Licensed CPA in Massachusetts', issuer: 'MA Board', issueDate: '2014' }],
  },

  // 35. Clara Schumann - Content Strategist & Copy Director (Creative / Design)
  clara_schumann: {
    personalInfo: {
      fullName: 'Clara Schumann',
      jobTitle: 'Content Strategy & Editorial Director',
      email: 'clara.schumann@wordsmith.io',
      phone: '+1 (917) 555-0235',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/claraschumann-content',
      github: '',
      website: 'claraschumann.com',
    },
    summaryTitle: 'Editorial Profile',
    summary:
      'Editorial Director with 8+ years crafting brand tone of voice, content architecture, and narrative storytelling for global consumer platforms and tech publications.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Medium Inc.',
        role: 'Senior Content Strategy Lead',
        location: 'New York, NY',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led content revamp across product surfaces, increasing organic blog traffic by 140% to 3.8M monthly readers.',
          'Established company style guide and editorial governance framework utilized by 80+ distributed writers.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Columbia University',
        degree: 'BA',
        fieldOfStudy: 'English Literature & Journalism',
        location: 'New York, NY',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Content Capabilities',
        skills: [
          { id: 'sk-1', name: 'Brand Voice & Content Strategy', level: 'Expert' },
          { id: 'sk-2', name: 'SEO Copywriting & Long-Form Editorial', level: 'Expert' },
          { id: 'sk-3', name: 'Content Audits & Information Architecture', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 36. Brandon Cole - SaaS B2B Enterprise Account Executive (Sales & Marketing)
  brandon_cole: {
    personalInfo: {
      fullName: 'Brandon Cole',
      jobTitle: 'Senior Enterprise Account Executive',
      email: 'brandon.cole@enterprisesoft.com',
      phone: '+1 (512) 555-0284',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/brandoncole-saas',
      github: '',
      website: '',
    },
    summaryTitle: 'Sales Record',
    summary:
      'Enterprise Account Executive with 8+ years closing six- and seven-figure ARR software deals with Fortune 500 security and IT leaders, averaging 135% quota attainment.',
    experiences: [
      {
        id: 'exp-1',
        company: 'CrowdStrike',
        role: 'Senior Enterprise Account Executive',
        location: 'Austin, TX',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Achieved $3.8M in net-new ARR against a $2.6M annual quota (146% of quota).',
          'Sourced and closed $1.4M 3-year cybersecurity contract with major regional banking conglomerate.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Baylor University',
        degree: 'BBA',
        fieldOfStudy: 'Professional Selling & Entrepreneurship',
        location: 'Waco, TX',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Sales Skills',
        skills: [
          { id: 'sk-1', name: 'Complex Deal Structuring & C-Suite Closing', level: 'Expert' },
          { id: 'sk-2', name: 'Salesforce CRM & Gong Deal Intelligence', level: 'Expert' },
          { id: 'sk-3', name: 'Pipeline Generation & Outbound Strategy', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [],
  },

  // 37. Samuel Osei - Embedded Firmware Engineer (Engineering)
  samuel_osei: {
    personalInfo: {
      fullName: 'Samuel Osei',
      jobTitle: 'Staff Embedded Firmware Engineer',
      email: 'samuel.osei@iotembedded.com',
      phone: '+1 (408) 555-0273',
      location: 'San Jose, CA',
      linkedin: 'linkedin.com/in/samuelosei-embedded',
      github: 'github.com/samuelosei-fw',
      website: '',
    },
    summaryTitle: 'Firmware Profile',
    summary:
      'Embedded Systems Engineer with 9+ years developing bare-metal and FreeRTOS firmware in C/C++ for low-power IoT microcontrollers (ARM Cortex-M), BLE, and wireless sensor arrays.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Google Nest Hardware',
        role: 'Senior Firmware Engineer',
        location: 'Mountain View, CA',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Authored ultra-low-power sleep state routines extending IoT battery lifespan by 42% on Nordic nRF52 BLE chips.',
          'Built robust OTA firmware update mechanism with dual-bank cryptographic rollback protections.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Purdue University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Electrical & Computer Engineering',
        location: 'West Lafayette, IN',
        startDate: '2011',
        endDate: '2015',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Firmware Tech',
        skills: [
          { id: 'sk-1', name: 'Embedded C / C++ & ARM Cortex-M', level: 'Expert' },
          { id: 'sk-2', name: 'FreeRTOS & Low-Power State Management', level: 'Expert' },
          { id: 'sk-3', name: 'I2C, SPI, UART & BLE Protocols', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 38. Kavita Singh - University CS Lecturer (Education / Teaching)
  kavita_singh: {
    personalInfo: {
      fullName: 'Kavita Singh, Ph.D.',
      jobTitle: 'Assistant Professor of Computer Science',
      email: 'kavita.singh@university.edu',
      phone: '+1 (217) 555-0249',
      location: 'Champaign, IL',
      linkedin: 'linkedin.com/in/kavitasingh-prof',
      github: 'github.com/kavitasingh-research',
      website: '',
    },
    summaryTitle: 'Academic Profile',
    summary:
      'Computer Science Professor with 7+ years teaching undergraduate algorithms, data structures, and distributed databases. Published 14 peer-reviewed research papers in ACM and IEEE proceedings.',
    experiences: [
      {
        id: 'exp-1',
        company: 'University of Illinois at Urbana-Champaign',
        role: 'Assistant Professor of Computer Science',
        location: 'Urbana, IL',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Taught foundational Data Structures & Algorithms course to 400+ students per semester with 4.8/5.0 student rating.',
          'Secured $450k NSF research grant investigating fault-tolerant consensus in distributed ledger systems.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Wisconsin–Madison',
        degree: 'Ph.D. in Computer Science',
        fieldOfStudy: 'Distributed Systems & Database Architectures',
        location: 'Madison, WI',
        startDate: '2014',
        endDate: '2019',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Teaching & Research',
        skills: [
          { id: 'sk-1', name: 'Algorithms, Complexity & Data Structures', level: 'Expert' },
          { id: 'sk-2', name: 'Distributed Systems & Consensus Research', level: 'Expert' },
          { id: 'sk-3', name: 'Curriculum Assessment & Grant Writing', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'tags',
    projects: [],
    certifications: [],
  },

  // 39. Oliver Wright - Technical Writer & API Documenter (Simple / Minimal)
  oliver_wright: {
    personalInfo: {
      fullName: 'Oliver Wright',
      jobTitle: 'Senior Technical Writer & API Documenter',
      email: 'oliver.wright@techdocs.io',
      phone: '+1 (503) 555-0279',
      location: 'Portland, OR',
      linkedin: 'linkedin.com/in/oliverwright-writer',
      github: 'github.com/oliverwright-docs',
      website: '',
    },
    summaryTitle: 'Documentation Focus',
    summary:
      'Technical Writer with 7+ years crafting developer documentation, OpenAPI 3.0 specs, SDK quickstart guides, and documentation sites that reduce developer support tickets by over 40%.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Twilio Inc.',
        role: 'Senior Technical Writer',
        location: 'Remote, US',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: [
          'Authored interactive REST API documentation and onboarding guides utilized by 150k+ registered developers.',
          'Migrated legacy Markdown docs to Docusaurus with automated GitHub Actions CI/CD link validation.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of Oregon',
        degree: 'BA',
        fieldOfStudy: 'English & Technical Communication',
        location: 'Eugene, OR',
        startDate: '2013',
        endDate: '2017',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Documentation Tools',
        skills: [
          { id: 'sk-1', name: 'OpenAPI 3.0, Swagger & Postman', level: 'Expert' },
          { id: 'sk-2', name: 'Markdown, Docusaurus & Docs-as-Code', level: 'Expert' },
          { id: 'sk-3', name: 'API Reference & SDK Sample Creation', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [],
  },

  // 40. Grace Hooper - Systems & Database Administrator (Two-Column)
  grace_hooper: {
    personalInfo: {
      fullName: 'Grace Hooper',
      jobTitle: 'Senior Database & Systems Administrator',
      email: 'grace.hooper@sysadmin.net',
      phone: '+1 (412) 555-0218',
      location: 'Pittsburgh, PA',
      linkedin: 'linkedin.com/in/gracehooper-dba',
      github: 'github.com/gracehooper-db',
      website: '',
    },
    summaryTitle: 'Database Profile',
    summary:
      'Database Administrator with 9+ years configuring high-availability PostgreSQL and Oracle RAC clusters, zero-loss automated backups, and 99.999% uptime for financial transaction engines.',
    experiences: [
      {
        id: 'exp-1',
        company: 'BNY Mellon',
        role: 'Lead PostgreSQL DBA',
        location: 'Pittsburgh, PA',
        startDate: '2019',
        endDate: 'Present',
        current: true,
        bullets: [
          'Manage 120+ mission-critical PostgreSQL databases sustaining 18k queries per second.',
          'Engineered streaming replication with automated failover via Patroni, reducing recovery time to under 15 seconds.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Carnegie Mellon University',
        degree: 'BS',
        fieldOfStudy: 'Information Systems',
        location: 'Pittsburgh, PA',
        startDate: '2011',
        endDate: '2015',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Database Systems',
        skills: [
          { id: 'sk-1', name: 'PostgreSQL & Patroni HA Clustering', level: 'Expert' },
          { id: 'sk-2', name: 'Performance Tuning & Vacuum Optimization', level: 'Expert' },
          { id: 'sk-3', name: 'Linux Kernel & Storage Tuning (ZFS/ext4)', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [{ id: 'cert-1', name: 'PostgreSQL Certified Professional', issuer: 'PostgreSQL Guild', issueDate: '2021' }],
  },

  // 41. Richard Sterling - Chief Operating Officer (Executive / Professional)
  richard_sterling: {
    personalInfo: {
      fullName: 'Richard Sterling',
      jobTitle: 'Chief Operating Officer (COO)',
      email: 'richard.sterling@sterlingops.com',
      phone: '+1 (212) 555-0299',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/richardsterling-coo',
      github: '',
      website: '',
    },
    summaryTitle: 'Executive Leadership',
    summary:
      'Transformational Chief Operating Officer with 18+ years directing corporate strategy, P&L operations ($180M+), global supply chain expansion, and post-merger integration for multinational industrial firms.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Apex Industrial Technologies',
        role: 'Chief Operating Officer',
        location: 'New York, NY',
        startDate: '2018',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led operational restructuring across 11 international facilities, increasing consolidated EBITDA margin by 420 basis points.',
          'Spearheaded integration of $85M strategic competitor acquisition, achieving $12M run-rate synergies in 9 months.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Columbia Business School',
        degree: 'Master of Business Administration (MBA)',
        fieldOfStudy: 'Executive Leadership & Finance',
        location: 'New York, NY',
        startDate: '2004',
        endDate: '2006',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Executive Mastery',
        skills: [
          { id: 'sk-1', name: 'Global P&L & EBITDA Expansion', level: 'Expert' },
          { id: 'sk-2', name: 'Post-Merger Integration (PMI)', level: 'Expert' },
          { id: 'sk-3', name: 'Board Governance & Capital Allocation', level: 'Expert' },
        ],
      },
    ],
    skillsDisplayStyle: 'text',
    projects: [],
    certifications: [],
  },

  // 42. Teresa Nguyen - Agile Scrum Master & Agile Coach (Compact)
  teresa_nguyen: {
    personalInfo: {
      fullName: 'Teresa Nguyen, CSP-SM',
      jobTitle: 'Principal Agile Coach & Scrum Master',
      email: 'teresa.nguyen@agilecoach.io',
      phone: '+1 (415) 555-0266',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/teresanguyen-agile',
      github: '',
      website: '',
    },
    summaryTitle: 'Agile Coaching Profile',
    summary:
      'Certified Scrum Professional with 8+ years coaching distributed engineering squads, optimizing Jira sprint cadences, and driving high-velocity continuous delivery cultures.',
    experiences: [
      {
        id: 'exp-1',
        company: 'Atlassian Ecosystem',
        role: 'Principal Agile Coach',
        location: 'San Francisco, CA',
        startDate: '2020',
        endDate: 'Present',
        current: true,
        bullets: [
          'Coached 8 cross-functional engineering squads, increasing sprint delivery predictability from 61% to 92%.',
          'Instituted retrospective action-item framework that reduced recurring engineering blockers by 45%.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'San Francisco State University',
        degree: 'BS',
        fieldOfStudy: 'Business Information Systems',
        location: 'San Francisco, CA',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    skills: [
      {
        id: 'cat-1',
        categoryName: 'Agile Methodologies',
        skills: [
          { id: 'sk-1', name: 'Scrum, Kanban & SAFe Frameworks', level: 'Expert' },
          { id: 'sk-2', name: 'Sprint Planning, Retrospectives & Velocity Tracking', level: 'Expert' },
          { id: 'sk-3', name: 'Jira Software & Confluence Advanced Administration', level: 'Advanced' },
        ],
      },
    ],
    skillsDisplayStyle: 'bars',
    projects: [],
    certifications: [
      { id: 'cert-1', name: 'Certified Scrum Professional (CSP-SM)', issuer: 'Scrum Alliance', issueDate: '2021' },
    ],
  },
};
