/**
 * seedNonTechnicalData.ts — ProofHire Non-Technical Track Seed Script
 *
 * Seeds real NON_TECHNICAL challenges and job opportunities:
 * - Marketing Campaign Challenge
 * - HR Case Study & Onboarding System
 * - Business Analysis & Strategy
 * - UI/UX Experience Redesign
 * - Content Strategy & Brand Storytelling
 * - Product Management Feature PRD
 * - B2B Sales Discovery & Playbook
 * - Operations & Process Optimization
 *
 * Also seeds realistic Non-Tech job openings for Discover.
 */
import mongoose from 'mongoose';
import Challenge from '../models/Challenge';
import Job from '../models/Job';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const future = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
};

export const NON_TECHNICAL_CHALLENGES = [
  {
    slug: 'marketing-campaign-challenge',
    title: '30-Day Product Marketing Campaign',
    description: `
Design a comprehensive 30-day go-to-market and growth campaign for launching a new AI productivity workspace.
Your submission should define target customer personas, select high-ROI acquisition channels (organic, paid, influencer, content), create an editorial and messaging cadence, and establish measurable KPI benchmarks (CAC, conversion rate, MRR targets).
Submit your campaign strategy as a PDF/document or link to your presentation/workspace.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Marketing',
    domain: 'Marketing & Growth',
    type: 'CASE_STUDY',
    careerArea: 'Marketing',
    allowedSubmissionTypes: ['CAMPAIGN_STRATEGY', 'MARKETING_PLAN', 'MARKET_RESEARCH', 'CONTENT_STRATEGY', 'CASE_STUDY', 'PRESENTATION', 'DOCUMENT'],
    company: 'Canva Growth Lab',
    duration: '4-6 hours',
    estimatedTime: '4-6 hours',
    deadline: future(90),
    skills: ['Marketing Strategy', 'Growth Marketing', 'User Acquisition', 'Campaign Planning', 'KPI Analysis'],
    skillsTargeted: ['Persona Definition', 'Channel Strategy', 'Conversion Funnel', 'Messaging Architecture'],
    technologies: ['Notion / Docs', 'Google Slides', 'Analytics Frameworks', 'Canva'],
    tags: ['marketing', 'growth', 'campaign', 'gtm', 'strategy'],
    requirements: [
      'Define at least 2 primary target audience personas with pain points and value propositions',
      'Detail week-by-week channel distribution strategy across Weeks 1-4',
      'Propose a $10,000 pilot budget breakdown with expected return on ad spend (ROAS)',
      'Specify 5 core success metrics and measurement methodology',
      'Include sample ad copy and landing page headline concepts'
    ],
    deliverables: [
      'Campaign strategy document or slide deck (PDF / DOCX or workspace link)',
      '1-page executive summary covering timeline, budget, and KPIs'
    ],
    evaluationCriteria: [
      'Clarity of customer persona insights and problem-solution alignment',
      'Feasibility and realism of budget allocation and channel selection',
      'Creativity in messaging and brand positioning',
      'Analytical rigor in KPI forecasting'
    ],
    starterConstraints: 'Non-technical submission. Focus on business reasoning, strategy, and execution clarity.',
    status: 'OPEN'
  },
  {
    slug: 'hr-case-study-onboarding',
    title: 'Candidate Screening & Remote Onboarding Framework',
    description: `
Design an end-to-end recruitment screening rubric and a structured 30-60-90 day remote onboarding journey for a high-growth company.
Develop behavioral evaluation scorecards to mitigate interviewer bias, create a standardized offer presentation flow, and map out mentorship pairing, milestone check-ins, and retention feedback loops.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'Human Resources',
    domain: 'People Operations',
    type: 'CASE_STUDY',
    careerArea: 'Human Resources (HR)',
    allowedSubmissionTypes: ['RECRUITMENT_STRATEGY', 'HR_CASE_STUDY', 'EMPLOYEE_ENGAGEMENT_PLAN', 'HIRING_PROCESS_PROPOSAL', 'PEOPLE_OPERATIONS_ANALYSIS', 'CASE_STUDY', 'DOCUMENT'],
    company: 'Deel People Operations',
    duration: '4-5 hours',
    estimatedTime: '4-5 hours',
    deadline: future(90),
    skills: ['Talent Acquisition', 'Onboarding Design', 'Employee Retention', 'Interview Rubrics', 'People Ops'],
    skillsTargeted: ['Structured Interviewing', 'Remote Culture', 'Performance Milestones', 'Bias Mitigation'],
    technologies: ['HRIS Frameworks', 'Docs / Notion', 'LMS Workflows'],
    tags: ['hr', 'people-ops', 'talent', 'onboarding', 'retention'],
    requirements: [
      'Create a 5-dimension structured interview scorecard with behavioral rating anchors',
      'Design a 30-60-90 day onboarding checklist for new hires and hiring managers',
      'Outline a continuous feedback mechanism (surveys, 1-on-1s, 6-month check-in)',
      'Provide guidelines for remote inclusion and cross-functional team integration'
    ],
    deliverables: [
      'Comprehensive People Operations guide (PDF or shared workspace)',
      'Hiring manager scorecard template'
    ],
    evaluationCriteria: [
      'Practicality and empathy in onboarding journey design',
      'Robustness of structured evaluation criteria',
      'Scalability for distributed and asynchronous teams'
    ],
    starterConstraints: 'Focus on organizational design, culture, and employee success.',
    status: 'OPEN'
  },
  {
    slug: 'business-analysis-scenario',
    title: 'Business Scenario Analysis & Growth Strategy',
    description: `
Analyze a realistic business case study where a B2B SaaS platform is experiencing a 15% increase in churn while customer acquisition costs have risen by 25%.
Formulate a diagnostic hypothesis, perform root-cause analysis across pricing, product-market fit, and customer success, and propose an actionable 6-month recovery strategy with projected revenue impact.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'HARD',
    category: 'Business Analysis',
    domain: 'Business Strategy',
    type: 'CASE_STUDY',
    careerArea: 'Business Analysis',
    allowedSubmissionTypes: ['BUSINESS_CASE', 'REQUIREMENTS_DOCUMENT', 'BUSINESS_ANALYSIS', 'PROCESS_ANALYSIS', 'DATA_INSIGHT_REPORT', 'CASE_STUDY', 'DOCUMENT'],
    company: 'McKinsey Strategy Lab',
    duration: '5-7 hours',
    estimatedTime: '5-7 hours',
    deadline: future(90),
    skills: ['Business Strategy', 'Financial Modeling', 'Churn Analysis', 'Root Cause Analysis', 'Executive Presentation'],
    skillsTargeted: ['Unit Economics', 'Cohort Analysis', 'Strategic Roadmapping', 'Value Proposition'],
    technologies: ['Excel / Sheets', 'PowerPoint / Slides', 'Business Model Canvas'],
    tags: ['business-analysis', 'strategy', 'saas', 'churn', 'economics'],
    requirements: [
      'Identify top 3 probable root causes behind declining retention and rising CAC',
      'Present a financial sensitivity model showing impact of 5% churn reduction on LTV',
      'Propose 4 prioritized strategic interventions with owner and estimated timeline',
      'Draft a 1-page executive briefing suitable for the Board of Directors'
    ],
    deliverables: [
      'Business analysis report or slide deck',
      'Actionable recommendations table with resource estimation'
    ],
    evaluationCriteria: [
      'Depth of strategic reasoning and financial literacy',
      'Structured problem-solving (e.g. MECE framework)',
      'Executive communication clarity and conviction'
    ],
    starterConstraints: 'No code required. Evaluate through business intuition, unit economics, and data synthesis.',
    status: 'OPEN'
  },
  {
    slug: 'uiux-mobile-experience-redesign',
    title: 'Mobile Checkout Experience UX Redesign',
    description: `
Conduct a UX audit of a multi-step mobile e-commerce checkout flow with a reported 42% drop-off rate.
Identify cognitive friction points, form fatigue, and trust barriers. Propose an optimized wireframe flow, interactive micro-copy improvements, and a frictionless single-page or progressive disclosure checkout experience.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'MEDIUM',
    category: 'UI/UX Design',
    domain: 'Product Design',
    type: 'CASE_STUDY',
    careerArea: 'UI/UX Design',
    allowedSubmissionTypes: ['UI_UX_CASE_STUDY', 'RESEARCH_REPORT', 'WIREFRAME_PROTOTYPE', 'DESIGN_SYSTEM', 'USABILITY_ANALYSIS', 'WORK_SAMPLE', 'EXTERNAL_WORK_LINK'],
    company: 'Figma Design Studios',
    duration: '4-6 hours',
    estimatedTime: '4-6 hours',
    deadline: future(90),
    skills: ['UX Research', 'Wireframing', 'Information Architecture', 'Usability Heuristics', 'Design Systems'],
    skillsTargeted: ['Cognitive Load Reduction', 'Progressive Disclosure', 'Accessibility', 'Mobile Usability'],
    technologies: ['Figma / Miro', 'Design Thinking', 'Wireframing'],
    tags: ['design', 'ui-ux', 'mobile-ux', 'wireframes', 'heuristics'],
    requirements: [
      'Heuristic evaluation of existing 4-step mobile checkout identifying at least 5 usability issues',
      'User journey map comparing "Current Experience" vs "Proposed Redesign"',
      'Wireframe layout (sketches or Figma link) demonstrating progressive disclosure checkout',
      'Accessibility review ensuring WCAG AA contrast, touch target sizes, and error recovery'
    ],
    deliverables: [
      'UX Audit Report and annotated wireframes (PDF or Figma link)',
      'Summary of anticipated conversion lift rationale'
    ],
    evaluationCriteria: [
      'Application of established usability heuristics (Nielsen Norman Group)',
      'Clarity of user-centered problem identification',
      'Simplicity and elegance of proposed wireframes'
    ],
    starterConstraints: 'Submit visual designs, wireframes, or detailed UX documentation.',
    status: 'OPEN'
  },
  {
    slug: 'content-strategy-brand-storytelling',
    title: 'Content Strategy & Brand Storytelling Playbook',
    description: `
Develop a quarterly content strategy playbook for an emerging sustainable lifestyle brand entering a crowded consumer market.
Define brand voice and tone guidelines, establish core content pillars (educational, inspirational, promotional), map content across the customer purchase journey, and produce 3 high-impact sample content pieces.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'EASY',
    category: 'Content Strategy',
    domain: 'Brand & Communications',
    type: 'CASE_STUDY',
    careerArea: 'Content Strategy',
    allowedSubmissionTypes: ['CONTENT_STRATEGY', 'CONTENT_PORTFOLIO', 'EDITORIAL_PLAN', 'CONTENT_SAMPLE', 'WORK_SAMPLE', 'DOCUMENT'],
    company: 'Notion Media Group',
    duration: '3-4 hours',
    estimatedTime: '3-4 hours',
    deadline: future(90),
    skills: ['Content Strategy', 'Brand Voice', 'Copywriting', 'Editorial Planning', 'Storytelling'],
    skillsTargeted: ['Brand Guidelines', 'Funnel Content Mapping', 'Audience Engagement', 'Copy Craft'],
    technologies: ['Notion / Docs', 'Editorial Calendars', 'Social Media Frameworks'],
    tags: ['content', 'brand', 'storytelling', 'editorial', 'writing'],
    requirements: [
      'Define brand voice attributes with "We are X, We are NOT Y" guidelines',
      'Create 3 content pillars tied to business goals and audience interests',
      'Design a 4-week editorial calendar matrix (channels, themes, formats)',
      'Write 3 complete sample content assets (e.g. newsletter, blog hook, launch post)'
    ],
    deliverables: [
      'Content Strategy Playbook (PDF or workspace link)',
      '3 polished sample written assets'
    ],
    evaluationCriteria: [
      'Consistency and distinctiveness of brand tone',
      'Strategic alignment between content themes and commercial objectives',
      'Quality and engagement value of sample copy'
    ],
    starterConstraints: 'Non-technical writing and strategic content design.',
    status: 'OPEN'
  },
  {
    slug: 'product-management-feature-prd',
    title: 'Product Requirements Document (PRD): Collaborative Workspace',
    description: `
Author a structured Product Requirements Document (PRD) for an asynchronous team collaboration feature.
Detail user problem validation, out-of-scope boundaries, functional requirements, user stories with acceptance criteria, edge case handling, and release launch milestones.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'HARD',
    category: 'Product Management',
    domain: 'Product Strategy',
    type: 'CASE_STUDY',
    careerArea: 'Product Management',
    allowedSubmissionTypes: ['BUSINESS_CASE', 'REQUIREMENTS_DOCUMENT', 'STRATEGY_DOCUMENT', 'CASE_STUDY', 'DOCUMENT'],
    company: 'Linear Systems',
    duration: '6-8 hours',
    estimatedTime: '6-8 hours',
    deadline: future(90),
    skills: ['Product Management', 'PRD Authoring', 'User Stories', 'Prioritization', 'Cross-Functional Leadership'],
    skillsTargeted: ['Requirement Scoping', 'Acceptance Criteria', 'Release Milestones', 'Feature Trade-offs'],
    technologies: ['Product Frameworks', 'Notion / Coda', 'Jira / Linear Epics'],
    tags: ['product-management', 'prd', 'scrum', 'features', 'roadmap'],
    requirements: [
      'Problem statement with quantitative or qualitative customer evidence',
      'Target user personas and prioritized user stories in "As a... I want to... So that..." format',
      'Detailed functional requirements with explicit edge cases and non-goals',
      'Success metrics definition (adoption rate, retention, feature engagement)',
      'Phase 1 MVP vs Phase 2 enhancement roadmap breakdown'
    ],
    deliverables: [
      'Complete PRD document (PDF or shared workspace link)',
      'Feature prioritization matrix (e.g. RICE framework)'
    ],
    evaluationCriteria: [
      'Rigor of feature definition and ambiguity elimination',
      'Clarity of user stories and verifiable acceptance criteria',
      'Pragmatism in MVP scope boundaries'
    ],
    starterConstraints: 'Product management specification only. No coding.',
    status: 'OPEN'
  },
  {
    slug: 'enterprise-sales-playbook',
    title: 'B2B Enterprise Sales Discovery Playbook',
    description: `
Create an outbound enterprise sales discovery framework and objection handling playbook for an enterprise security platform.
Formulate high-yield discovery questions using the MEDDIC or Challenger framework, construct multi-touch prospecting cadences, and write concise objection responses for Budget, Timing, and Competitor entrenchment.
    `.trim(),
    track: 'NON_TECHNICAL',
    difficulty: 'EASY',
    category: 'Sales',
    domain: 'Business Development',
    type: 'CASE_STUDY',
    careerArea: 'Business Development',
    allowedSubmissionTypes: ['SALES_PLAYBOOK', 'LEAD_GENERATION_STRATEGY', 'MARKET_EXPANSION_PLAN', 'CUSTOMER_DISCOVERY', 'SALES_ANALYSIS', 'CASE_STUDY', 'DOCUMENT', 'PRESENTATION'],
    company: 'Salesforce Commercial',
    duration: '3-4 hours',
    estimatedTime: '3-4 hours',
    deadline: future(90),
    skills: ['B2B Sales', 'MEDDIC', 'Objection Handling', 'Discovery Frameworks', 'Pipeline Generation'],
    skillsTargeted: ['Value Selling', 'Outbound Cadence', 'Pain Identification', 'Closing Strategies'],
    technologies: ['Sales Enablement Docs', 'CRM Playbooks'],
    tags: ['sales', 'b2b', 'enterprise', 'meddic', 'playbook'],
    requirements: [
      'Construct a 10-question discovery question bank mapped to Economic Buyer, Decision Criteria, and Pain',
      'Draft a 5-step outbound email cadence for C-level executives',
      'Create standard objection handling scripts for: "No budget", "We use competitor X", and "Call us next quarter"',
      'Outline qualification criteria to advance leads from Stage 1 to Stage 2'
    ],
    deliverables: [
      'Sales Playbook guide (PDF or workspace link)'
    ],
    evaluationCriteria: [
      'Value-oriented consultative sales acumen',
      'Professionalism and conciseness in executive messaging',
      'Relevance and persuasion in objection handling'
    ],
    starterConstraints: 'Sales strategy and commercial communication.',
    status: 'OPEN'
  }
];

export const NON_TECHNICAL_JOBS = [
  {
    title: 'Marketing Specialist & Growth Associate',
    company: 'Canva Growth Lab',
    industry: 'Creative & Digital Media',
    department: 'Marketing',
    location: 'Remote',
    locationType: 'REMOTE',
    workMode: 'Remote',
    type: 'FULL_TIME',
    seniority: 'JUNIOR',
    track: 'NON_TECHNICAL',
    description: 'Lead multi-channel digital campaigns, coordinate brand content, and optimize user acquisition funnels for our expanding global consumer product lines.',
    requiredSkills: ['Marketing Strategy', 'Campaign Planning', 'Growth Marketing', 'Content Strategy'],
    preferredSkills: ['Google Analytics', 'Social Media', 'Creative Direction'],
    requirements: ['Demonstrated proof of work in campaign design or digital marketing', 'Strong written communication and analytical reasoning'],
    minCapabilitySignal: 60,
    status: 'ACTIVE'
  },
  {
    title: 'HR & People Operations Associate',
    company: 'Deel People Operations',
    industry: 'HR Tech & Global Employment',
    department: 'Human Resources',
    location: 'Remote / New York',
    locationType: 'HYBRID',
    workMode: 'Hybrid',
    type: 'FULL_TIME',
    seniority: 'JUNIOR',
    track: 'NON_TECHNICAL',
    description: 'Help scale our candidate onboarding, structured interview rubrics, and remote cultural initiatives across distributed international teams.',
    requiredSkills: ['Talent Acquisition', 'Onboarding Design', 'People Operations', 'Employee Retention'],
    preferredSkills: ['HRIS Management', 'Diversity & Inclusion', 'Employee Engagement'],
    requirements: ['Strong organizational design sense and interpersonal communication', 'Experience designing hiring rubrics or onboarding documentation'],
    minCapabilitySignal: 60,
    status: 'ACTIVE'
  },
  {
    title: 'Junior Business Analyst',
    company: 'McKinsey Strategy Lab',
    industry: 'Management Consulting',
    department: 'Business Analysis',
    location: 'San Francisco, CA / Remote',
    locationType: 'REMOTE',
    workMode: 'Remote',
    type: 'FULL_TIME',
    seniority: 'JUNIOR',
    track: 'NON_TECHNICAL',
    description: 'Conduct market sizing, business case diagnosis, unit economic evaluations, and synthesize executive slide decks for strategic client engagements.',
    requiredSkills: ['Business Strategy', 'Financial Modeling', 'Root Cause Analysis', 'Executive Presentation'],
    preferredSkills: ['Excel / Sheets', 'Market Research', 'Competitive Analysis'],
    requirements: ['Structured problem-solving skills', 'Proven case study or business evaluation artifacts'],
    minCapabilitySignal: 65,
    status: 'ACTIVE'
  },
  {
    title: 'Product Designer (UI/UX)',
    company: 'Figma Design Studios',
    industry: 'Design Software',
    department: 'UI/UX Design',
    location: 'Remote',
    locationType: 'REMOTE',
    workMode: 'Remote',
    type: 'FULL_TIME',
    seniority: 'MID',
    track: 'NON_TECHNICAL',
    description: 'Design intuitive, accessible user journeys and mobile flows. Conduct heuristic audits and collaborate closely with product management on user empathy.',
    requiredSkills: ['UX Research', 'Wireframing', 'Information Architecture', 'Design Systems'],
    preferredSkills: ['Figma', 'Interactive Prototyping', 'Accessibility (WCAG)'],
    requirements: ['Portfolio or proof-of-work showing wireframes and user problem resolution', 'Solid understanding of usability heuristics'],
    minCapabilitySignal: 65,
    status: 'ACTIVE'
  },
  {
    title: 'Content Strategist & Copywriter',
    company: 'Notion Media Group',
    industry: 'Productivity & Media',
    department: 'Content & Brand',
    location: 'Remote',
    locationType: 'REMOTE',
    workMode: 'Remote',
    type: 'FULL_TIME',
    seniority: 'JUNIOR',
    track: 'NON_TECHNICAL',
    description: 'Develop brand editorial calendars, author educational customer guides, and craft distinctive product storytelling that resonates with modern creators.',
    requiredSkills: ['Content Strategy', 'Brand Voice', 'Copywriting', 'Storytelling'],
    preferredSkills: ['SEO Fundamentals', 'Newsletter Curation', 'Social Copy'],
    requirements: ['Exceptional writing clarity and portfolio of published articles or case studies', 'Strong understanding of audience-first messaging'],
    minCapabilitySignal: 60,
    status: 'ACTIVE'
  },
  {
    title: 'Associate Product Manager',
    company: 'Linear Systems',
    industry: 'Productivity Software',
    department: 'Product Management',
    location: 'Remote',
    locationType: 'REMOTE',
    workMode: 'Remote',
    type: 'FULL_TIME',
    seniority: 'JUNIOR',
    track: 'NON_TECHNICAL',
    description: 'Define product requirements, synthesize user feedback, write clear PRDs, and partner with cross-functional stakeholders on feature rollouts.',
    requiredSkills: ['Product Management', 'PRD Authoring', 'User Stories', 'Prioritization'],
    preferredSkills: ['Customer Discovery', 'Roadmapping', 'Agile / Scrum'],
    requirements: ['Experience writing PRDs or case studies validating user pain points', 'Excellent structured analytical thinking'],
    minCapabilitySignal: 65,
    status: 'ACTIVE'
  }
];

export async function seedNonTechnical() {
  console.log('--- Seeding ProofHire Non-Technical Challenges & Jobs ---');

  // 1. Seed non-technical challenges
  let challengeCount = 0;
  for (const c of NON_TECHNICAL_CHALLENGES) {
    await Challenge.findOneAndUpdate(
      { slug: c.slug },
      { $set: c },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    challengeCount++;
  }
  console.log(`✓ Upserted ${challengeCount} NON_TECHNICAL challenges.`);

  // 2. Find a recruiter or create one for job association
  let recruiter = await User.findOne({ role: 'RECRUITER' });
  if (!recruiter) {
    const salt = await bcrypt.genSalt(10);
    const pwd = await bcrypt.hash('password123', salt);
    recruiter = await User.create({
      firstName: 'Rachel',
      lastName: 'Recruiter',
      email: 'recruiter.talent@proofhire.io',
      password: pwd,
      role: 'RECRUITER'
    });
  }

  // 3. Seed non-technical jobs
  let jobCount = 0;
  for (const j of NON_TECHNICAL_JOBS) {
    await Job.findOneAndUpdate(
      { title: j.title, company: j.company },
      { $set: { ...j, recruiter: recruiter._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    jobCount++;
  }
  console.log(`✓ Upserted ${jobCount} NON_TECHNICAL job openings.`);

  // 4. Ensure non-technical candidate user exists
  const salt = await bcrypt.genSalt(10);
  const pwd = await bcrypt.hash('password123', salt);
  let nonTechUser = await User.findOne({ email: 'candidate.nontech@proofhire.io' });
  if (!nonTechUser) {
    nonTechUser = await User.create({
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'candidate.nontech@proofhire.io',
      password: pwd,
      role: 'CANDIDATE',
      track: 'NON_TECHNICAL'
    });
    console.log('✓ Created non-technical test user: candidate.nontech@proofhire.io');
  } else {
    nonTechUser.track = 'NON_TECHNICAL';
    nonTechUser.password = pwd;
    await nonTechUser.save();
    console.log('✓ Updated candidate.nontech@proofhire.io to track: NON_TECHNICAL');
  }

  const activeNonTechChallenges = await Challenge.countDocuments({ track: 'NON_TECHNICAL', status: 'OPEN' });
  const activeNonTechJobs = await Job.countDocuments({ track: 'NON_TECHNICAL', status: 'ACTIVE' });
  console.log(`✓ Active NON_TECHNICAL Challenges in DB: ${activeNonTechChallenges}`);
  console.log(`✓ Active NON_TECHNICAL Jobs in DB: ${activeNonTechJobs}`);
}

if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofhire';
  mongoose.connect(mongoUri)
    .then(async () => {
      await seedNonTechnical();
      process.exit(0);
    })
    .catch(err => {
      console.error('Error seeding non-technical data:', err);
      process.exit(1);
    });
}
